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
import { PdfLibrary } from './components/PdfLibrary';
import { LoginScreen } from './components/LoginScreen';
import { db } from './services/databaseService';

const App: React.FC = () => {
  // Estado inicial do usuário é null (deslogado)
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'gallery' | 'ficha' | 'mapa' | 'dados' | 'ia' | 'campanha' | 'regras' | 'pdfs' | 'config'>('gallery');
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
    
    defesa: 10,
    protecao: 'Nenhuma',
    deslocamento: '9m',
    ataques: [],
    habilidades: [],

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

  // Initial Load (Data) - Executa após login
  useEffect(() => {
    if (currentUser) {
        const loadSystem = async () => {
          setIsLoading(true);
          try {
             await loadData();
          } catch (error) {
            console.error("System Boot Error:", error);
          } finally {
            setIsLoading(false);
          }
        };
        loadSystem();
    } else {
        setIsLoading(false); // Para mostrar a tela de login
    }
  }, [currentUser]);

  const loadData = async () => {
      // Carrega TODOS os agentes do banco (sem filtro de ID)
      const agents = await db.listAgents();
      
      // Migração de segurança: Garante IDs, Obliquo e Resistencias e Novos Campos
      const defaultAgente = createDefaultAgent();
      const validatedAgents = agents.map(a => ({
        ...defaultAgente, 
        ...a,
        id: a.id || Math.random().toString(36).substr(2, 9),
        obliquo: { ...defaultAgente.obliquo, ...a.obliquo },
        resistencias: { ...defaultAgente.resistencias, ...a.resistencias },
        ataques: a.ataques || [],
        habilidades: a.habilidades || []
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

  // Função para forçar atualização da campanha (Sync Manual)
  const handleRefreshCampaign = async () => {
      const updatedCampaign = await db.getCampaign();
      if (updatedCampaign) {
          setCurrentCampaign(updatedCampaign);
          return updatedCampaign;
      }
      return null;
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

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      await db.saveAgent(agente);
    }, 2000);

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [agente, currentUser, isLoading]);

  const handleSelectAgent = (selected: Agente) => {
    setAgente(selected);
    setActiveTab('ficha');
  };

  const handleAddAgent = (newAgent: Agente) => {
    setAgente(newAgent);
    setSavedAgents(prev => [...prev, newAgent]);
    db.saveAgent(newAgent);
    setActiveTab('ficha');
  };
  
  const handleDeleteAgent = async (agentId: string) => {
      if(confirm("ATENÇÃO: A exclusão é permanente. Confirmar protocolo de expurgo?")) {
          await db.deleteAgent(agentId);
          const newList = savedAgents.filter(a => a.id !== agentId);
          setSavedAgents(newList);
          if (agente.id === agentId) {
             const next = newList.length > 0 ? newList[0] : createDefaultAgent();
             setAgente(next);
             if (newList.length === 0) db.saveAgent(next);
          }
      }
  };

  const handleAttributeRoll = (attrName: string, value: number) => {
      const result: DiceResult = {
          diceType: 20,
          rolls: Array(value <= 0 ? 2 : value).fill(0).map(() => Math.floor(Math.random() * 20) + 1),
          final: 0,
          timestamp: Date.now(),
          isAttributeRoll: true
      };
      
      if (value <= 0) {
          result.final = Math.min(...result.rolls);
      } else {
          result.final = Math.max(...result.rolls);
      }
      
      setDiceHistory(prev => [result, ...prev].slice(0, 50));
      setActiveTab('dados');
  };

  const handleLogout = () => {
      setCurrentUser(null);
      // Opcional: Limpar estados ou fazer db.disconnect() se necessário
  };

  if (!currentUser) {
      return <LoginScreen onLoginSuccess={(user) => setCurrentUser(user)} />;
  }

  // Define os itens do menu lateral com base na permissão do usuário
  const menuItems = [
      { id: 'gallery', label: 'Agentes', icon: Icons.Users },
      { id: 'ficha', label: 'Dossiê', icon: Icons.FileText },
      { id: 'campanha', label: 'Missão', icon: Icons.Radio },
      { id: 'dados', label: 'Dados', icon: Icons.Dices },
      { id: 'mapa', label: 'Tático', icon: Icons.Map },
      { id: 'regras', label: 'Arquivos', icon: Icons.Book },
      { id: 'pdfs', label: 'Biblioteca', icon: Icons.Pdf },
  ];

  // Adiciona itens restritos apenas para Admins
  if (currentUser.role === 'admin') {
      menuItems.push({ id: 'ia', label: 'C.R.I.S.', icon: Icons.Ghost });
      menuItems.push({ id: 'config', label: 'Configurações', icon: Icons.Settings });
  }

  return (
    <div className="flex h-screen bg-black text-white font-sans overflow-hidden relative">
      
      {/* Sidebar (HUD Lateral) */}
      <aside className="w-20 lg:w-64 bg-zinc-950 border-r border-zinc-900 flex flex-col justify-between shrink-0 relative z-20">
        <div>
           {/* Header Logo */}
           <div className="p-6 flex items-center gap-3 border-b border-zinc-900">
              <div className="w-8 h-8 rounded-full border border-ordem-gold flex items-center justify-center bg-ordem-gold/10 animate-pulse-slow">
                 <span className="font-display text-ordem-gold text-xs">OP</span>
              </div>
              <h1 className="font-display text-xl tracking-widest hidden lg:block text-glow">ORDEM</h1>
           </div>

           {/* User Status */}
           <div className="p-6 border-b border-zinc-900">
               <div className="flex items-center gap-3">
                   <div className={`w-10 h-10 rounded border flex items-center justify-center text-lg font-bold ${currentUser.role === 'admin' ? 'bg-ordem-blood text-white border-ordem-red' : 'bg-zinc-800 text-zinc-400 border-zinc-700'}`}>
                       {currentUser.username.charAt(0).toUpperCase()}
                   </div>
                   <div className="hidden lg:block overflow-hidden">
                       <div className="text-sm font-bold text-white truncate">{currentUser.username}</div>
                       <div className="text-[10px] uppercase font-mono text-zinc-500">{currentUser.role === 'admin' ? 'Mestre // Admin' : 'Agente // Operador'}</div>
                   </div>
               </div>
           </div>

           {/* Navigation */}
           <nav className="p-4 space-y-2">
               {menuItems.map(item => (
                   <button
                       key={item.id}
                       onClick={() => setActiveTab(item.id as any)}
                       className={`w-full flex items-center gap-3 px-4 py-3 rounded-sm transition-all duration-300 group ${activeTab === item.id ? 'bg-zinc-900 border-l-2 border-ordem-gold text-white' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50'}`}
                   >
                       <span className={activeTab === item.id ? 'text-ordem-gold' : 'group-hover:text-white'}>
                           <item.icon />
                       </span>
                       <span className="hidden lg:block font-mono text-xs uppercase tracking-wider">{item.label}</span>
                   </button>
               ))}
           </nav>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-900">
            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2 text-zinc-600 hover:text-red-500 transition-colors">
                <Icons.WifiOff />
                <span className="hidden lg:block font-mono text-xs uppercase">Desconectar</span>
            </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden relative bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-opacity-5">
          <div className="absolute inset-0 bg-black/80 pointer-events-none z-0"></div>
          <div className="relative z-10 h-full p-4 lg:p-6 overflow-hidden">
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
              {activeTab === 'mapa' && (
                  <MapExplorer 
                      savedAgents={savedAgents} 
                      currentCampaign={currentCampaign}
                      currentUser={currentUser}
                      onUpdateCampaign={(c) => {
                          db.saveCampaign(c);
                          setCurrentCampaign(c);
                      }}
                  />
              )}
              {activeTab === 'dados' && (
                  <DiceRoller history={diceHistory} setHistory={setDiceHistory} />
              )}
              {activeTab === 'campanha' && (
                  <CampaignManager 
                      currentCampaign={currentCampaign} 
                      setCurrentCampaign={(c) => {
                          if (c) db.saveCampaign(c);
                          else db.deleteCampaign();
                          setCurrentCampaign(c);
                      }}
                      playerAgent={agente}
                      currentUser={currentUser}
                  />
              )}
              {activeTab === 'regras' && <MechanicsReference />}
              {activeTab === 'pdfs' && <PdfLibrary />}
              
              {/* Admin Only Tabs */}
              {activeTab === 'ia' && currentUser.role === 'admin' && (
                  <InvestigatorAssistant 
                      agents={savedAgents} 
                      onDeleteAgent={handleDeleteAgent}
                      onAddAgent={handleAddAgent}
                  />
              )}
              {activeTab === 'config' && currentUser.role === 'admin' && (
                  <Settings />
              )}
          </div>
      </main>
    </div>
  );
};

export default App;