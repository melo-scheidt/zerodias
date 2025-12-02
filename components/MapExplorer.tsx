
import React, { useState, useRef, useEffect } from 'react';
import { Icons } from '../constants';
import { Token, Agente, Campanha, User, MapState } from '../types';

const PRESET_MAPS = [
  { id: 'wh', name: 'Armazém / Celeiro', description: 'Amplo espaço com caixas e feno.', url: 'https://images.unsplash.com/photo-1590644365607-1c5a38fc43e0?auto=format&fit=crop&q=80&w=1000' },
  { id: 'cab', name: 'Cabana Abandonada', description: 'Interior de madeira em ruínas.', url: 'https://images.unsplash.com/photo-1518773553398-650c184e0bb3?auto=format&fit=crop&q=80&w=1000' },
  { id: 'rit', name: 'Arena Ritualística', description: 'Solo de terra com símbolos.', url: 'https://images.unsplash.com/photo-1542259681-d4cd79803027?auto=format&fit=crop&q=80&w=1000' },
  { id: 'morg', name: 'Morgue / Laboratório', description: 'Piso xadrez e macas frias.', url: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=1000' },
  { id: 'man', name: 'Mansão (Salão)', description: 'Piso de madeira nobre e tapetes.', url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=1000' },
  { id: 'dorm', name: 'Dormitórios', description: 'Camas militares enfileiradas.', url: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&q=80&w=1000' },
  { id: 'apt', name: 'Apartamento', description: 'Residência padrão com mobília.', url: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&q=80&w=1000' },
  { id: 'apt_b', name: 'Cena de Crime', description: 'Apartamento com marcas de sangue.', url: 'https://images.unsplash.com/photo-1605218427368-35b861266205?auto=format&fit=crop&q=80&w=1000' },
  { id: 'off', name: 'Escritório Tático', description: 'Mesas, computadores e arquivos.', url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1000' },
];

interface MapExplorerProps {
  savedAgents?: Agente[];
  currentCampaign?: Campanha | null;
  currentUser?: User;
  onUpdateCampaign?: (c: Campanha) => void;
}

export const MapExplorer: React.FC<MapExplorerProps> = ({ savedAgents = [], currentCampaign, currentUser, onUpdateCampaign }) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'presets'>('upload');
  const [bgImage, setBgImage] = useState<string | null>(null);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [selectedTokenId, setSelectedTokenId] = useState<string | null>(null);
  
  // Viewport Transform State (Zoom & Pan)
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const lastMousePos = useRef({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setBgImage(ev.target?.result as string);
        setActiveTab('upload');
        // Reset view on new map
        setScale(1);
        setPosition({ x: 0, y: 0 });
      };
      reader.readAsDataURL(file);
    }
  };

  const loadPreset = (url: string) => {
      setBgImage(url);
      setActiveTab('upload');
      setScale(1);
      setPosition({ x: 0, y: 0 });
  }

  const addToken = (agent?: Agente) => {
    const newToken: Token = {
      id: Date.now().toString(),
      label: agent ? agent.nome.substring(0, 2).toUpperCase() : '?',
      image: agent?.imagem,
      x: 400, // Center-ish relative to typical map
      y: 300,
      color: agent?.classe === 'Combatente' ? '#ef4444' : agent?.classe === 'Ocultista' ? '#a855f7' : '#d4b483', // Colors by class
      size: 50
    };
    setTokens([...tokens, newToken]);
  };

  const deleteToken = (id: string) => {
      setTokens(prev => prev.filter(t => t.id !== id));
      if(selectedTokenId === id) setSelectedTokenId(null);
  }

  // --- INTERACTION LOGIC ---

  // Token Dragging
  const [isDraggingToken, setIsDraggingToken] = useState(false);
  
  const handleTokenMouseDown = (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Prevent panning
    setSelectedTokenId(id);
    setIsDraggingToken(true);
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  // Map Panning
  const handleMapMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0 || e.button === 1) { // Left or Middle click
        setIsPanning(true);
        lastMousePos.current = { x: e.clientX, y: e.clientY };
        // Deselect token if clicking on empty map
        setSelectedTokenId(null);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const dx = e.clientX - lastMousePos.current.x;
    const dy = e.clientY - lastMousePos.current.y;
    lastMousePos.current = { x: e.clientX, y: e.clientY };

    if (isDraggingToken && selectedTokenId) {
        // Move token considering scale to keep 1:1 mouse movement
        setTokens(prev => prev.map(t => {
            if (t.id === selectedTokenId) {
                return { ...t, x: t.x + (dx / scale), y: t.y + (dy / scale) };
            }
            return t;
        }));
    } else if (isPanning) {
        // Pan the map view
        setPosition(prev => ({ x: prev.x + dx, y: prev.y + dy }));
    }
  };

  const handleMouseUp = () => {
    setIsDraggingToken(false);
    setIsPanning(false);
  };

  // Zoom Logic
  const handleWheel = (e: React.WheelEvent) => {
      // Zoom towards mouse pointer logic can be complex, doing center zoom for simplicity
      const zoomSensitivity = 0.001;
      const newScale = Math.min(Math.max(0.1, scale - e.deltaY * zoomSensitivity), 5);
      setScale(newScale);
  };

  // --- SYNC & TRANSMIT ---
  
  const handleTransmit = () => {
      if (!currentCampaign || !onUpdateCampaign) {
          alert("Erro: Você não está conectado a uma campanha ativa.");
          return;
      }
      
      const mapState: MapState = {
          bgImage,
          tokens,
          timestamp: Date.now()
      };
      
      onUpdateCampaign({
          ...currentCampaign,
          mapState
      });
      alert("📡 MESA TRANSMITIDA!\nOs jogadores podem sincronizar agora.");
  };

  const handleSync = () => {
      if (!currentCampaign?.mapState) {
          alert("Nenhum mapa transmitido pelo mestre ainda.");
          return;
      }
      
      const { bgImage: newBg, tokens: newTokens } = currentCampaign.mapState;
      setBgImage(newBg);
      setTokens(newTokens);
      setScale(1);
      setPosition({x: 0, y: 0});
      alert("Mesa Sincronizada com o Mestre.");
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
                   Use scroll para Zoom. Arraste para Mover.
               </div>
           </div>
           
           {/* Campaign Controls */}
           {currentCampaign && (
               <div className="p-2 border border-zinc-800 bg-black rounded flex flex-col gap-2">
                   <div className="text-[9px] uppercase font-mono text-zinc-600 text-center">Controles de Transmissão</div>
                   
                   {currentUser?.role === 'admin' ? (
                       <button 
                           onClick={handleTransmit}
                           className="w-full flex items-center justify-center gap-2 bg-ordem-blood text-white text-xs font-mono uppercase py-2 rounded hover:bg-red-700 transition-colors animate-pulse-slow"
                       >
                           <Icons.Radio /> Transmitir Mesa
                       </button>
                   ) : (
                       <button 
                           onClick={handleSync}
                           className="w-full flex items-center justify-center gap-2 bg-ordem-gold text-black text-xs font-mono uppercase py-2 rounded hover:bg-yellow-600 transition-colors"
                       >
                           <Icons.Upload /> Sincronizar Mesa
                       </button>
                   )}
               </div>
           )}

           {/* Tabs Buttons */}
           <div className="flex bg-black rounded p-1 border border-zinc-800">
                <button 
                    onClick={() => setActiveTab('upload')}
                    className={`flex-1 px-3 py-1 text-xs uppercase font-mono rounded transition-colors ${activeTab === 'upload' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                    Mesa
                </button>
                <button 
                    onClick={() => setActiveTab('presets')}
                    className={`flex-1 px-3 py-1 text-xs uppercase font-mono rounded transition-colors ${activeTab === 'presets' ? 'bg-ordem-red text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                    Mapas
                </button>
            </div>

            {/* Token Controls */}
            {activeTab === 'upload' && (
                <div className="flex-1 flex flex-col gap-2 overflow-hidden bg-black/20 rounded border border-zinc-800/50 p-2">
                    <div className="text-[10px] text-zinc-500 font-mono uppercase font-bold tracking-wider mb-1">Elenco (Agentes)</div>
                    
                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2">
                        {/* Generic Token */}
                        <button onClick={() => addToken()} className="w-full flex items-center gap-2 p-2 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-ordem-gold transition-colors text-left group">
                            <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-xs font-bold text-white border border-red-800">?</div>
                            <span className="text-xs text-zinc-300 group-hover:text-white">Token Genérico</span>
                        </button>

                        {/* Agent List */}
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
                        {savedAgents.length === 0 && <div className="text-[10px] text-zinc-600 text-center p-2">Nenhum agente salvo.</div>}
                    </div>

                    <div className="border-t border-zinc-800 pt-2 mt-2">
                        <label className="flex items-center gap-2 text-xs text-zinc-400 bg-zinc-900 p-2 rounded border border-zinc-800 cursor-pointer hover:text-white">
                            <Icons.FileText /> Upload Mapa Local
                            <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                        </label>
                    </div>
                </div>
            )}
       </div>

       {/* Map Viewport */}
       <div className="flex-1 flex flex-col gap-4 overflow-hidden relative">
           
           {/* Token Settings Bar (When selected) */}
           {selectedTokenId && activeTab === 'upload' && (
               <div className="absolute top-4 left-4 right-4 z-50 bg-zinc-900/90 backdrop-blur p-2 rounded border border-ordem-gold/50 flex gap-4 items-center animate-in slide-in-from-top-2 shadow-lg">
                   <span className="text-[10px] text-ordem-gold uppercase font-mono font-bold tracking-wider pl-2">Editando Token</span>
                   <div className="h-4 w-px bg-zinc-700"></div>
                   <input 
                     type="text" 
                     className="bg-black border border-zinc-700 text-xs p-1 w-24 text-white font-mono text-center focus:border-ordem-gold outline-none"
                     placeholder="Sigla"
                     maxLength={3}
                     onChange={(e) => setTokens(prev => prev.map(t => t.id === selectedTokenId ? {...t, label: e.target.value.substring(0,3)} : t))}
                   />
                   <div className="flex items-center gap-2">
                       <span className="text-[10px] text-zinc-500">COR</span>
                       <input 
                        type="color" 
                        className="h-6 w-8 bg-transparent border border-zinc-700 rounded cursor-pointer"
                        onChange={(e) => setTokens(prev => prev.map(t => t.id === selectedTokenId ? {...t, color: e.target.value} : t))}
                        />
                   </div>
                   <div className="flex items-center gap-2">
                       <span className="text-[10px] text-zinc-500">TAMANHO</span>
                       <input 
                        type="range" min="20" max="200"
                        className="w-24 accent-ordem-gold h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer"
                        onChange={(e) => setTokens(prev => prev.map(t => t.id === selectedTokenId ? {...t, size: parseInt(e.target.value)} : t))}
                        />
                   </div>
                   <div className="flex-1"></div>
                   <button onClick={() => deleteToken(selectedTokenId)} className="text-zinc-400 hover:text-ordem-red transition-colors p-1 border border-transparent hover:border-red-900 rounded">
                       <Icons.Trash />
                   </button>
               </div>
           )}

           {activeTab === 'presets' ? (
               <div className="h-full overflow-y-auto custom-scrollbar bg-black/40 rounded border border-zinc-800 p-4">
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                       {PRESET_MAPS.map((map) => (
                           <button 
                                key={map.id}
                                onClick={() => loadPreset(map.url)}
                                className="group relative aspect-video bg-black rounded border border-zinc-800 overflow-hidden hover:border-ordem-gold transition-all hover:scale-[1.01]"
                           >
                               <img src={map.url} alt={map.name} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                               <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-90"></div>
                               <div className="absolute bottom-0 left-0 p-3 text-left">
                                   <div className="text-white font-display text-lg leading-none">{map.name}</div>
                                   <div className="text-zinc-500 font-mono text-[10px] uppercase mt-1">{map.description}</div>
                               </div>
                           </button>
                       ))}
                   </div>
               </div>
           ) : (
                <div className="relative w-full h-full bg-zinc-950 rounded border border-zinc-800 overflow-hidden">
                     {/* Viewport Container */}
                     <div 
                        ref={containerRef}
                        className={`w-full h-full absolute inset-0 ${isPanning ? 'cursor-grabbing' : 'cursor-grab'}`}
                        onMouseDown={handleMapMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                        onWheel={handleWheel}
                     >
                        {/* Transformed Content */}
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
                                    style={{
                                        // Using raw image dimensions would be ideal, but for simplicity fitting width
                                        // or defaulting to a reasonable size if no image loaded yet
                                    }}
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
                                        cursor: 'pointer',
                                    }}
                                >
                                    {/* Token Content */}
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
                                    
                                    {/* Selection Indicator */}
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
           )}
       </div>
    </div>
  );
};
