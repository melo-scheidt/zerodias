
import React, { useState, useRef, useEffect } from 'react';
import { Icons } from '../constants';
import { Token } from '../types';

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

export const MapExplorer: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'upload' | 'presets'>('upload');
  const [bgImage, setBgImage] = useState<string | null>(null);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [selectedTokenId, setSelectedTokenId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setBgImage(ev.target?.result as string);
        setActiveTab('upload'); // Switch back to view map
      };
      reader.readAsDataURL(file);
    }
  };

  const loadPreset = (url: string) => {
      setBgImage(url);
      setActiveTab('upload');
  }

  const addToken = () => {
    const newToken: Token = {
      id: Date.now().toString(),
      label: '?',
      x: 50,
      y: 50,
      color: '#ef4444',
      size: 40
    };
    setTokens([...tokens, newToken]);
  };

  const moveToken = (id: string, dx: number, dy: number) => {
    setTokens(prev => prev.map(t => {
      if (t.id === id) {
        return { ...t, x: t.x + dx, y: t.y + dy };
      }
      return t;
    }));
  };

  const deleteToken = (id: string) => {
      setTokens(prev => prev.filter(t => t.id !== id));
      if(selectedTokenId === id) setSelectedTokenId(null);
  }

  // Mouse drag logic handling
  const [isDragging, setIsDragging] = useState(false);
  const handleMouseDown = (id: string) => {
    setSelectedTokenId(id);
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !selectedTokenId || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setTokens(prev => prev.map(t => {
      if (t.id === selectedTokenId) {
        return { ...t, x, y };
      }
      return t;
    }));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div className="flex flex-col h-full space-y-4 bg-ordem-panel/50 rounded-lg border border-ordem-border overflow-hidden animate-in fade-in">
       
       {/* Header / Tabs */}
       <div className="flex justify-between items-center bg-zinc-950 p-4 border-b border-zinc-800">
          <div className="flex items-center gap-6">
            <h2 className="text-xl font-display text-ordem-gold flex items-center gap-2">
                <Icons.Map /> MAPA TÁTICO
            </h2>
            <div className="flex bg-black rounded p-1 border border-zinc-800">
                <button 
                    onClick={() => setActiveTab('upload')}
                    className={`px-3 py-1 text-xs uppercase font-mono rounded transition-colors ${activeTab === 'upload' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                    Mesa Virtual
                </button>
                <button 
                    onClick={() => setActiveTab('presets')}
                    className={`px-3 py-1 text-xs uppercase font-mono rounded transition-colors ${activeTab === 'presets' ? 'bg-ordem-red text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                    Mapas Prontos
                </button>
            </div>
          </div>

          <div className="flex gap-2">
            <div className="relative overflow-hidden inline-block group">
                <button className="bg-zinc-900 text-zinc-300 text-xs px-3 py-1.5 rounded border border-zinc-700 hover:bg-zinc-800 hover:border-ordem-gold transition-colors font-mono uppercase flex items-center gap-2">
                    <Icons.FileText /> Upload Local
                </button>
                <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleImageUpload}
                    className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
                />
            </div>
            {activeTab === 'upload' && (
                <button 
                    onClick={addToken}
                    className="bg-ordem-purple text-white text-xs px-3 py-1.5 rounded font-bold hover:bg-purple-600 font-mono uppercase border border-purple-900 shadow-[0_0_10px_rgba(168,85,247,0.3)]"
                >
                    + Token
                </button>
            )}
          </div>
       </div>

       {/* Content Area */}
       <div className="flex-1 overflow-hidden relative p-4">
           
           {activeTab === 'presets' ? (
               <div className="h-full overflow-y-auto custom-scrollbar">
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
                   <p className="text-center text-zinc-600 font-mono text-xs mt-8 pb-4">
                       Selecione um mapa para carregá-lo na mesa tática. Você pode substituir as imagens no código fonte.
                   </p>
               </div>
           ) : (
                <div 
                    ref={containerRef}
                    className="w-full h-full bg-black/40 rounded border border-zinc-800 relative overflow-hidden select-none cursor-crosshair shadow-inner"
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    style={{
                        backgroundImage: bgImage ? `url(${bgImage})` : 'none',
                        backgroundSize: 'contain',
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'center',
                    }}
                >
                    {!bgImage && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-700 pointer-events-none">
                            <Icons.Map />
                            <span className="text-sm font-mono mt-2 uppercase tracking-widest">Aguardando Dados Cartográficos</span>
                            <span className="text-xs text-zinc-800 mt-1">Carregue um arquivo ou escolha um mapa pronto.</span>
                        </div>
                    )}

                    {/* Grid Overlay Optional */}
                    {bgImage && (
                        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:50px_50px] pointer-events-none"></div>
                    )}

                    {/* Tokens */}
                    {tokens.map(token => (
                        <div
                            key={token.id}
                            onMouseDown={() => handleMouseDown(token.id)}
                            className={`absolute rounded-full flex items-center justify-center font-bold text-white shadow-lg cursor-move border-2 transition-transform hover:scale-110 active:scale-95 ${selectedTokenId === token.id ? 'border-white z-50 ring-2 ring-ordem-gold' : 'border-black z-10'}`}
                            style={{
                                width: token.size,
                                height: token.size,
                                backgroundColor: token.color,
                                left: token.x - token.size/2,
                                top: token.y - token.size/2,
                                boxShadow: '0 0 15px rgba(0,0,0,0.8)'
                            }}
                        >
                            <span className="drop-shadow-md text-xs">{token.label}</span>
                        </div>
                    ))}
                </div>
           )}
       </div>
       
       {/* Token Controls Footer */}
       {selectedTokenId && activeTab === 'upload' && (
           <div className="bg-zinc-900 p-3 mx-4 mb-4 rounded border border-zinc-700 flex gap-4 items-center animate-in slide-in-from-bottom-2 shadow-lg">
               <span className="text-[10px] text-zinc-500 uppercase font-mono font-bold tracking-wider">Configuração do Token</span>
               <div className="h-4 w-px bg-zinc-700"></div>
               <input 
                 type="text" 
                 className="bg-black border border-zinc-700 text-xs p-1 w-24 text-white font-mono text-center focus:border-ordem-gold outline-none"
                 placeholder="Sigla"
                 maxLength={3}
                 onChange={(e) => setTokens(prev => prev.map(t => t.id === selectedTokenId ? {...t, label: e.target.value.substring(0,3)} : t))}
               />
               <input 
                 type="color" 
                 className="h-6 w-8 bg-transparent border border-zinc-700 rounded cursor-pointer"
                 onChange={(e) => setTokens(prev => prev.map(t => t.id === selectedTokenId ? {...t, color: e.target.value} : t))}
               />
               <div className="flex-1"></div>
               <button onClick={() => deleteToken(selectedTokenId)} className="text-zinc-500 hover:text-ordem-red transition-colors">
                   <Icons.Trash />
               </button>
           </div>
       )}
    </div>
  );
};
