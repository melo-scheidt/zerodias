
import React, { useState, useRef, useEffect } from 'react';
import { Icons } from '../constants';
import { generateNarrativeHelp } from '../services/geminiService';
import { Agente } from '../types';

interface Message {
    role: 'user' | 'ai';
    content: string;
}

interface InvestigatorAssistantProps {
    agents: Agente[];
    onDeleteAgent: (id: string) => void;
}

export const InvestigatorAssistant: React.FC<InvestigatorAssistantProps> = ({ agents, onDeleteAgent }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
      { role: 'ai', content: 'Conexão estabelecida com C.R.I.S. (Consultoria de Registros e Informações Sobrenaturais).\nComo posso auxiliar sua investigação hoje?' }
  ]);
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const handleSend = async () => {
      if (!input.trim() || loading) return;
      
      const userMsg = input;
      setInput('');
      setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
      setLoading(true);

      // Chama o serviço passando a lista atual de agentes para contexto
      const response = await generateNarrativeHelp(userMsg, agents);
      
      // 1. Se houver texto normal, exibe
      if (response.text) {
          setMessages(prev => [...prev, { role: 'ai', content: response.text }]);
      }

      // 2. Processa chamadas de função (Ferramentas)
      if (response.toolCalls && response.toolCalls.length > 0) {
          for (const call of response.toolCalls) {
              if (call.name === 'delete_agent') {
                  const targetName = call.args['agentName'];
                  
                  // Tenta encontrar o agente pelo nome (case insensitive)
                  const targetAgent = agents.find(a => a.nome.toLowerCase() === targetName.toLowerCase());

                  if (targetAgent) {
                      onDeleteAgent(targetAgent.id);
                      setMessages(prev => [...prev, { 
                          role: 'ai', 
                          content: `PROTOCOLOS DE SEGURANÇA AUTORIZADOS.\nRegistro do agente "${targetAgent.nome}" foi permanentemente expurgado do sistema.` 
                      }]);
                  } else {
                      setMessages(prev => [...prev, { 
                          role: 'ai', 
                          content: `ERRO: Agente "${targetName}" não encontrado no banco de dados local. Verifique a grafia.` 
                      }]);
                  }
              }
          }
      } else if (!response.text) {
          // Fallback caso a IA não retorne nada (raro)
          setMessages(prev => [...prev, { role: 'ai', content: "..." }]);
      }

      setLoading(false);
  };

  useEffect(() => {
      endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex flex-col h-full bg-black rounded-lg border border-zinc-800 overflow-hidden relative shadow-[0_0_50px_rgba(0,0,0,0.5)]">
        {/* Terminal Header */}
        <div className="bg-zinc-900/80 p-3 border-b border-zinc-800 flex items-center justify-between z-10">
            <h2 className="font-mono text-green-500 text-sm flex items-center gap-2 tracking-wider">
                <span className="animate-pulse">●</span> C.R.I.S._TERMINAL_V2
            </h2>
            <div className="text-[10px] text-zinc-600 font-mono border border-zinc-700 px-2 py-0.5 rounded">
                SECURE_CONNECTION
            </div>
        </div>

        {/* CRT Overlay inside container */}
        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-[5] bg-[length:100%_2px,3px_100%] opacity-20"></div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar font-mono text-sm relative z-0">
            {messages.map((m, i) => (
                <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <span className="text-[10px] text-zinc-600 mb-1 uppercase tracking-widest">
                        {m.role === 'user' ? 'AGENTE' : 'SISTEMA'}
                    </span>
                    <div className={`max-w-[85%] p-4 rounded-sm border relative ${
                        m.role === 'user' 
                        ? 'bg-zinc-900 border-zinc-700 text-zinc-300' 
                        : 'bg-black border-green-900/50 text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.05)]'
                    }`}>
                        {/* Decorative corners for AI messages */}
                        {m.role === 'ai' && (
                            <>
                                <div className="absolute -top-px -left-px w-2 h-2 border-t border-l border-green-600"></div>
                                <div className="absolute -bottom-px -right-px w-2 h-2 border-b border-r border-green-600"></div>
                            </>
                        )}
                        <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
                    </div>
                </div>
            ))}
            {loading && (
                 <div className="flex flex-col items-start animate-pulse">
                    <span className="text-[10px] text-zinc-600 mb-1">SISTEMA</span>
                    <div className="bg-black border border-green-900/30 p-3 text-green-600 text-xs">
                        PROCESSANDO CONSULTA AO OUTRO LADO...
                    </div>
                 </div>
            )}
            <div ref={endRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-zinc-900 border-t border-zinc-800 flex gap-4 relative z-10">
            <div className="flex-1 relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-green-500 font-mono">{'>'}</span>
                <input 
                    type="text" 
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSend()}
                    placeholder="Digite seu comando..."
                    className="w-full bg-black border border-zinc-700 p-3 pl-8 text-sm text-green-100 focus:outline-none focus:border-green-600 font-mono shadow-inner"
                    autoFocus
                />
            </div>
            <button 
                onClick={handleSend}
                disabled={loading}
                className="bg-zinc-800 hover:bg-green-900/30 text-green-500 border border-zinc-700 hover:border-green-600 px-6 rounded transition-all font-mono text-xs uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
            >
                Enviar
            </button>
        </div>
    </div>
  );
};
