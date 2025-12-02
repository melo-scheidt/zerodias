
import React, { useState, useRef, useEffect } from 'react';
import { Icons, INITIAL_SKILLS } from '../constants';
import { generateNarrativeHelp, parseAgentFromPdf } from '../services/geminiService';
import { Agente, Classe } from '../types';

interface Message {
    role: 'user' | 'ai';
    content: string;
}

interface InvestigatorAssistantProps {
    agents: Agente[];
    onDeleteAgent: (id: string) => void;
    onAddAgent: (agent: Agente) => void;
}

export const InvestigatorAssistant: React.FC<InvestigatorAssistantProps> = ({ agents, onDeleteAgent, onAddAgent }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
      { role: 'ai', content: 'Conexão estabelecida com C.R.I.S. (Consultoria de Registros e Informações Sobrenaturais).\nComo posso auxiliar sua investigação hoje?' }
  ]);
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setLoading(true);
      setMessages(prev => [...prev, { role: 'user', content: `[UPLOAD DE ARQUIVO] ${file.name}` }]);
      setMessages(prev => [...prev, { role: 'ai', content: "Iniciando digitalização óptica e análise de dados..." }]);

      const reader = new FileReader();
      reader.onload = async (ev) => {
          try {
              const base64Data = (ev.target?.result as string).split(',')[1];
              // Importante: Passar o tipo do arquivo correto (image/png, application/pdf, etc)
              const parsedAgent = await parseAgentFromPdf(base64Data, file.type);

              if (parsedAgent) {
                   const newAgent: Agente = {
                      id: Date.now().toString(),
                      nome: parsedAgent.nome || 'Agente Não Identificado',
                      origem: parsedAgent.origem || 'Desconhecida',
                      classe: (parsedAgent.classe as any) || Classe.COMBATENTE,
                      trilha: parsedAgent.trilha || '',
                      nex: parsedAgent.nex || 5,
                      patente: parsedAgent.patente || 'Recruta',
                      atributos: parsedAgent.atributos || { agi: 1, for: 1, int: 1, pre: 1, vig: 1 },
                      status: parsedAgent.status || { pvAtual: 20, pvMax: 20, sanAtual: 20, sanMax: 20, peAtual: 5, peMax: 5 },
                      pericias: parsedAgent.pericias || JSON.parse(JSON.stringify(INITIAL_SKILLS)),
                      
                      defesa: parsedAgent.defesa || 10,
                      protecao: parsedAgent.protecao || '',
                      deslocamento: parsedAgent.deslocamento || '9m',
                      ataques: parsedAgent.ataques || [],
                      habilidades: parsedAgent.habilidades || [],
                      
                      inventario: parsedAgent.inventario || '',
                      detalhes: parsedAgent.detalhes || '',
                      
                      // Campos opcionais default
                      obliquo: {
                          cabeca: { dano: 0, limite: 10, lesao: '' },
                          torco: { dano: 0, limite: 25, lesao: '' },
                          bracoEsq: { dano: 0, limite: 12, lesao: '' },
                          bracoDir: { dano: 0, limite: 12, lesao: '' },
                          pernaEsq: { dano: 0, limite: 15, lesao: '' },
                          pernaDir: { dano: 0, limite: 15, lesao: '' }
                      },
                      resistencias: {
                          fisica: 0, balistica: 0, corte: 0, impacto: 0, perfuracao: 0,
                          eletricidade: 0, fogo: 0, frio: 0, quimico: 0,
                          mental: 0, sangue: 0, morte: 0, energia: 0, conhecimento: 0, medo: 0
                      }
                  };
                  
                  onAddAgent(newAgent);
                  setMessages(prev => [...prev, { 
                      role: 'ai', 
                      content: `ANÁLISE CONCLUÍDA.\nFicha do agente "${newAgent.nome}" foi compilada e adicionada ao banco de dados com sucesso.` 
                  }]);

              } else {
                  setMessages(prev => [...prev, { role: 'ai', content: "FALHA NA LEITURA. O documento está ilegível ou corrompido." }]);
              }
          } catch (error) {
              setMessages(prev => [...prev, { role: 'ai', content: "ERRO CRÍTICO no processamento do arquivo." }]);
              console.error(error);
          } finally {
              setLoading(false);
              if(fileInputRef.current) fileInputRef.current.value = '';
          }
      };
      reader.readAsDataURL(file);
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
            <div className="flex items-center gap-2">
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={loading}
                    className="flex items-center gap-2 text-[10px] text-zinc-400 font-mono border border-zinc-700 px-2 py-1 rounded hover:text-green-500 hover:border-green-500 transition-colors uppercase"
                >
                   <Icons.Upload /> SCANNER OCR
                </button>
                <div className="text-[10px] text-zinc-600 font-mono border border-zinc-700 px-2 py-0.5 rounded">
                    SECURE_CONNECTION
                </div>
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*,application/pdf"
                    onChange={handlePdfUpload}
                />
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
                        PROCESSANDO DADOS NO OUTRO LADO...
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
