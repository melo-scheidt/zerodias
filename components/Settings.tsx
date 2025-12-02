
import React, { useState, useEffect } from 'react';
import { db } from '../services/databaseService';
import { Icons } from '../constants';

export const Settings: React.FC = () => {
    const [url, setUrl] = useState('');
    const [key, setKey] = useState('');
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        setIsConnected(db.getStatus());
        const creds = localStorage.getItem('op_supabase_creds');
        if (creds) {
            const data = JSON.parse(creds);
            setUrl(data.url);
            setKey(data.key);
        }
    }, []);

    const handleConnect = () => {
        if (!url || !key) return alert("Preencha URL e Chave.");
        db.connect(url, key);
        if (db.getStatus()) {
            alert("Conectado! Reinicie a página para sincronizar dados.");
            setIsConnected(true);
        } else {
            alert("Falha na conexão. Verifique suas credenciais.");
            setIsConnected(false);
        }
    };

    const handleDisconnect = () => {
        db.disconnect();
        setUrl('');
        setKey('');
        setIsConnected(false);
    };

    return (
        <div className="flex flex-col h-full bg-ordem-panel/50 rounded-lg border border-ordem-border relative overflow-hidden animate-in fade-in">
             <div className="p-6 border-b border-ordem-border bg-black/40">
                <h2 className="text-2xl font-display text-white tracking-widest uppercase text-glow flex items-center gap-3">
                    <Icons.Settings /> Configurações do Sistema
                </h2>
             </div>

             <div className="flex-1 p-8 overflow-y-auto">
                 <div className="max-w-2xl mx-auto space-y-8">
                     
                     {/* Status Card */}
                     <div className={`p-6 rounded border flex items-center justify-between ${isConnected ? 'bg-green-900/10 border-green-900/50' : 'bg-red-900/10 border-red-900/50'}`}>
                         <div className="flex items-center gap-4">
                             <div className={`w-3 h-3 rounded-full animate-pulse ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                             <div>
                                 <h3 className="font-display text-lg text-white">Status da Conexão</h3>
                                 <p className="font-mono text-xs text-zinc-400">
                                     {isConnected ? 'BANCO DE DADOS SINCRONIZADO (ONLINE)' : 'MODO OFFLINE (LOCAL STORAGE)'}
                                 </p>
                             </div>
                         </div>
                         <div className="text-3xl opacity-20">
                             {isConnected ? <Icons.Cloud /> : <Icons.WifiOff />}
                         </div>
                     </div>

                     {/* Form */}
                     <div className="space-y-4 bg-black/40 p-6 rounded border border-zinc-800">
                         <h3 className="text-ordem-gold font-bold uppercase tracking-wider text-sm mb-4">Credenciais Supabase</h3>
                         
                         <div>
                             <label className="block text-xs font-mono text-zinc-500 mb-1">PROJECT URL</label>
                             <input 
                                type="text" 
                                value={url}
                                onChange={e => setUrl(e.target.value)}
                                className="w-full bg-zinc-950 border border-zinc-700 p-3 text-zinc-300 font-mono text-sm focus:border-ordem-gold outline-none"
                                placeholder="https://xyz.supabase.co"
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
                             />
                         </div>

                         <div className="pt-4 flex gap-4">
                             {isConnected ? (
                                 <button onClick={handleDisconnect} className="bg-red-900/30 text-red-500 border border-red-900 px-6 py-2 rounded font-mono uppercase text-xs hover:bg-red-900/50 transition-colors">
                                     Desconectar
                                 </button>
                             ) : (
                                <button onClick={handleConnect} className="bg-ordem-gold text-black font-bold px-6 py-2 rounded font-mono uppercase text-xs hover:bg-yellow-600 transition-colors">
                                    Salvar e Conectar
                                </button>
                             )}
                         </div>
                     </div>

                     {/* Instructions */}
                     <div className="bg-zinc-900/50 p-6 rounded border border-zinc-800 text-sm text-zinc-400 space-y-2 font-mono">
                         <h4 className="text-white font-bold mb-2">Instruções de Configuração:</h4>
                         <p>1. Crie um projeto gratuito em <a href="https://supabase.com" target="_blank" className="text-ordem-gold underline">supabase.com</a>.</p>
                         <p>2. Vá em SQL Editor e rode este comando:</p>
                         <div className="bg-black p-3 rounded border border-zinc-700 text-green-500 text-xs my-2 select-all">
                             create table documents (<br/>
                             &nbsp;&nbsp;id text primary key,<br/>
                             &nbsp;&nbsp;collection text,<br/>
                             &nbsp;&nbsp;data jsonb<br/>
                             );
                         </div>
                         <p>3. Vá em Project Settings {'>'} API e copie a URL e a chave `anon public`.</p>
                     </div>

                 </div>
             </div>
        </div>
    );
};
