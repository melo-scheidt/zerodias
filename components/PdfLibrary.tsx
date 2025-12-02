
import React, { useState, useEffect } from 'react';
import { Icons } from '../constants';
import { db } from '../services/databaseService';
import { LibraryDocument } from '../types';

export const PdfLibrary: React.FC = () => {
  const [documents, setDocuments] = useState<LibraryDocument[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<LibraryDocument | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newLinkTitle, setNewLinkTitle] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    const docs = await db.listDocuments();
    setDocuments(docs);
  };

  const handleAddLink = async () => {
    if (!newLinkTitle || !newLinkUrl) return;
    const newDoc: LibraryDocument = {
      id: Date.now().toString(),
      title: newLinkTitle,
      url: newLinkUrl,
      type: 'link'
    };
    await db.saveDocument(newDoc);
    setDocuments(prev => [...prev, newDoc]);
    setShowAddModal(false);
    setNewLinkTitle('');
    setNewLinkUrl('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      const url = URL.createObjectURL(file);
      const tempDoc: LibraryDocument = {
        id: 'temp-' + Date.now(),
        title: file.name + ' (Sessão Atual)',
        url: url,
        type: 'local'
      };
      // Documentos locais não são salvos no banco para economizar espaço,
      // mas são adicionados à lista da sessão atual
      setDocuments(prev => [tempDoc, ...prev]);
      setSelectedDoc(tempDoc);
    } else {
      alert("Por favor selecione um arquivo PDF válido.");
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Remover este documento da biblioteca?")) {
      await db.deleteDocument(id);
      setDocuments(prev => prev.filter(d => d.id !== id));
      if (selectedDoc?.id === id) setSelectedDoc(null);
    }
  };

  return (
    <div className="flex flex-col h-full bg-ordem-panel/50 rounded-lg border border-ordem-border relative overflow-hidden animate-in fade-in">
      
      {/* Header */}
      <div className="p-4 border-b border-ordem-border bg-black/40 flex justify-between items-center">
        <div>
           <h2 className="text-xl font-display text-white tracking-widest uppercase text-glow flex items-center gap-3">
             <Icons.Pdf /> Biblioteca de Documentos
           </h2>
           <p className="font-mono text-[10px] text-zinc-500">ARQUIVOS CONFIDENCIAIS E MANUAIS</p>
        </div>
        
        <div className="flex gap-2">
           <label className="flex items-center gap-2 bg-zinc-900 border border-zinc-700 hover:border-ordem-gold px-3 py-1.5 rounded cursor-pointer transition-colors group">
              <input type="file" accept="application/pdf" className="hidden" onChange={handleFileUpload} />
              <Icons.Upload />
              <span className="text-xs font-mono text-zinc-400 group-hover:text-white uppercase">Abrir PDF Local</span>
           </label>
           
           <button 
             onClick={() => setShowAddModal(true)}
             className="flex items-center gap-2 bg-ordem-blood/20 border border-ordem-blood text-ordem-red hover:bg-ordem-blood hover:text-white px-3 py-1.5 rounded transition-colors text-xs font-mono uppercase"
           >
             <Icons.Sparkles /> Adicionar Link
           </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        
        {/* Sidebar List */}
        <div className="w-64 bg-black/20 border-r border-zinc-800 flex flex-col">
           <div className="p-2 bg-zinc-950/50 text-[10px] font-mono text-zinc-500 uppercase tracking-wider border-b border-zinc-800">
             Arquivos Disponíveis
           </div>
           <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
             {documents.length === 0 && (
               <div className="text-zinc-600 text-xs text-center p-4">Nenhum documento.</div>
             )}
             {documents.map(doc => (
               <div 
                 key={doc.id}
                 onClick={() => setSelectedDoc(doc)}
                 className={`group flex items-center justify-between p-2 rounded cursor-pointer border ${selectedDoc?.id === doc.id ? 'bg-ordem-gold/10 border-ordem-gold/50 text-ordem-gold' : 'bg-transparent border-transparent hover:bg-zinc-800 text-zinc-400'}`}
               >
                 <div className="flex items-center gap-2 overflow-hidden">
                   <Icons.FileText />
                   <div className="truncate text-xs font-mono">{doc.title}</div>
                 </div>
                 {doc.type === 'link' && (
                    <button onClick={(e) => handleDelete(doc.id, e)} className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-500">
                      <Icons.Trash />
                    </button>
                 )}
               </div>
             ))}
           </div>
        </div>

        {/* Viewer Area */}
        <div className="flex-1 bg-zinc-900 relative flex flex-col">
          {selectedDoc ? (
            <>
               <div className="bg-zinc-950 border-b border-zinc-800 p-2 flex justify-between items-center">
                  <span className="text-xs font-mono text-zinc-300 truncate">{selectedDoc.title}</span>
                  <a href={selectedDoc.url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-ordem-gold hover:underline flex items-center gap-1">
                     Abrir em nova aba <Icons.Send />
                  </a>
               </div>
               <iframe 
                 src={selectedDoc.url} 
                 className="w-full h-full border-none bg-white"
                 title="PDF Viewer"
               />
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-zinc-700 opacity-50">
               <Icons.Pdf />
               <p className="mt-4 font-mono text-sm uppercase">Selecione um documento para leitura</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Link Modal */}
      {showAddModal && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
           <div className="bg-ordem-panel border border-ordem-gold p-6 rounded shadow-2xl w-full max-w-md animate-in zoom-in-95">
              <h3 className="font-display text-lg text-white mb-4">Adicionar Link Externo</h3>
              <div className="space-y-4">
                 <div>
                    <label className="text-xs font-mono text-zinc-500">Nome do Arquivo</label>
                    <input 
                      className="w-full bg-black border border-zinc-700 p-2 text-white focus:border-ordem-gold outline-none"
                      value={newLinkTitle}
                      onChange={e => setNewLinkTitle(e.target.value)}
                      placeholder="Ex: Livro de Regras"
                    />
                 </div>
                 <div>
                    <label className="text-xs font-mono text-zinc-500">URL do PDF</label>
                    <input 
                      className="w-full bg-black border border-zinc-700 p-2 text-white focus:border-ordem-gold outline-none"
                      value={newLinkUrl}
                      onChange={e => setNewLinkUrl(e.target.value)}
                      placeholder="https://..."
                    />
                    <p className="text-[10px] text-zinc-600 mt-1">* Links do Google Drive podem precisar de permissão de visualização pública.</p>
                 </div>
                 <div className="flex justify-end gap-2 pt-2">
                    <button onClick={() => setShowAddModal(false)} className="px-4 py-2 text-xs text-zinc-400 hover:text-white">Cancelar</button>
                    <button onClick={handleAddLink} className="bg-ordem-gold text-black px-4 py-2 rounded font-bold text-xs uppercase hover:bg-yellow-600">Salvar</button>
                 </div>
              </div>
           </div>
        </div>
      )}

    </div>
  );
};
