
import React, { useState, useEffect } from 'react';
import { Icons } from '../constants';
import { db } from '../services/databaseService';
import { LibraryDocument } from '../types';

export const PdfLibrary: React.FC = () => {
  const [documents, setDocuments] = useState<LibraryDocument[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<LibraryDocument | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    const docs = await db.listDocuments();
    // Filter to show only local files (uploads), effectively removing "links" from view if they exist in DB
    setDocuments(docs.filter(d => d.type === 'local'));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert("Por favor selecione um arquivo PDF válido.");
      return;
    }

    // Limite de 500MB conforme solicitado
    const MAX_SIZE = 500 * 1024 * 1024; // 500 MB
    if (file.size > MAX_SIZE) {
        alert("Arquivo muito grande. O limite máximo é 500MB.");
        return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    
    reader.onload = async (ev) => {
        try {
            const base64Url = ev.target?.result as string;
            
            const newDoc: LibraryDocument = {
                id: Date.now().toString(),
                title: file.name,
                url: base64Url,
                type: 'local'
            };

            // Salva no banco de dados (Persistência)
            await db.saveDocument(newDoc);
            
            setDocuments(prev => [newDoc, ...prev]);
            setSelectedDoc(newDoc);
            alert("PDF salvo no banco de dados com sucesso!");

        } catch (error) {
            console.error("Erro ao processar PDF:", error);
            alert("Erro ao salvar o arquivo. Tente novamente ou verifique sua conexão.");
        } finally {
            setIsUploading(false);
        }
    };

    reader.onerror = () => {
        alert("Erro ao ler o arquivo.");
        setIsUploading(false);
    };

    reader.readAsDataURL(file);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Remover este documento da biblioteca? Isso apagará para todos.")) {
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
           <p className="font-mono text-[10px] text-zinc-500">ARQUIVOS CONFIDENCIAIS E MANUAIS (MÁX 500MB)</p>
        </div>
        
        <div className="flex gap-2">
           <label className={`flex items-center gap-2 bg-zinc-900 border border-zinc-700 hover:border-ordem-gold px-3 py-1.5 rounded cursor-pointer transition-colors group ${isUploading ? 'opacity-50 cursor-wait' : ''}`}>
              <input type="file" accept="application/pdf" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
              <Icons.Upload />
              <span className="text-xs font-mono text-zinc-400 group-hover:text-white uppercase">
                  {isUploading ? 'Enviando...' : 'Upload PDF (Banco)'}
              </span>
           </label>
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
                   <div className="truncate text-xs font-mono" title={doc.title}>{doc.title}</div>
                 </div>
                 {/* Botão de deletar disponível para limpar banco */}
                 <button onClick={(e) => handleDelete(doc.id, e)} className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-500">
                    <Icons.Trash />
                 </button>
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

    </div>
  );
};
