
import React, { useState, useEffect, useRef } from 'react';
import { Agente, Classe, DiceResult, Campanha, User } from './types';
import { INITIAL_SKILLS, Icons } from './constants';
import { CharacterSheet } from './components/CharacterSheet';
import { DiceRoller } from './components/DiceRoller';
import { MapExplorer } from './components/MapExplorer';
import { InvestigatorAssistant } from './components/InvestigatorAssistant';
import { CampaignManager } from './components/CampaignManager';
import { CharacterGallery } from './components/CharacterGallery';
import { MechanicsReference } from './components/MechanicsReference';
import { Settings } from './components/Settings';
import { db } from './services/databaseService';

// Usuário padrão com acesso total (Admin/Mestre)
const DEFAULT_USER: User = {
    id: 'operator',
    username: 'Operador',
    role: 'admin'
};

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User>(DEFAULT_USER);
  const [activeTab, setActiveTab] = useState<'gallery' | 'ficha' | 'mapa' | 'dados' | 'ia' | 'campanha' | 'regras' | 'config'>('gallery');
  const [currentCampaign, setCurrentCampaign] = useState<Campanha | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Template base
  const createDefaultAgent = (): Agente => ({
    id: Date.now().toString(),
    nome: 'AGENTE DESCONHECIDO',
    origem: 'Desconhecida',
    classe: Classe.COMBATENTE,
    trilha: 'Nenhuma',
    nex: 5,
    patente: 'Recruta',
    atributos: { agi: 1, for: 1, int: 1, pre: 1, vig: 1 },
    status: {
      pvAtual: 20, pvMax: 20,
      sanAtual: 12, sanMax: 12,
      peAtual: 2, peMax: 2
    },
    pericias: JSON.parse(JSON.stringify(INITIAL_SKILLS)),
    inventario: '',
    detalhes: '',
    imagem: '',
    obliquo: {
      cabeca: { dano: 0, limite: 10, lesao: '' },
      torco: { dano: 0, limite: 25, lesao: '' },
      bracoEsq: { dano: 0, limite: 12, lesao: '' },
      bracoDir: { dano: 0, limite: 12, lesao: '' },
      pernaEsq: { dano: 0, limite: 15, lesao: '' },
      pernaDir: { dano: 0, limite: 15, lesao: '' }
    },
    resistencias: {
      fisica: 0, balistica: 0, corte: 0, impacto: 0, perfuracao: 0,
      eletricidade: 0, fogo: 0, frio: 0, quimico: 0,
      mental: 0, sangue: 0, morte: 0, energia: 0, conhecimento: 0, medo: 0
    }
  });

  const [savedAgents, setSavedAgents] = useState<Agente[]>([]);
  const [agente, setAgente] = useState<Agente>(createDefaultAgent());
  const [diceHistory, setDiceHistory] = useState<DiceResult[]>([]);
  
  // Ref para controlar debounce de salvamento
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initial Load (Session & Data)
  useEffect(() => {
    const loadSystem = async () => {
      setIsLoading(true);
      try {
         // Define usuário padrão e carrega todos os dados
         setCurrentUser(DEFAULT_USER);
         await loadData();
      } catch (error) {
        console.error("System Boot Error:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadSystem();
  }, []);

  const loadData = async () => {
      // Carrega TODOS os agentes do banco (sem filtro de ID)
      const agents = await db.listAgents();
      
      // Migração de segurança: Garante IDs, Obliquo e Resistencias
      const defaultAgente = createDefaultAgent();
      const validatedAgents = agents.map(a => ({
        ...defaultAgente, 
        ...a,
        id: a.id || Math.random().toString(36).substr(2, 9),
        obliquo: { ...defaultAgente.obliquo, ...a.obliquo },
        resistencias: { ...defaultAgente.resistencias, ...a.resistencias }
      }));

      setSavedAgents(validatedAgents);
      
      if (validatedAgents.length > 0) {
         setAgente(validatedAgents[0]);
      } else {
         const initial = createDefaultAgent();
         await db.saveAgent(initial);
         setSavedAgents([initial]);
         setAgente(initial);
      }

      const campaign = await db.getCampaign();
      setCurrentCampaign(campaign);
  };

  // Auto-Save
  useEffect(() => {
    if (!currentUser || isLoading) return;
    if (!agente.id) return;

    setSavedAgents(prevList => {
      const index = prevList.findIndex(a => a.id === agente.id);
      if (index !== -1 && JSON.stringify(prevList[index]) !== JSON.stringify(agente)) {
        const newList = [...prevList];
        newList[index] = agente;
        return newList;
      }
      return prevList;
    });

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      db.saveAgent(agente).catch(err => console.error("Falha no auto-save:", err));
    }, 1000);

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [agente, isLoading, currentUser]);

  const handleAttributeRoll = (attrName: string, value: number) => {
    setActiveTab('dados');
  };

  const handleSelectAgent = (selected: Agente) => {
    const defaultAgente = createDefaultAgent();
    // Garante merge profundo ao selecionar
    const mergedAgent = {
        ...defaultAgente,
        ...selected,
        obliquo: { ...defaultAgente.obliquo, ...selected.obliquo },
        resistencias: { ...defaultAgente.resistencias, ...selected.resistencias }
    };
    
    if (agente && agente.id) db.saveAgent(agente);
    setAgente(mergedAgent);
    setActiveTab('ficha');
  };

  const handleAddAgent = async (newAgent: Agente) => {
    const agentWithId = { 
        ...newAgent, 
        id: newAgent.id || Date.now().toString(),
        ownerId: currentUser?.id 
    };
    
    setSavedAgents(prev => [...prev, agentWithId]);
    setAgente(agentWithId);
    setActiveTab('ficha');
    await db.saveAgent(agentWithId);
  };

  const handleDeleteAgent = async (id: string) => {
    const newList = savedAgents.filter(a => a.id !== id);
    setSavedAgents(newList);
    await db.deleteAgent(id);
    
    if (agente.id === id) {
        if (newList.length > 0) {
            setAgente(newList[0]);
        } else {
            const newDefault = createDefaultAgent();
            await db.saveAgent(newDefault);
            setSavedAgents([newDefault]);
            setAgente(newDefault);
        }
    }
  };

  const menuItems = [
    { id: 'campanha', label: 'Missão', icon: Icons.Radio },
    { id: 'gallery', label: 'Agentes', icon: Icons.Users },
    { id: 'ficha', label: 'Dossiê', icon: Icons.FileText },
    { id: 'dados', label: 'Dados', icon: Icons.Dices },
    { id: 'mapa', label: 'Tático', icon: Icons.Map },
    { id: 'regras', label: 'Arquivos', icon: Icons.Book },
    { id: 'ia', label: 'C.R.I.S.', icon: Icons.Ghost },
    { id: 'config', label: 'Configurações', icon: Icons.Settings },
  ];

  if (isLoading) {
      return (
          <div className="flex h-screen w-screen bg-black items-center justify-center flex-col text-ordem-gold font-mono">
              <div className="w-12 h-12 border-4 border-ordem-gold border-t-transparent rounded-full animate-spin mb-4"></div>
              <div className="animate-pulse tracking-widest">INICIALIZANDO SISTEMA...</div>
          </div>
      )
  }

  return (
    <div className="flex h-screen bg-ordem-black text-gray-300 font-sans overflow-hidden relative z-10">
      
      {/* Sidebar Navigation */}
      <aside className="w-20 md:w-64 bg-ordem-panel border-r border-ordem-border flex flex-col relative z-20 shadow-[10px_0_30px_rgba(0,0,0,0.5)]">
        
        {/* Logo / Header */}
        <div className="h-24 flex items-center justify-center border-b border-ordem-border bg-black/40 relative overflow-hidden group">
           <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10"></div>
           <div className="relative z-10 flex flex-col items-center">
             <div className="text-4xl font-display text-ordem-gold drop-shadow-md tracking-wider">OP</div>
             <div className="text-[10px] tracking-[0.3em] text-zinc-500 uppercase mt-1 group-hover:text-ordem-gold transition-colors">Ordem Paranormal</div>
           </div>
        </div>

        {/* User Info Card */}
        <div className="p-4 border-b border-zinc-800 bg-zinc-900/50">
             <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded border border-ordem-blood text-ordem-red bg-red-900/20 flex items-center justify-center text-xs font-bold uppercase">
                     OP
                 </div>
                 <div className="flex-1 overflow-hidden">
                     <div className="text-sm font-display text-white truncate uppercase">{currentUser.username}</div>
                     <div className="text-[10px] font-mono uppercase text-ordem-red">
                         Acesso: Mestre
                     </div>
                 </div>
             </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 space-y-2 px-3 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-md transition-all duration-300 group relative overflow-hidden border ${isActive ? 'bg-ordem-gold/10 border-ordem-gold/30 text-ordem-gold' : 'border-transparent text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'}`}
              >
                {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-ordem-gold shadow-[0_0_10px_#d4b483]"></div>}
                <span className={`transition-transform duration-300 ${isActive ? 'scale-110 drop-shadow-[0_0_5px_rgba(212,180,131,0.5)]' : 'group-hover:scale-110'}`}>
                  <item.icon />
                </span>
                <span className={`font-mono text-sm uppercase tracking-wider hidden md:block ${isActive ? 'font-bold' : ''}`}>
                  {item.label}
                </span>
              </button>
            )
          })}
        </nav>

        {/* Footer Info */}
        <div className="p-4 border-t border-ordem-border bg-black/20 text-center md:text-left">
           <div className="text-[10px] text-zinc-600 font-mono uppercase flex items-center gap-2 justify-center md:justify-start">
             <span className={`w-2 h-2 rounded-full ${db.getStatus() ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
             <span className="hidden md:inline">{db.getStatus() ? 'DB: ONLINE' : 'DB: OFFLINE'}</span>
           </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden relative p-4 md:p-6">
         {/* Top CRT Scanline & Effects are global in index.html, but we add a local container effect */}
         <div className="absolute inset-0 bg-black/50 pointer-events-none z-0"></div>
         
         {/* Tab Content */}
         <div className="h-full relative z-10">
            {activeTab === 'gallery' && (
                <CharacterGallery 
                    agents={savedAgents} 
                    onSelectAgent={handleSelectAgent} 
                    onAddAgent={handleAddAgent}
                    onDeleteAgent={handleDeleteAgent}
                />
            )}
            {activeTab === 'ficha' && (
                <CharacterSheet 
                    agente={agente} 
                    setAgente={setAgente} 
                    onAttributeRoll={handleAttributeRoll}
                />
            )}
            {activeTab === 'dados' && (
                <DiceRoller history={diceHistory} setHistory={setDiceHistory} />
            )}
            {activeTab === 'mapa' && (
                <MapExplorer />
            )}
            {activeTab === 'ia' && (
                <InvestigatorAssistant 
                    agents={savedAgents}
                    onDeleteAgent={handleDeleteAgent}
                />
            )}
            {activeTab === 'campanha' && (
                <CampaignManager 
                    currentCampaign={currentCampaign}
                    setCurrentCampaign={(c) => {
                        setCurrentCampaign(c);
                        if (c) db.saveCampaign(c);
                        else db.deleteCampaign();
                    }}
                    playerAgent={agente}
                    currentUser={currentUser}
                />
            )}
            {activeTab === 'regras' && (
                <MechanicsReference />
            )}
            {activeTab === 'config' && (
                <Settings />
            )}
         </div>
      </main>
    </div>
  );
};

export default App;
    