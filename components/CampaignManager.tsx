
import React, { useState } from 'react';
import { Icons } from '../constants';
import { Campanha, Jogador, Agente, User } from '../types';

interface CampaignManagerProps {
  currentCampaign: Campanha | null;
  setCurrentCampaign: (c: Campanha | null) => void;
  playerAgent: Agente;
  currentUser: User;
}

export const CampaignManager: React.FC<CampaignManagerProps> = ({ currentCampaign, setCurrentCampaign, playerAgent, currentUser }) => {
  const [view, setView] = useState<'menu' | 'join' | 'create'>('menu');
  const [inputCode, setInputCode] = useState('');
  const [createForm, setCreateForm] = useState({ nome: '', descricao: '', mestre: '' });
  const [loading, setLoading] = useState(false);
  const [isImageFullscreen, setIsImageFullscreen] = useState(false);

  const generateCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'OP-';
    for(let i=0; i<4; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
    return code;
  }

  const handleCreate = () => {
    if (!createForm.nome || !createForm.mestre) return;
    setLoading(true);
    
    setTimeout(() => {
        const newCampaign: Campanha = {
            id: generateCode(),
            nome: createForm.nome,
            descricao: createForm.descricao,
            mestre: createForm.mestre,
            dataCriacao: Date.now(),
            jogadores: [
                {
                    id: currentUser.id,
                    nome: createForm.mestre,
                    classe: playerAgent.classe, 
                    isMestre: true,
                    status: 'Online'
                }
            ]
        };
        setCurrentCampaign(newCampaign);
        setLoading(false);
        setView('menu');
    }, 1500);
  };

  const handleJoin = () => {
      if (!inputCode) return;
      setLoading(true);
      
      setTimeout(() => {
          // Em um app real, aqui faria o fetch no DB central
          const mockCampaign: Campanha = {
              id: inputCode.toUpperCase(),
              nome: "Operação Círculo Vazio",
              descricao: "Investigação sobre desaparecimentos na região sul. Nível de Risco: Alto.",
              mestre: "Senhor Verissimo",
              dataCriacao: Date.now(),
              jogadores: [
                  { id: '1', nome: 'Senhor Verissimo', classe: 'Especialista' as any, isMestre: true, status: 'Online' },
                  { id: currentUser.id, nome: playerAgent.nome, classe: playerAgent.classe, isMestre: false, status: 'Online' },
                  { id: '3', nome: 'Agente Joui', classe: 'Combatente' as any, isMestre: false, status: 'Offline' }
              ]
          };
          setCurrentCampaign(mockCampaign);
          setLoading(false);
          setView('menu');
      }, 2000);
  }

  const handleLeave = () => {
      if(confirm("Tem certeza que deseja abandonar a missão atual?")) {
          setCurrentCampaign(null);
      }
  }

  const copyCode = () => {
      if(currentCampaign) {
          navigator.clipboard.writeText(currentCampaign.id);
          alert("Código copiado para a área de transferência.");
      }
  }

  const handleCampaignImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && currentCampaign) {
          const reader = new FileReader();
          reader.onload = (ev) => {
              const result = ev.target?.result as string;
              // Atualiza APENAS a imagem de capa da campanha, sem tocar no mapState (tático)
              const updatedCampaign: Campanha = {
                  ...currentCampaign,
                  campaignImage: result
              };
              setCurrentCampaign(updatedCampaign);
          };
          reader.readAsDataURL(file);
      }
  };

  const handleRemoveImage = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!currentCampaign) return;
      if (confirm("Deseja remover a imagem atual da campanha?")) {
          const updatedCampaign: Campanha = {
              ...currentCampaign,
              campaignImage: undefined // Remove a imagem
          };
          setCurrentCampaign(updatedCampaign);
      }
  };

  if (currentCampaign) {
      return (
        <div className="flex flex-col h-full bg-ordem-panel/50 rounded-lg border border-ordem-border relative overflow-hidden animate-in fade-in">
             {/* Header Mission */}
             <div className="bg-zinc-950 p-6 border-b border-ordem-gold/20 flex justify-between items-start relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-ordem-gold via-red-900 to-ordem-gold opacity-50"></div>
                <div>
                    <h2 className="text-2xl font-display text-white tracking-widest uppercase text-glow mb-1">{currentCampaign.nome}</h2>
                    <p className="font-mono text-zinc-500 text-xs uppercase">Mestre: {currentCampaign.mestre} // Início: {new Date(currentCampaign.dataCriacao).toLocaleDateString()}</p>
                </div>
                <div className="flex flex-col items-end">
                    <div className="flex items-center gap-2 bg-black border border-ordem-gold/30 px-3 py-1 rounded mb-2 group cursor-pointer hover:bg-ordem-gold/10" onClick={copyCode}>
                        <span className="font-mono text-xl text-ordem-gold font-bold tracking-widest">{currentCampaign.id}</span>
                        <Icons.Copy />
                    </div>
                    <span className="text-[10px] text-zinc-600 uppercase">Código de Acesso</span>
                </div>
             </div>

             <div className="flex-1 p-6 grid grid-cols-1 md:grid-cols-3 gap-6 overflow-hidden">
                {/* Mission Details */}
                <div className="md:col-span-2 space-y-6 flex flex-col">
                    <div className="bg-black/40 border border-zinc-800 p-4 rounded relative">
                        <h3 className="text-ordem-red font-display uppercase tracking-wider mb-2 flex items-center gap-2">
                            <Icons.FileText /> Objetivo da Missão / Lore
                        </h3>
                        <p className="font-mono text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap">
                            {currentCampaign.descricao}
                        </p>
                    </div>

                    <div className="bg-black/40 border border-zinc-800 p-4 rounded flex-1 flex flex-col justify-center items-center text-zinc-600 border-dashed relative overflow-hidden group min-h-[300px]">
                         {currentCampaign.campaignImage ? (
                             <>
                                {/* Imagem adaptada para aparecer inteira (contain) */}
                                <img 
                                    src={currentCampaign.campaignImage} 
                                    className="absolute inset-0 w-full h-full object-contain bg-black/50" 
                                    alt="Imagem da Campanha" 
                                />
                                
                                {/* Botões de Controle da Imagem (Hover) */}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                                     
                                     {/* Botão de Tela Cheia (Todos) */}
                                     <button 
                                        onClick={() => setIsImageFullscreen(true)}
                                        className="bg-black/80 hover:bg-white hover:text-black text-white p-3 rounded-full border border-white/20 transition-all transform hover:scale-110 shadow-lg backdrop-blur"
                                        title="Maximizar / Tela Cheia"
                                     >
                                         <Icons.Maximize />
                                     </button>

                                     {/* Botão de Trocar Imagem (Admin) */}
                                     {currentUser.role === 'admin' && (
                                         <label className="cursor-pointer bg-zinc-900/90 hover:bg-ordem-gold hover:text-black text-white p-3 rounded-full border border-zinc-600 transition-all transform hover:scale-110 shadow-lg backdrop-blur" title="Alterar Imagem">
                                            <Icons.Upload />
                                            <input type="file" accept="image/*" className="hidden" onChange={handleCampaignImageUpload} />
                                         </label>
                                     )}

                                     {/* Botão de Remover Imagem (Admin) */}
                                     {currentUser.role === 'admin' && (
                                         <button 
                                            onClick={handleRemoveImage}
                                            className="bg-red-900/80 hover:bg-red-600 text-white p-3 rounded-full border border-red-500/50 transition-all transform hover:scale-110 shadow-lg backdrop-blur"
                                            title="Remover Imagem"
                                         >
                                             <Icons.Trash />
                                         </button>
                                     )}
                                </div>
                             </>
                         ) : (
                             <>
                                <Icons.Map />
                                <span className="mt-2 text-xs font-mono uppercase mb-4">Nenhuma imagem definida</span>
                                {currentUser.role === 'admin' && (
                                    <label className="cursor-pointer bg-zinc-900 hover:bg-zinc-800 text-zinc-300 px-4 py-2 rounded text-xs uppercase border border-zinc-700 flex items-center gap-2 transition-colors hover:text-white hover:border-ordem-gold">
                                        <Icons.Upload /> Selecionar Imagem da Campanha
                                        <input type="file" accept="image/*" className="hidden" onChange={handleCampaignImageUpload} />
                                    </label>
                                )}
                             </>
                         )}
                    </div>
                </div>

                {/* Agent List */}
                <div className="bg-zinc-900/50 border border-zinc-800 rounded flex flex-col">
                    <div className="p-3 border-b border-zinc-800 bg-black/40 flex justify-between items-center">
                        <span className="text-sm font-bold text-zinc-300 uppercase flex items-center gap-2"><Icons.Users /> Agentes</span>
                        <span className="text-xs text-green-500 font-mono">LINK ESTÁVEL</span>
                    </div>
                    <div className="flex-1 p-2 space-y-2 overflow-y-auto custom-scrollbar">
                        {currentCampaign.jogadores.map(jogador => (
                            <div key={jogador.id} className="flex items-center gap-3 p-2 hover:bg-zinc-800/50 rounded transition-colors group border border-transparent hover:border-zinc-700">
                                <div className={`w-2 h-2 rounded-full ${jogador.status === 'Online' ? 'bg-green-500 shadow-[0_0_5px_#22c55e]' : 'bg-zinc-600'}`}></div>
                                <div>
                                    <div className="text-sm text-zinc-200 font-mono group-hover:text-ordem-gold">{jogador.nome} {jogador.isMestre && '👑'}</div>
                                    <div className="text-[10px] text-zinc-500 uppercase">{jogador.classe}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
             </div>

             <div className="p-4 border-t border-zinc-800 bg-black/60 flex justify-end">
                 <button onClick={handleLeave} className="text-xs text-red-500 hover:text-red-400 font-mono uppercase border border-red-900/30 px-3 py-1 rounded hover:bg-red-900/10 transition-colors">
                     Abandonar Missão
                 </button>
             </div>

            {/* FULLSCREEN IMAGE MODAL */}
            {isImageFullscreen && currentCampaign.campaignImage && (
                <div 
                    className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-md flex items-center justify-center p-4"
                    onClick={() => setIsImageFullscreen(false)} // Fecha ao clicar fora
                >
                    {/* Botão Fechar */}
                    <button 
                        onClick={() => setIsImageFullscreen(false)}
                        className="absolute top-4 right-4 text-zinc-500 hover:text-white p-2 rounded-full border border-zinc-700 hover:border-white transition-all"
                    >
                        <span className="text-xl font-bold px-2">X</span>
                    </button>
                    
                    <img 
                        src={currentCampaign.campaignImage} 
                        alt="Campanha Tela Cheia" 
                        className="max-w-full max-h-full object-contain shadow-2xl drop-shadow-[0_0_50px_rgba(0,0,0,0.8)]"
                        onClick={(e) => e.stopPropagation()} // Impede fechar ao clicar na imagem
                    />
                </div>
            )}

        </div>
      );
  }

  // Not in a campaign views
  return (
    <div className="flex items-center justify-center h-full">
        {loading ? (
             <div className="flex flex-col items-center gap-4">
                 <div className="w-16 h-16 border-4 border-ordem-gold border-t-transparent rounded-full animate-spin"></div>
                 <div className="font-mono text-ordem-gold animate-pulse">ESTABELECENDO CONEXÃO CRIPTOGRAFADA...</div>
             </div>
        ) : (
            <div className="w-full max-w-md bg-ordem-panel border border-ordem-border p-8 rounded-lg shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-ordem-red to-transparent"></div>
                
                <div className="text-center mb-8">
                    <div className="inline-block p-4 rounded-full bg-black border border-zinc-800 mb-4 text-ordem-gold">
                        <Icons.Radio />
                    </div>
                    <h2 className="text-2xl font-display text-white mb-2">SISTEMA DE MISSÕES</h2>
                    <p className="text-zinc-500 text-sm font-mono">Conecte-se à rede da Ordem para coordenar investigações.</p>
                </div>

                {view === 'menu' && (
                    <div className="space-y-4">
                        <button 
                            onClick={() => setView('join')}
                            className="w-full bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-700 hover:border-ordem-gold py-4 px-6 rounded transition-all font-display uppercase tracking-widest flex items-center justify-center gap-2 group"
                        >
                            <Icons.Send /> Acessar com Código
                        </button>
                        
                        {currentUser.role === 'admin' ? (
                            <button 
                                onClick={() => setView('create')}
                                className="w-full bg-ordem-blood/10 hover:bg-ordem-blood/20 text-ordem-red hover:text-red-400 border border-ordem-blood/30 hover:border-red-500 py-3 px-6 rounded transition-all font-mono text-sm uppercase tracking-wider"
                            >
                                Criar Nova Missão
                            </button>
                        ) : (
                            <div className="text-center p-2 bg-black/50 rounded border border-zinc-800">
                                <span className="text-[10px] text-zinc-600 font-mono uppercase">
                                    <Icons.Shield /> Acesso para criar missão restrito a Mestres.
                                </span>
                            </div>
                        )}
                    </div>
                )}

                {view === 'join' && (
                    <div className="animate-in slide-in-from-right">
                        <label className="block text-xs font-mono text-zinc-500 mb-2 uppercase">Insira o Código da Missão</label>
                        <input 
                            type="text" 
                            value={inputCode}
                            onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                            placeholder="EX: OP-X92A"
                            className="w-full bg-black border border-zinc-700 p-3 text-center text-xl text-ordem-gold font-mono tracking-[0.2em] focus:border-ordem-gold outline-none mb-6 placeholder-zinc-800"
                            maxLength={7}
                        />
                        <div className="flex gap-3">
                            <button onClick={() => setView('menu')} className="flex-1 bg-transparent border border-zinc-700 text-zinc-500 hover:text-white py-2 rounded text-xs uppercase">Voltar</button>
                            <button onClick={handleJoin} className="flex-1 bg-ordem-gold text-black font-bold py-2 rounded hover:bg-yellow-600 transition-colors uppercase tracking-wider text-xs">Conectar</button>
                        </div>
                    </div>
                )}

                {view === 'create' && (
                    <div className="animate-in slide-in-from-right space-y-4">
                        <div>
                             <label className="block text-xs font-mono text-zinc-500 mb-1 uppercase">Nome da Missão</label>
                             <input 
                                value={createForm.nome}
                                onChange={(e) => setCreateForm({...createForm, nome: e.target.value})}
                                className="w-full bg-black border border-zinc-700 p-2 text-white focus:border-ordem-gold outline-none"
                             />
                        </div>
                        <div>
                             <label className="block text-xs font-mono text-zinc-500 mb-1 uppercase">Mestre (Seu Nome)</label>
                             <input 
                                value={createForm.mestre}
                                onChange={(e) => setCreateForm({...createForm, mestre: e.target.value})}
                                className="w-full bg-black border border-zinc-700 p-2 text-white focus:border-ordem-gold outline-none"
                             />
                        </div>
                        <div>
                             <label className="block text-xs font-mono text-zinc-500 mb-1 uppercase">Descrição Inicial</label>
                             <textarea 
                                value={createForm.descricao}
                                onChange={(e) => setCreateForm({...createForm, descricao: e.target.value})}
                                className="w-full bg-black border border-zinc-700 p-2 text-white focus:border-ordem-gold outline-none h-24 resize-none"
                             />
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button onClick={() => setView('menu')} className="flex-1 bg-transparent border border-zinc-700 text-zinc-500 hover:text-white py-2 rounded text-xs uppercase">Cancelar</button>
                            <button onClick={handleCreate} className="flex-1 bg-ordem-red text-white font-bold py-2 rounded hover:bg-red-700 transition-colors uppercase tracking-wider text-xs">Iniciar Protocolo</button>
                        </div>
                    </div>
                )}
            </div>
        )}
    </div>
  );
};
