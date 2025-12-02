
import React, { useState } from 'react';
import { Agente } from '../types';
import { Icons, INITIAL_SKILLS } from '../constants';
import { generateRandomAgent } from '../services/geminiService';

interface CharacterGalleryProps {
  agents: Agente[];
  onSelectAgent: (agent: Agente) => void;
  onAddAgent: (agent: Agente) => void;
  onDeleteAgent: (agentId: string) => void;
}

export const CharacterGallery: React.FC<CharacterGalleryProps> = ({ agents, onSelectAgent, onAddAgent, onDeleteAgent }) => {
  const [loading, setLoading] = useState(false);

  const handleCreateAI = async () => {
    setLoading(true);
    const partialAgent = await generateRandomAgent();
    
    if (partialAgent) {
      const newAgent: Agente = {
        id: Date.now().toString(),
        nome: partialAgent.nome || 'Agente Desconhecido',
        origem: partialAgent.origem || 'Civil',
        classe: partialAgent.classe as any || 'Especialista',
        trilha: partialAgent.trilha || 'Nenhuma',
        nex: partialAgent.nex || 5,
        patente: partialAgent.patente || 'Recruta',
        atributos: partialAgent.atributos || { agi: 1, for: 1, int: 1, pre: 1, vig: 1 },
        status: partialAgent.status || { pvAtual: 20, pvMax: 20, sanAtual: 20, sanMax: 20, peAtual: 5, peMax: 5 },
        pericias: JSON.parse(JSON.stringify(INITIAL_SKILLS)),
        inventario: partialAgent.inventario || '',
        detalhes: partialAgent.detalhes || ''
      };
      onAddAgent(newAgent);
    } else {
        alert("Falha ao descriptografar dados do novo recruta. Tente novamente.");
    }
    setLoading(false);
  };

  const handleCreateManual = () => {
      const newAgent: Agente = {
        id: Date.now().toString(),
        nome: 'NOVO AGENTE',
        origem: '',
        classe: 'Especialista' as any,
        trilha: '',
        nex: 5,
        patente: 'Recruta',
        atributos: { agi: 1, for: 1, int: 1, pre: 1, vig: 1 },
        status: { pvAtual: 20, pvMax: 20, sanAtual: 20, sanMax: 20, peAtual: 5, peMax: 5 },
        pericias: JSON.parse(JSON.stringify(INITIAL_SKILLS)),
        inventario: '',
        detalhes: ''
      };
      onAddAgent(newAgent);
  };

  return (
    <div className="flex flex-col h-full bg-ordem-panel/50 rounded-lg border border-ordem-border relative overflow-hidden animate-in fade-in">
        
        {/* Header */}
        <div className="p-6 border-b border-ordem-border bg-black/40 flex justify-between items-center">
            <div>
                <h2 className="text-2xl font-display text-white tracking-widest uppercase text-glow">Base de Dados de Pessoal</h2>
                <p className="font-mono text-zinc-500 text-xs">Acesso Restrito: Nível 2+</p>
            </div>
            <div className="flex gap-4">
                <button 
                    onClick={handleCreateManual}
                    className="flex items-center gap-2 border border-zinc-700 text-zinc-400 hover:text-white px-4 py-2 rounded font-mono text-xs uppercase hover:bg-zinc-800 transition-colors"
                >
                    <Icons.FileText /> Criar Vazio
                </button>
                <button 
                    onClick={handleCreateAI}
                    disabled={loading}
                    className="flex items-center gap-2 bg-ordem-gold/10 border border-ordem-gold/50 text-ordem-gold px-4 py-2 rounded font-mono text-xs uppercase hover:bg-ordem-gold hover:text-black transition-all shadow-[0_0_10px_rgba(212,180,131,0.2)]"
                >
                    {loading ? (
                        <span className="animate-pulse">Descriptografando...</span>
                    ) : (
                        <><Icons.Sparkles /> Gerar via C.R.I.S.</>
                    )}
                </button>
            </div>
        </div>

        {/* Grid */}
        <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
            {agents.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-zinc-600 space-y-4">
                    <Icons.Users />
                    <p className="font-mono text-sm">NENHUM AGENTE REGISTRADO NO SISTEMA.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {agents.map((agent) => (
                        <div key={agent.id} className="group relative bg-zinc-950 border border-zinc-800 hover:border-ordem-gold/50 rounded overflow-hidden transition-all duration-300 hover:shadow-[0_5px_20px_rgba(0,0,0,0.5)]">
                            {/* Card Top Decoration */}
                            <div className="h-1 w-full bg-gradient-to-r from-zinc-800 via-zinc-600 to-zinc-800 group-hover:via-ordem-gold transition-all"></div>
                            
                            <div className="p-5 space-y-4">
                                <div className="flex justify-between items-start">
                                    <div className="w-12 h-12 bg-zinc-900 border border-zinc-700 flex items-center justify-center text-zinc-500">
                                        <Icons.Ghost />
                                    </div>
                                    <div className="text-right">
                                        <div className="text-2xl font-bold text-white font-mono">{agent.nex}%</div>
                                        <div className="text-[10px] text-zinc-600 uppercase">Nível de Exposição</div>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-xl font-display text-white truncate group-hover:text-ordem-gold transition-colors">{agent.nome}</h3>
                                    <div className="flex gap-2 text-xs font-mono text-zinc-400 mt-1 uppercase">
                                        <span className="bg-zinc-900 px-1 rounded border border-zinc-800">{agent.classe}</span>
                                        <span className="bg-zinc-900 px-1 rounded border border-zinc-800">{agent.patente}</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-2 border-t border-zinc-800 pt-3">
                                    <div className="text-center">
                                        <div className="text-[10px] text-zinc-600 uppercase">PV</div>
                                        <div className="text-ordem-red font-bold font-mono">{agent.status.pvMax}</div>
                                    </div>
                                    <div className="text-center border-l border-zinc-800">
                                        <div className="text-[10px] text-zinc-600 uppercase">SAN</div>
                                        <div className="text-blue-500 font-bold font-mono">{agent.status.sanMax}</div>
                                    </div>
                                    <div className="text-center border-l border-zinc-800">
                                        <div className="text-[10px] text-zinc-600 uppercase">PE</div>
                                        <div className="text-ordem-gold font-bold font-mono">{agent.status.peMax}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex bg-black border-t border-zinc-800 divide-x divide-zinc-800">
                                <button 
                                    onClick={() => onSelectAgent(agent)}
                                    className="flex-1 py-3 text-xs uppercase font-bold text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors flex items-center justify-center gap-2"
                                >
                                    <Icons.FileText /> Acessar Ficha
                                </button>
                                <button 
                                    onClick={(e) => { 
                                        e.stopPropagation(); 
                                        onDeleteAgent(agent.id); 
                                    }}
                                    className="px-6 py-3 text-zinc-600 bg-zinc-950 hover:bg-ordem-blood hover:text-white transition-all duration-300 relative overflow-hidden group/delete"
                                    title="Excluir Agente"
                                >
                                    <span className="relative z-10"><Icons.Trash /></span>
                                    <div className="absolute inset-0 bg-red-900 transform translate-y-full group-hover/delete:translate-y-0 transition-transform duration-200"></div>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    </div>
  );
};
