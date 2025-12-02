
import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { db } from '../services/databaseService';
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

  const handleCloudConnect = async () => {
    setLoading(true);
    try {
        const res = await db.connectDefault();
        if (res.success) {
            alert("✔ CONEXÃO ESTABELECIDA COM SUPABASE.\nO sistema está online e sincronizado.");
        } else {
            setError(`Falha na conexão: ${res.error}`);
        }
    } catch (e) {
        setError("Erro crítico ao tentar conectar ao banco de dados.");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full bg-black relative overflow-hidden font-mono z-50">
      
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
          <p className="text-xs text-zinc-600 mt-2 tracking-widest">SISTEMA COMPANION v2.0</p>
        </div>

        {/* Login Box */}
        <div className="bg-ordem-panel/80 border border-zinc-800 p-8 rounded-sm shadow-2xl backdrop-blur-sm relative">
          
          {/* Corner Decors */}
          <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-ordem-gold"></div>
          <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-ordem-gold"></div>

          <form onSubmit={handleSubmit} className="space-y-5">
            
            {error && (
              <div className="bg-red-900/20 border border-red-900/50 p-3 text-red-500 text-xs text-center uppercase tracking-wide animate-pulse">
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
                    <p className="text-[10px] text-zinc-600 mt-1">* Chave de Acesso do Desenvolvedor (orate_studio).</p>
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
        
        {/* Cloud Connect Section */}
        <div className="mt-8 w-full flex flex-col items-center">
            <button 
                onClick={handleCloudConnect}
                disabled={loading}
                className="group relative w-full bg-zinc-950 border border-zinc-800 hover:border-ordem-gold/50 p-4 rounded text-center transition-all hover:bg-zinc-900"
            >
                <div className="flex items-center justify-center gap-2 text-xs text-zinc-500 group-hover:text-ordem-gold font-mono uppercase tracking-widest">
                   {loading ? <span className="animate-spin">⟳</span> : <Icons.Cloud />}
                   {loading ? 'CONECTANDO...' : 'SINCRONIZAR COM SUPABASE'}
                </div>
                {!loading && <div className="text-[9px] text-zinc-700 mt-1">Forçar conexão com banco de dados remoto</div>}
            </button>
        </div>

        <div className="text-center mt-8 text-[10px] text-zinc-800 font-mono">
           <p>CONEXÃO SEGURA // CRIPTOGRAFIA ATIVADA</p>
        </div>

      </div>
    </div>
  );
};
