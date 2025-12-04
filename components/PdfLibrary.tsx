
import React, { useState, useEffect } from 'react';
import { Icons } from '../constants';
import { LibraryLink, User } from '../types';
import { db } from '../services/databaseService';

interface PdfLibraryProps {
  currentUser?: User;
}

export const PdfLibrary: React.FC<PdfLibraryProps> = ({ currentUser }) => {
  const [links, setLinks] = useState<LibraryLink[]>([]);
  const [selectedLink, setSelectedLink] = useState<LibraryLink | null>(null);
  
  // States for Adding New Link
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');

  useEffect(() => {
    loadLinks();
  }, []);

  const loadLinks = async () => {
    const list = await db.listLibraryLinks();
    setLinks(list);
  };

  const handleAddLink = async () => {
      if (!newTitle.trim() || !newUrl.trim()) return;

      const newLink: LibraryLink = {
          id: Date.now().toString(),
          title: newTitle,
          url: newUrl,
          addedBy: currentUser?.username || 'Desconhecido',
          date: Date.now()
      };

      await db.saveLibraryLink(newLink);
      setLinks(prev => [...prev, newLink]);
      setIsAdding(false);
      setNewTitle('');
      setNewUrl('');
      alert("Livro adicionado à biblioteca da ordem.");
  };

  const handleDeleteLink = async (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if (confirm("Confirmar expurgo deste documento da biblioteca?")) {
          await db.deleteLibraryLink(id);
          setLinks(prev => prev.filter(l => l.id !== id));
          if (selectedLink?.id === id) setSelectedLink(null);
      }
  };

  const handleClearLibrary = async () => {
      if (confirm("ATENÇÃO: Isso apagará TODOS os livros da biblioteca tanto localmente quanto no banco de dados. Confirmar expurgo total?")) {
          await db.clearLibrary();
          setLinks([]);
          setSelectedLink(null);
      }
  };

  const openExternalLink = (url: string) => {
      window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="flex flex-col h-full bg-ordem-panel/50 rounded-lg border border-ordem-border relative overflow-hidden animate-in fade-in">
      
      {/* Header */}
      <div className="p-6 border-b border-ordem-border bg-black/40 flex justify-between items-center shrink-0">
        <div>
           <h2 className="text-xl font-display text-white tracking-widest uppercase text-glow flex items-center gap-3">
             <Icons.Book /> Biblioteca da Ordem
           </h2>
           <p className="font-mono text-[10px] text-zinc-500">
               ACERVO DIGITAL DE LIVROS E DOCUMENTOS (FlipHTML5)
           </p>
        </div>
        
        {currentUser?.role === 'admin' && (
             <div className="flex gap-2">
                 <button 
                    onClick={handleClearLibrary}
                    className="flex items-center gap-2 px-3 py-2 rounded text-xs font-mono uppercase transition-colors border border-red-900/50 text-red-700 hover:text-red-500 hover:bg-red-900/10"
                    title="Expurgar Acervo (Apagar Tudo)"
                 >
                    <Icons.Trash />
                 </button>
                 <button 
                    onClick={() => setIsAdding(!isAdding)}
                    className={`flex items-center gap-2 px-4 py-2 rounded text-xs font-mono uppercase transition-colors border ${isAdding ? 'bg-zinc-800 border-zinc-600 text-white' : 'bg-ordem-gold/10 border-ordem-gold text-ordem-gold hover:bg-ordem-gold hover:text-black'}`}
                 >
                    {isAdding ? 'Cancelar' : '+ Adicionar Livro'}
                 </button>
             </div>
        )}
      </div>

      <div className="flex-1 flex overflow-hidden">
        
        {/* Sidebar List */}
        <div className="w-80 bg-black/20 border-r border-zinc-800 flex flex-col shrink-0">
            
            {/* Add Form (Admin Only) */}
            {isAdding && currentUser?.role === 'admin' && (
                <div className="p-4 border-b border-zinc-800 bg-zinc-900/50 space-y-3 animate-in slide-in-from-top-2">
                    <input 
                        type="text" 
                        placeholder="Título do Livro"
                        value={newTitle}
                        onChange={e => setNewTitle(e.target.value)}
                        className="w-full bg-black border border-zinc-700 p-2 text-white text-xs focus:border-ordem-gold outline-none"
                    />
                    <input 
                        type="text" 
                        placeholder="Link (FlipHTML5 / URL)"
                        value={newUrl}
                        onChange={e => setNewUrl(e.target.value)}
                        className="w-full bg-black border border-zinc-700 p-2 text-zinc-300 text-xs font-mono focus:border-ordem-gold outline-none"
                    />
                    <button 
                        onClick={handleAddLink}
                        className="w-full bg-ordem-gold text-black font-bold text-xs uppercase py-2 hover:bg-yellow-600"
                    >
                        Salvar no Banco
                    </button>
                </div>
            )}

            <div className="p-2 bg-zinc-950/50 text-[10px] font-mono text-zinc-500 uppercase tracking-wider border-b border-zinc-800 flex justify-between items-center">
                <span>Acervo Disponível</span>
                <span className="text-zinc-600">{links.length} Docs</span>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                {links.length === 0 && (
                <div className="text-zinc-600 text-xs text-center p-4 mt-4 font-mono">
                    Nenhum livro registrado no banco de dados.
                </div>
                )}
                {links.map(link => (
                <div 
                    key={link.id}
                    onClick={() => setSelectedLink(link)}
                    className={`group flex items-center justify-between p-3 rounded cursor-pointer border transition-all ${selectedLink?.id === link.id ? 'bg-ordem-gold/10 border-ordem-gold/50 text-ordem-gold' : 'bg-transparent border-transparent hover:bg-zinc-800 text-zinc-400'}`}
                >
                    <div className="flex items-center gap-3 overflow-hidden">
                        <Icons.Book />
                        <div className="overflow-hidden">
                            <div className="truncate text-xs font-bold font-display" title={link.title}>{link.title}</div>
                            <div className="text-[9px] text-zinc-600 font-mono truncate">{link.url}</div>
                        </div>
                    </div>
                    {currentUser?.role === 'admin' && (
                        <button onClick={(e) => handleDeleteLink(link.id, e)} className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-500 p-1">
                            <Icons.Trash />
                        </button>
                    )}
                </div>
                ))}
            </div>
        </div>

        {/* Viewer Area (Embedded Iframe) */}
        <div className="flex-1 bg-zinc-950 relative flex flex-col">
          {selectedLink ? (
             <div className="flex flex-col h-full w-full">
                 {/* Viewer Toolbar */}
                 <div className="bg-zinc-900 border-b border-zinc-800 p-2 flex justify-between items-center shrink-0">
                     <h2 className="text-sm font-display text-white px-2 truncate flex-1">{selectedLink.title}</h2>
                     <div className="flex gap-2">
                         <button 
                             onClick={() => openExternalLink(selectedLink.url)}
                             className="text-[10px] font-mono uppercase bg-black border border-zinc-700 text-zinc-400 px-3 py-1 rounded hover:text-white hover:border-ordem-gold transition-colors flex items-center gap-2"
                             title="Caso o visualizador não carregue"
                         >
                             <Icons.Send /> Abrir Externamente
                         </button>
                         <button 
                             onClick={() => setSelectedLink(null)}
                             className="text-zinc-500 hover:text-red-500 px-2"
                         >
                             X
                         </button>
                     </div>
                 </div>
                 
                 {/* Iframe Container */}
                 <div className="flex-1 bg-white relative w-full">
                     <iframe 
                         src={selectedLink.url}
                         className="absolute inset-0 w-full h-full border-0"
                         allowFullScreen
                         title={selectedLink.title}
                         sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                     />
                 </div>
             </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-zinc-700 opacity-50 text-center bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-opacity-5">
               <Icons.Book />
               <h3 className="mt-4 font-display text-2xl uppercase text-zinc-600">Leitor Desativado</h3>
               <p className="mt-2 font-mono text-xs uppercase text-zinc-600">
                   Selecione um documento na lista ao lado para visualização interna.
               </p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};
