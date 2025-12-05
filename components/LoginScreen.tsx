
import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { db, DEFAULT_SUPABASE_URL, DEFAULT_SUPABASE_KEY } from '../services/databaseService';
import { Icons } from '../constants';

interface LoginScreenProps {
  onLoginSuccess: (user: User) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('player');
  const [adminKey, setAdminKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Estado para conexão manual (Preenchido com dados do prompt)
  const [showServerConfig, setShowServerConfig] = useState(false);
  const [serverUrl, setServerUrl] = useState(DEFAULT_SUPABASE_URL);
  const [serverKey, setServerKey] = useState(DEFAULT_SUPABASE_KEY);
  const [connectionLogs, setConnectionLogs] = useState<string[]>([]);

  // Chave secreta para criar conta de Mestre/Admin
  const MASTER_KEY_REQUIRED = "orate_studio";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegistering) {
        if (role === 'admin' && adminKey !== MASTER_KEY_REQUIRED) {
          throw new Error("Chave de Acesso Mestra incorreta. Acesso negado.");
        }
        const user = await db.register(username, password, role);
        // Auto login after register
        await db.login(username, password);
        onLoginSuccess(user);
      } else {
        const user = await db.login(username, password);
        onLoginSuccess(user);
      }
    } catch (err: any) {
      setError(err.message || "Erro no sistema.");
    } finally {
      setLoading(false);
    }
  };

  const handleManualConnect = async () => {
    setLoading(true);
    setConnectionLogs(["Iniciando protocolo de conexão manual..."]);
    setError('');

    try {
        // 1. Conecta
        const res = await db.connect(serverUrl, serverKey);
        
        if (res.success) {
            setConnectionLogs(prev => [...prev, "✔ Autenticação de cliente: OK"]);
            
            // 2. Executa diagnóstico profundo (Leitura/Escrita)
            const diag = await db.testConnectivity();
            setConnectionLogs(prev => [...prev, ...diag.log]);

            if (diag.success) {
               alert("SISTEMA ONLINE.\nTodas as verificações de segurança passaram.");
               setShowServerConfig(false); // Fecha o painel se der tudo certo
            } else {
               setError("Falha nos testes de permissão (Ver Log).");
            }
        } else {
            const errorStr = typeof res.error === 'object' ? JSON.stringify(res.error) : res.error;
            setError(`Falha na conexão inicial: ${errorStr}`);
            setConnectionLogs(prev => [...prev, `❌ ERRO: ${errorStr}`]);
        }
    } catch (e: any) {
        const safeError = e instanceof Error ? e.message : (typeof e === 'object' ? JSON.stringify(e) : String(e));
        setError(`Erro crítico: ${safeError}`);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full bg-black relative overflow-hidden font-mono z-50 py-10">
      
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none"></div>
      <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-transparent via-ordem-gold to-transparent opacity-30"></div>

      <div className="w-full max-w-md p-8 relative z-10 animate-in fade-in zoom-in-95 duration-700">
        
        {/* Logo Area */}
        <div className="text-center mb-10">
          <div className="inline-block p-6 rounded-full border-2 border-ordem-gold/20 bg-black mb-4 shadow-[0_0_30px_rgba(212,180,131,0.1)] relative group">
             <div className="absolute inset-0 rounded-full border border-ordem-gold opacity-50 animate-pulse-slow"></div>
             <span className="text-4xl font-display text-ordem-gold">OP</span>
          </div>
          <h1 className="text-2xl font-display text-white tracking-[0.3em] uppercase text-glow">Ordem Paranormal</h1>
          <p className="text-xs text-zinc-600 mt-2 tracking-widest">SISTEMA COMPANION v2.1</p>
        </div>

        {/* Login Box */}
        <div className="bg-ordem-panel/80 border border-zinc-800 p-8 rounded-sm shadow-2xl backdrop-blur-sm relative">
          
          {/* Corner Decors */}
          <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-ordem-gold"></div>
          <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-ordem-gold"></div>

          <form onSubmit={handleSubmit} className="space-y-5">
            
            {error && (
              <div className="bg-red-900/20 border border-red-900/50 p-3 text-red-500 text-xs text-center uppercase tracking-wide animate-pulse break-words">
                ⚠ {error}
              </div>
            )}

            <div>
              <label className="block text-xs text-zinc-500 uppercase mb-1">Identificação (Usuário)</label>
              <input 
                type="text" 
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full bg-black border border-zinc-700 p-3 text-white focus:border-ordem-gold outline-none transition-colors"
                placeholder="Nome do Agente"
                required
              />
            </div>

            <div>
              <label className="block text-xs text-zinc-500 uppercase mb-1">Credencial (Senha)</label>
              <input 
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-black border border-zinc-700 p-3 text-white focus:border-ordem-gold outline-none transition-colors"
                placeholder="******"
                required
              />
            </div>

            {isRegistering && (
              <div className="space-y-4 pt-2 border-t border-zinc-800 animate-in slide-in-from-top-2">
                <div>
                   <label className="block text-xs text-zinc-500 uppercase mb-2">Nível de Acesso</label>
                   <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setRole('player')}
                        className={`p-2 text-xs border uppercase ${role === 'player' ? 'bg-zinc-800 border-zinc-500 text-white' : 'border-zinc-800 text-zinc-600 hover:text-zinc-400'}`}
                      >
                        Agente
                      </button>
                      <button
                        type="button"
                        onClick={() => setRole('admin')}
                        className={`p-2 text-xs border uppercase ${role === 'admin' ? 'bg-ordem-blood/20 border-ordem-blood text-ordem-red' : 'border-zinc-800 text-zinc-600 hover:text-zinc-400'}`}
                      >
                        Mestre
                      </button>
                   </div>
                </div>

                {role === 'admin' && (
                  <div>
                    <label className="block text-xs text-ordem-red uppercase mb-1">Chave Mestra Obrigatória</label>
                    <input 
                      type="password" 
                      value={adminKey}
                      onChange={e => setAdminKey(e.target.value)}
                      className="w-full bg-black border border-ordem-red/50 p-3 text-ordem-red focus:border-ordem-red outline-none"
                      placeholder="Chave de Segurança"
                    />
                  </div>
                )}
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className={`w-full py-3 mt-4 font-display uppercase tracking-widest text-sm transition-all relative overflow-hidden group ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              } ${role === 'admin' && isRegistering ? 'bg-ordem-blood text-white hover:bg-red-900' : 'bg-ordem-gold text-black hover:bg-yellow-600'}`}
            >
              {loading ? 'Processando...' : (isRegistering ? 'Cadastrar Credencial' : 'Acessar Sistema')}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button 
              onClick={() => { setIsRegistering(!isRegistering); setError(''); }}
              className="text-xs text-zinc-500 hover:text-ordem-gold underline underline-offset-4"
            >
              {isRegistering ? 'Já tenho acesso. Conectar.' : 'Solicitar novo acesso.'}
            </button>
          </div>

        </div>
        
        {/* Server Config Toggle */}
        <div className="mt-8 w-full flex flex-col items-center">
            <button 
                onClick={() => setShowServerConfig(!showServerConfig)}
                className="text-[10px] text-zinc-600 hover:text-white uppercase tracking-widest border-b border-transparent hover:border-zinc-500 transition-colors pb-1"
            >
                {showServerConfig ? '▲ Ocultar Configuração de Servidor' : '▼ Configuração Manual de Servidor'}
            </button>
        </div>

        {/* Manual Server Configuration Panel */}
        {showServerConfig && (
            <div className="mt-4 w-full bg-zinc-950 border border-zinc-800 p-4 rounded animate-in slide-in-from-top-4">
                <div className="space-y-3">
                    <div>
                        <label className="block text-[10px] text-zinc-500 uppercase mb-1">Project URL</label>
                        <input 
                            type="text" 
                            value={serverUrl}
                            onChange={e => setServerUrl(e.target.value)}
                            className="w-full bg-black border border-zinc-700 p-2 text-zinc-300 text-[10px] font-mono focus:border-ordem-gold outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] text-zinc-500 uppercase mb-1">API Key (Anon)</label>
                        <input 
                            type="password" 
                            value={serverKey}
                            onChange={e => setServerKey(e.target.value)}
                            className="w-full bg-black border border-zinc-700 p-2 text-zinc-300 text-[10px] font-mono focus:border-ordem-gold outline-none"
                        />
                    </div>
                    
                    {connectionLogs.length > 0 && (
                        <div className="bg-black p-2 border border-zinc-800 h-24 overflow-y-auto custom-scrollbar">
                            {connectionLogs.map((log, i) => (
                                <div key={i} className={`text-[9px] font-mono mb-1 ${log.includes('ERRO') || log.includes('Falha') ? 'text-red-500' : 'text-green-500'}`}>
                                    {log}
                                </div>
                            ))}
                        </div>
                    )}

                    <button 
                        onClick={handleManualConnect}
                        disabled={loading}
                        className="w-full bg-zinc-800 hover:bg-zinc-700 text-white text-xs uppercase py-2 rounded border border-zinc-700 hover:border-white transition-colors flex items-center justify-center gap-2"
                    >
                         {loading ? <span className="animate-spin">⟳</span> : <Icons.Cloud />}
                         Testar Conexão Completa (RW)
                    </button>
                </div>
            </div>
        )}

        <div className="text-center mt-8 text-[10px] text-zinc-800 font-mono">
           <p>CONEXÃO SEGURA // CRIPTOGRAFIA ATIVADA</p>
        </div>

      </div>
    </div>
  );
};
