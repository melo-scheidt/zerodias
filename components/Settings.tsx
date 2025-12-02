
import React, { useState, useEffect } from 'react';
import { db } from '../services/databaseService';
import { Icons } from '../constants';

export const Settings: React.FC = () => {
    const [url, setUrl] = useState('');
    const [key, setKey] = useState('');
    const [isConnected, setIsConnected] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [statusMsg, setStatusMsg] = useState('');

    useEffect(() => {
        setIsConnected(db.getStatus());
        const creds = localStorage.getItem('op_supabase_creds');
        if (creds) {
            const data = JSON.parse(creds);
            setUrl(data.url);
            setKey(data.key);
        }
    }, []);

    const handleConnect = async () => {
        if (!url || !key) return setStatusMsg("⚠️ Preencha URL e Chave.");
        
        setIsLoading(true);
        setStatusMsg("Testando conexão...");
        
        const result = await db.connect(url, key);
        
        setIsLoading(false);
        
        if (result.success) {
            setIsConnected(true);
            setStatusMsg("");
            alert("✔ CONEXÃO ESTABELECIDA COM SUCESSO.\nO banco de dados foi sincronizado.");
        } else {
            setIsConnected(false);
            setStatusMsg(`❌ ERRO: ${result.error}`);
        }
    };

    const handleDisconnect = () => {
        db.disconnect();
        setUrl('');
        setKey('');
        setIsConnected(false);
        setStatusMsg("Desconectado.");
    };

    return (
        <div className="flex flex-col h-full bg-ordem-panel/50 rounded-lg border border-ordem-border relative overflow-hidden animate-in fade-in">
             <div className="p-6 border-b border-ordem-border bg-black/40">
                <h2 className="text-2xl font-display text-white tracking-widest uppercase text-glow flex items-center gap-3">
                    <Icons.Settings /> Configurações do Sistema
                </h2>
             </div>

             <div className="flex-1 p-8 overflow-y-auto">
                 <div className="max-w-3xl mx-auto space-y-8">
                     
                     {/* Status Card */}
                     <div className={`p-6 rounded border flex items-center justify-between ${isConnected ? 'bg-green-900/10 border-green-900/50' : 'bg-zinc-900/50 border-zinc-800'}`}>
                         <div className="flex items-center gap-4">
                             <div className={`w-3 h-3 rounded-full animate-pulse ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                             <div>
                                 <h3 className="font-display text-lg text-white">Status da Conexão</h3>
                                 <p className="font-mono text-xs text-zinc-400">
                                     {isConnected ? 'BANCO DE DADOS SINCRONIZADO (SUPABASE)' : 'MODO OFFLINE (LOCAL STORAGE)'}
                                 </p>
                             </div>
                         </div>
                         <div className="text-3xl opacity-20">
                             {isConnected ? <Icons.Cloud /> : <Icons.WifiOff />}
                         </div>
                     </div>

                     {/* Form */}
                     <div className="space-y-4 bg-black/40 p-6 rounded border border-zinc-800 relative">
                         <h3 className="text-ordem-gold font-bold uppercase tracking-wider text-sm mb-4">Credenciais Supabase</h3>
                         
                         <div>
                             <label className="block text-xs font-mono text-zinc-500 mb-1">PROJECT URL</label>
                             <input 
                                type="text" 
                                value={url}
                                onChange={e => setUrl(e.target.value)}
                                className="w-full bg-zinc-950 border border-zinc-700 p-3 text-zinc-300 font-mono text-sm focus:border-ordem-gold outline-none"
                                placeholder="https://xyz.supabase.co"
                                disabled={isConnected}
                             />
                         </div>
                         
                         <div>
                             <label className="block text-xs font-mono text-zinc-500 mb-1">ANON PUBLIC KEY</label>
                             <input 
                                type="password" 
                                value={key}
                                onChange={e => setKey(e.target.value)}
                                className="w-full bg-zinc-950 border border-zinc-700 p-3 text-zinc-300 font-mono text-sm focus:border-ordem-gold outline-none"
                                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI..."
                                disabled={isConnected}
                             />
                         </div>

                         {statusMsg && (
                             <div className={`text-xs font-mono p-2 rounded ${statusMsg.includes('ERRO') || statusMsg.includes('⚠️') ? 'text-red-400 bg-red-900/10' : 'text-zinc-400'}`}>
                                 {statusMsg}
                             </div>
                         )}

                         <div className="pt-4 flex gap-4">
                             {isConnected ? (
                                 <button onClick={handleDisconnect} className="bg-red-900/30 text-red-500 border border-red-900 px-6 py-2 rounded font-mono uppercase text-xs hover:bg-red-900/50 transition-colors">
                                     Desconectar
                                 </button>
                             ) : (
                                <button 
                                    onClick={handleConnect} 
                                    disabled={isLoading}
                                    className="bg-ordem-gold text-black font-bold px-6 py-2 rounded font-mono uppercase text-xs hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {isLoading && <div className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin"></div>}
                                    {isLoading ? 'Testando Conexão...' : 'Salvar e Conectar'}
                                </button>
                             )}
                         </div>
                     </div>

                     {/* Instructions */}
                     <div className="bg-zinc-900/50 p-6 rounded border border-zinc-800 text-sm text-zinc-400 space-y-2 font-mono">
                         <h4 className="text-white font-bold mb-2 flex items-center gap-2"><Icons.Book /> Instruções de Configuração Obrigatória:</h4>
                         <p>1. Crie um projeto gratuito em <a href="https://supabase.com" target="_blank" className="text-ordem-gold underline hover:text-white">supabase.com</a>.</p>
                         <p>2. Vá em <strong>SQL Editor</strong> e execute EXATAMENTE o comando abaixo:</p>
                         <div className="bg-black p-4 rounded border border-zinc-700 text-green-500 text-xs my-2 font-mono leading-relaxed select-all shadow-inner">
                             -- Cria a tabela de documentos<br/>
                             create table if not exists documents (<br/>
                             &nbsp;&nbsp;id text primary key,<br/>
                             &nbsp;&nbsp;collection text,<br/>
                             &nbsp;&nbsp;data jsonb<br/>
                             );<br/><br/>
                             -- IMPORTANTE: Libera acesso para o App funcionar sem login complexo<br/>
                             alter table documents disable row level security;
                         </div>
                         <p className="text-xs text-zinc-500 mt-2">* Sem desativar o "Row Level Security" (última linha), o app dará erro de permissão.</p>
                         <p>3. Vá em <strong>Project Settings {'>'} API</strong> e copie a URL e a chave `anon public`.</p>
                     </div>

                 </div>
             </div>
        </div>
    );
};
