
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
  const [isImageFullscreen, setIsImageFullscreen] = useState(false);

  const handleCampaignImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && currentCampaign) {
          const reader = new FileReader();
          reader.onload = (ev) => {
              const result = ev.target?.result as string;
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
              campaignImage: undefined
          };
          setCurrentCampaign(updatedCampaign);
      }
  };

  // Se por algum motivo de delay o currentCampaign for null (segundos iniciais), mostra carregando
  if (!currentCampaign) {
      return (
        <div className="flex flex-col items-center justify-center h-full bg-ordem-panel/50 rounded-lg border border-ordem-border p-8 relative overflow-hidden animate-in fade-in">
             <div className="flex flex-col items-center gap-4 text-zinc-500 animate-pulse">
                <Icons.Radio />
                <span className="font-mono text-xs uppercase tracking-widest">Carregando Missão...</span>
             </div>
             {/* Background Noise */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 pointer-events-none"></div>
        </div>
      );
  }

  // Visualização da Campanha Ativa
  return (
    <div className="flex flex-col h-full bg-ordem-panel/50 rounded-lg border border-ordem-border relative overflow-hidden animate-in fade-in">
         {/* Header Mission */}
         <div className="bg-zinc-950 p-6 border-b border-ordem-gold/20 flex justify-between items-start relative shrink-0">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-ordem-gold via-red-900 to-ordem-gold opacity-50"></div>
            <div>
                <h2 className="text-3xl font-display text-white tracking-widest uppercase text-glow mb-2">{currentCampaign.nome}</h2>
                <p className="font-mono text-zinc-500 text-xs uppercase flex items-center gap-2">
                    <span className="text-ordem-gold">Mestre: {currentCampaign.mestre}</span> // STATUS: ATIVA
                </p>
            </div>
            <div className="flex flex-col items-end gap-2">
                 <div className="bg-green-900/20 border border-green-900 text-green-500 px-3 py-1 rounded text-[10px] font-mono uppercase animate-pulse">
                     ● Transmissão Segura
                 </div>
            </div>
         </div>

         <div className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden">
            {/* Mission Details */}
            <div className="lg:col-span-2 space-y-6 flex flex-col overflow-y-auto custom-scrollbar pr-2">
                <div className="bg-black/40 border border-zinc-800 p-6 rounded relative shadow-lg">
                    <h3 className="text-ordem-red font-display uppercase tracking-wider mb-4 flex items-center gap-2 text-lg border-b border-zinc-800 pb-2">
                        <Icons.FileText /> Relatório da Missão
                    </h3>
                    <p className="font-mono text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap text-justify">
                        {currentCampaign.descricao}
                    </p>
                </div>

                <div className="bg-black/40 border border-zinc-800 p-4 rounded flex-1 min-h-[300px] flex flex-col justify-center items-center text-zinc-600 border-dashed relative overflow-hidden group">
                     {currentCampaign.campaignImage ? (
                         <>
                            <img 
                                src={currentCampaign.campaignImage} 
                                className="absolute inset-0 w-full h-full object-contain bg-black/50" 
                                alt="Imagem da Campanha" 
                            />
                            
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 z-10">
                                 <button 
                                    onClick={() => setIsImageFullscreen(true)}
                                    className="bg-black/80 hover:bg-white hover:text-black text-white p-3 rounded-full border border-white/20 transition-all transform hover:scale-110 shadow-lg backdrop-blur"
                                 >
                                     <Icons.Maximize />
                                 </button>

                                 {currentUser.role === 'admin' && (
                                     <>
                                        <label className="cursor-pointer bg-zinc-900/90 hover:bg-ordem-gold hover:text-black text-white p-3 rounded-full border border-zinc-600 transition-all transform hover:scale-110 shadow-lg backdrop-blur">
                                            <Icons.Upload />
                                            <input type="file" accept="image/*" className="hidden" onChange={handleCampaignImageUpload} />
                                        </label>
                                        <button 
                                            onClick={handleRemoveImage}
                                            className="bg-red-900/80 hover:bg-red-600 text-white p-3 rounded-full border border-red-500/50 transition-all transform hover:scale-110 shadow-lg backdrop-blur"
                                        >
                                            <Icons.Trash />
                                        </button>
                                     </>
                                 )}
                            </div>
                         </>
                     ) : (
                         <>
                            <Icons.Map />
                            <span className="mt-2 text-xs font-mono uppercase mb-4">Nenhuma imagem de referência</span>
                            {currentUser.role === 'admin' && (
                                <label className="cursor-pointer bg-zinc-900 hover:bg-zinc-800 text-zinc-300 px-4 py-2 rounded text-xs uppercase border border-zinc-700 flex items-center gap-2 transition-colors hover:text-white hover:border-ordem-gold">
                                    <Icons.Upload /> Upload Imagem
                                    <input type="file" accept="image/*" className="hidden" onChange={handleCampaignImageUpload} />
                                </label>
                            )}
                         </>
                     )}
                </div>
            </div>

            {/* Agent List */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded flex flex-col h-full">
                <div className="p-4 border-b border-zinc-800 bg-black/40 flex justify-between items-center shrink-0">
                    <span className="text-sm font-bold text-zinc-300 uppercase flex items-center gap-2"><Icons.Users /> Equipe</span>
                    <span className="text-[10px] text-zinc-500 font-mono bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                        {currentCampaign.jogadores.length} CONECTADOS
                    </span>
                </div>
                <div className="flex-1 p-3 space-y-2 overflow-y-auto custom-scrollbar">
                    {currentCampaign.jogadores.map(jogador => (
                        <div key={jogador.id} className="flex items-center gap-3 p-3 bg-zinc-950/50 hover:bg-zinc-800/50 rounded border border-zinc-800/50 hover:border-ordem-gold/30 transition-all group">
                            <div className={`w-2 h-2 rounded-full ${jogador.status === 'Online' ? 'bg-green-500 shadow-[0_0_5px_#22c55e]' : 'bg-zinc-600'}`}></div>
                            <div className="flex-1">
                                <div className="text-sm text-zinc-200 font-mono font-bold group-hover:text-ordem-gold flex justify-between">
                                    {jogador.nome} 
                                    {jogador.isMestre && <span className="text-ordem-gold text-[10px] border border-ordem-gold/50 px-1 rounded ml-2">MESTRE</span>}
                                </div>
                                <div className="text-[10px] text-zinc-500 uppercase">{jogador.classe}</div>
                            </div>
                        </div>
                    ))}
                    {currentCampaign.jogadores.length === 0 && (
                        <div className="text-center text-zinc-600 text-xs py-10 font-mono">
                            Nenhum agente detectado na área.
                        </div>
                    )}
                </div>
            </div>
         </div>

        {/* FULLSCREEN IMAGE MODAL */}
        {isImageFullscreen && currentCampaign.campaignImage && (
            <div 
                className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
                onClick={() => setIsImageFullscreen(false)}
            >
                <button 
                    onClick={() => setIsImageFullscreen(false)}
                    className="absolute top-6 right-6 text-zinc-500 hover:text-white p-2 rounded-full border border-zinc-700 hover:border-white transition-all bg-black/50"
                >
                    <span className="text-xl font-bold px-2">X</span>
                </button>
                
                <img 
                    src={currentCampaign.campaignImage} 
                    alt="Campanha Tela Cheia" 
                    className="max-w-full max-h-full object-contain shadow-2xl drop-shadow-[0_0_50px_rgba(0,0,0,0.8)]"
                    onClick={(e) => e.stopPropagation()}
                />
            </div>
        )}

    </div>
  );
};
