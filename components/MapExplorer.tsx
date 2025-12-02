
import React, { useState, useRef, useEffect } from 'react';
import { Icons } from '../constants';
import { Token, Agente, Campanha, User, MapState } from '../types';

interface MapExplorerProps {
  savedAgents?: Agente[];
  currentCampaign?: Campanha | null;
  currentUser?: User;
  onUpdateCampaign?: (c: Campanha) => void;
}

export const MapExplorer: React.FC<MapExplorerProps> = ({ savedAgents = [], currentCampaign, currentUser, onUpdateCampaign }) => {
  const [bgImage, setBgImage] = useState<string | null>(null);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [selectedTokenId, setSelectedTokenId] = useState<string | null>(null);
  
  // Viewport Transform State (Zoom & Pan)
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const lastMousePos = useRef({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement>(null);

  // Sync state with props (Realtime updates)
  useEffect(() => {
      if (currentCampaign?.mapState) {
          const { bgImage: serverBg, tokens: serverTokens } = currentCampaign.mapState;
          
          // Only update BG if it changed to avoid flicker
          if (serverBg !== bgImage) setBgImage(serverBg);
          
          // Update tokens if user is not dragging one currently
          if (!isDraggingToken) {
              setTokens(serverTokens);
          }
      }
  }, [currentCampaign]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const newBg = ev.target?.result as string;
        setBgImage(newBg);
        setScale(1);
        setPosition({ x: 0, y: 0 });
        saveToCampaign(newBg, tokens);
      };
      reader.readAsDataURL(file);
    }
  };

  const saveToCampaign = (bg: string | null, updatedTokens: Token[]) => {
      if (currentCampaign && onUpdateCampaign && currentUser?.role === 'admin') {
          const mapState: MapState = {
              bgImage: bg,
              tokens: updatedTokens,
              timestamp: Date.now()
          };
          onUpdateCampaign({
              ...currentCampaign,
              mapState
          });
      }
  };

  const addToken = (agent?: Agente) => {
    const newToken: Token = {
      id: Date.now().toString(),
      label: agent ? agent.nome.substring(0, 2).toUpperCase() : '?',
      image: agent?.imagem,
      x: 400 - position.x,
      y: 300 - position.y,
      color: agent?.classe === 'Combatente' ? '#ef4444' : agent?.classe === 'Ocultista' ? '#a855f7' : '#d4b483', // Colors by class
      size: 50
    };
    const newTokens = [...tokens, newToken];
    setTokens(newTokens);
    saveToCampaign(bgImage, newTokens);
  };

  const deleteToken = (id: string) => {
      const newTokens = tokens.filter(t => t.id !== id);
      setTokens(newTokens);
      if(selectedTokenId === id) setSelectedTokenId(null);
      saveToCampaign(bgImage, newTokens);
  }

  // --- INTERACTION LOGIC ---

  const [isDraggingToken, setIsDraggingToken] = useState(false);
  
  const handleTokenMouseDown = (e: React.MouseEvent, id: string) => {
    if (currentUser?.role !== 'admin') return; // Only admin can move tokens for now
    e.stopPropagation(); 
    setSelectedTokenId(id);
    setIsDraggingToken(true);
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMapMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0 || e.button === 1) { 
        setIsPanning(true);
        lastMousePos.current = { x: e.clientX, y: e.clientY };
        setSelectedTokenId(null);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const dx = e.clientX - lastMousePos.current.x;
    const dy = e.clientY - lastMousePos.current.y;
    lastMousePos.current = { x: e.clientX, y: e.clientY };

    if (isDraggingToken && selectedTokenId) {
        setTokens(prev => prev.map(t => {
            if (t.id === selectedTokenId) {
                return { ...t, x: t.x + (dx / scale), y: t.y + (dy / scale) };
            }
            return t;
        }));
    } else if (isPanning) {
        setPosition(prev => ({ x: prev.x + dx, y: prev.y + dy }));
    }
  };

  const handleMouseUp = () => {
    if (isDraggingToken) {
        // Drop Event: Save changes to DB
        saveToCampaign(bgImage, tokens);
    }
    setIsDraggingToken(false);
    setIsPanning(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
      const zoomSensitivity = 0.001;
      const newScale = Math.min(Math.max(0.1, scale - e.deltaY * zoomSensitivity), 5);
      setScale(newScale);
  };

  return (
    <div className="flex h-full space-x-4 bg-ordem-panel/50 rounded-lg border border-ordem-border overflow-hidden animate-in fade-in p-4">
       
       {/* Sidebar: Roster & Controls */}
       <div className="w-64 flex flex-col gap-4">
           {/* Header */}
           <div className="bg-zinc-950 p-4 border rounded border-zinc-800">
               <h2 className="text-lg font-display text-ordem-gold flex items-center gap-2">
                   <Icons.Map /> MAPA TÁTICO
               </h2>
               <div className="text-[10px] text-zinc-500 font-mono mt-1">
                   {currentUser?.role === 'admin' ? 'Controle do Mestre' : 'Visualização do Agente'}
               </div>
               {currentCampaign && (
                   <div className="mt-2 flex items-center gap-2 text-xs font-mono text-red-500 animate-pulse">
                       <span className="w-2 h-2 rounded-full bg-red-600"></span>
                       TRANSMISSÃO AO VIVO
                   </div>
               )}
           </div>
           
           {/* Admin Controls */}
           {currentUser?.role === 'admin' && (
                <div className="flex-1 flex flex-col gap-2 overflow-hidden bg-black/20 rounded border border-zinc-800/50 p-2">
                    <div className="text-[10px] text-zinc-500 font-mono uppercase font-bold tracking-wider mb-1">Elenco (Agentes)</div>
                    
                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2">
                        <button onClick={() => addToken()} className="w-full flex items-center gap-2 p-2 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-ordem-gold transition-colors text-left group">
                            <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-xs font-bold text-white border border-red-800">?</div>
                            <span className="text-xs text-zinc-300 group-hover:text-white">Genérico</span>
                        </button>

                        {savedAgents.map(agent => (
                            <button key={agent.id} onClick={() => addToken(agent)} className="w-full flex items-center gap-2 p-2 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-ordem-gold transition-colors text-left group">
                                <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden border border-zinc-600">
                                    {agent.imagem ? <img src={agent.imagem} className="w-full h-full object-cover" /> : <span className="text-xs">{agent.nome.charAt(0)}</span>}
                                </div>
                                <div className="overflow-hidden">
                                    <div className="text-xs text-zinc-300 group-hover:text-white truncate">{agent.nome}</div>
                                    <div className="text-[9px] text-zinc-600 uppercase">{agent.classe}</div>
                                </div>
                            </button>
                        ))}
                    </div>

                    <div className="border-t border-zinc-800 pt-2 mt-2">
                        <label className="flex items-center gap-2 text-xs text-zinc-400 bg-zinc-900 p-2 rounded border border-zinc-800 cursor-pointer hover:text-white">
                            <Icons.FileText /> Trocar Mapa (Fundo)
                            <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                        </label>
                    </div>
                </div>
            )}

            {currentUser?.role !== 'admin' && (
                <div className="bg-black/50 p-4 rounded text-center text-zinc-500 font-mono text-xs">
                    <Icons.Radio />
                    <p className="mt-2">Aguardando movimentação do Mestre.</p>
                </div>
            )}
       </div>

       {/* Map Viewport */}
       <div className="flex-1 flex flex-col gap-4 overflow-hidden relative">
           
           {/* Token Settings Bar (Admin Only) */}
           {selectedTokenId && currentUser?.role === 'admin' && (
               <div className="absolute top-4 left-4 right-4 z-50 bg-zinc-900/90 backdrop-blur p-2 rounded border border-ordem-gold/50 flex gap-4 items-center animate-in slide-in-from-top-2 shadow-lg">
                   <span className="text-[10px] text-ordem-gold uppercase font-mono font-bold tracking-wider pl-2">Editando Token</span>
                   <div className="h-4 w-px bg-zinc-700"></div>
                   <input 
                     type="text" 
                     className="bg-black border border-zinc-700 text-xs p-1 w-24 text-white font-mono text-center focus:border-ordem-gold outline-none"
                     placeholder="Sigla"
                     maxLength={3}
                     onChange={(e) => {
                         const newLabel = e.target.value.substring(0,3);
                         const newTokens = tokens.map(t => t.id === selectedTokenId ? {...t, label: newLabel} : t);
                         setTokens(newTokens);
                         saveToCampaign(bgImage, newTokens);
                     }}
                   />
                   <div className="flex-1"></div>
                   <button onClick={() => deleteToken(selectedTokenId)} className="text-zinc-400 hover:text-ordem-red transition-colors p-1 border border-transparent hover:border-red-900 rounded">
                       <Icons.Trash />
                   </button>
               </div>
           )}

            <div className="relative w-full h-full bg-zinc-950 rounded border border-zinc-800 overflow-hidden">
                    <div 
                    ref={containerRef}
                    className={`w-full h-full absolute inset-0 ${isPanning ? 'cursor-grabbing' : 'cursor-grab'}`}
                    onMouseDown={handleMapMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onWheel={handleWheel}
                    >
                    <div 
                        style={{
                            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                            transformOrigin: '0 0',
                            width: '100%',
                            height: '100%',
                        }}
                    >
                        {/* Map Image Layer */}
                        {bgImage ? (
                            <img 
                                src={bgImage} 
                                alt="Map" 
                                className="max-w-none pointer-events-none select-none"
                                onDragStart={(e) => e.preventDefault()}
                            />
                        ) : (
                            <div className="w-[800px] h-[600px] bg-zinc-900/50 flex items-center justify-center border border-dashed border-zinc-800">
                                <div className="flex flex-col items-center text-zinc-700">
                                    <Icons.Map />
                                    <span className="mt-2 text-xs uppercase">Sem Mapa Carregado</span>
                                </div>
                            </div>
                        )}

                            {/* Tokens Layer */}
                        {tokens.map(token => (
                            <div
                                key={token.id}
                                onMouseDown={(e) => handleTokenMouseDown(e, token.id)}
                                className={`absolute rounded-full flex items-center justify-center shadow-lg transition-transform ${selectedTokenId === token.id ? 'z-50 ring-4 ring-ordem-gold ring-opacity-50 scale-105' : 'z-10 ring-1 ring-black'}`}
                                style={{
                                    width: token.size,
                                    height: token.size,
                                    left: token.x - token.size/2,
                                    top: token.y - token.size/2,
                                    cursor: currentUser?.role === 'admin' ? 'pointer' : 'default',
                                }}
                            >
                                <div 
                                    className="w-full h-full rounded-full overflow-hidden bg-zinc-900 border-2 relative"
                                    style={{ borderColor: token.color }}
                                >
                                    {token.image ? (
                                        <img src={token.image} className="w-full h-full object-cover pointer-events-none" draggable={false} />
                                    ) : (
                                        <div 
                                            className="w-full h-full flex items-center justify-center font-bold text-white"
                                            style={{ backgroundColor: token.color }}
                                        >
                                            <span className="drop-shadow-md text-xs select-none">{token.label}</span>
                                        </div>
                                    )}
                                </div>
                                
                                {selectedTokenId === token.id && (
                                    <div className="absolute -bottom-6 bg-black/80 px-2 py-0.5 rounded text-[8px] text-white whitespace-nowrap pointer-events-none border border-zinc-700">
                                        {token.label}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Scale Indicator HUD */}
                    <div className="absolute bottom-4 right-4 bg-black/80 text-zinc-400 text-xs px-2 py-1 rounded font-mono border border-zinc-800 pointer-events-none">
                        ZOOM: {Math.round(scale * 100)}%
                    </div>
                    </div>
            </div>
       </div>
    </div>
  );
};
