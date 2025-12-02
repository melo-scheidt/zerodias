import React, { useState } from 'react';
import { Icons } from '../constants';
import { DiceResult } from '../types';

interface DiceRollerProps {
  history: DiceResult[];
  setHistory: React.Dispatch<React.SetStateAction<DiceResult[]>>;
}

export const DiceRoller: React.FC<DiceRollerProps> = ({ history, setHistory }) => {
  const [numDice, setNumDice] = useState(1);
  const [modifier, setModifier] = useState(0);

  const rollDice = (sides: number) => {
    const rolls: number[] = [];
    for (let i = 0; i < numDice; i++) {
      rolls.push(Math.floor(Math.random() * sides) + 1);
    }
    const sum = rolls.reduce((a, b) => a + b, 0) + modifier;
    const result: DiceResult = { diceType: sides, rolls: rolls, final: sum, timestamp: Date.now() };
    setHistory(prev => [result, ...prev].slice(0, 50));
  };

  const rollOrdemTest = (diceCount: number) => {
    let rolls: number[] = [];
    let final = 0;
    if (diceCount > 0) {
        for (let i = 0; i < diceCount; i++) {
            rolls.push(Math.floor(Math.random() * 20) + 1);
        }
        final = Math.max(...rolls);
    } else {
        rolls.push(Math.floor(Math.random() * 20) + 1);
        rolls.push(Math.floor(Math.random() * 20) + 1);
        final = Math.min(...rolls);
    }
    const result: DiceResult = { diceType: 20, rolls, final: final + modifier, timestamp: Date.now(), isAttributeRoll: true };
    setHistory(prev => [result, ...prev].slice(0, 50));
  };

  return (
    <div className="flex flex-col h-full bg-ordem-panel/50 rounded-lg border border-ordem-border relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute -right-20 -bottom-20 opacity-5 text-ordem-red rotate-12 pointer-events-none">
          <svg width="300" height="300" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 22h20L12 2zm0 3.5L18.5 19H5.5L12 5.5z"/></svg>
      </div>

      <div className="p-6 border-b border-ordem-border flex justify-between items-center bg-zinc-950/50">
          <h2 className="text-xl font-display text-ordem-gold flex items-center gap-3">
             <div className="bg-ordem-gold/10 p-2 rounded-full border border-ordem-gold/20"><Icons.Dices /></div>
             SISTEMA DE ROLAGEM
          </h2>
      </div>

      <div className="flex-1 flex flex-col md:flex-row gap-6 p-6 overflow-hidden">
         {/* Controls Panel */}
         <div className="w-full md:w-1/3 space-y-6">
            
            <div className="bg-black/40 p-4 rounded border border-zinc-800 space-y-4 shadow-inner">
                <div className="flex justify-between items-center">
                    <label className="text-zinc-500 text-xs font-bold uppercase tracking-wider">Quantidade</label>
                    <div className="flex items-center bg-zinc-900 rounded border border-zinc-700">
                        <button onClick={() => setNumDice(Math.max(1, numDice - 1))} className="w-8 h-8 hover:bg-zinc-800 text-zinc-400 font-bold">-</button>
                        <span className="w-10 text-center font-display text-xl text-white">{numDice}</span>
                        <button onClick={() => setNumDice(numDice + 1)} className="w-8 h-8 hover:bg-zinc-800 text-zinc-400 font-bold">+</button>
                    </div>
                </div>
                <div className="flex justify-between items-center">
                    <label className="text-zinc-500 text-xs font-bold uppercase tracking-wider">Modificador</label>
                    <input 
                        type="number" 
                        value={modifier} 
                        onChange={(e) => setModifier(parseInt(e.target.value) || 0)}
                        className="w-20 bg-zinc-900 border border-zinc-700 rounded p-1 text-center text-white font-mono focus:border-ordem-gold outline-none"
                    />
                </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
                {[4, 6, 8, 10, 12, 20, 100].map(side => (
                <button 
                    key={side}
                    onClick={() => rollDice(side)}
                    className="group relative bg-zinc-900 hover:bg-ordem-red hover:border-red-500 text-zinc-400 hover:text-white py-3 rounded border border-zinc-800 transition-all overflow-hidden"
                >
                    <span className="relative z-10 font-mono text-sm font-bold group-hover:scale-110 block transition-transform">d{side}</span>
                    <div className="absolute inset-0 bg-red-900/0 group-hover:bg-red-900/20 transition-colors"></div>
                </button>
                ))}
            </div>

            <button 
            onClick={() => rollOrdemTest(numDice)}
            className="w-full bg-ordem-gold/10 hover:bg-ordem-gold/20 text-ordem-gold font-display py-4 rounded border border-ordem-gold/40 hover:border-ordem-gold transition-all uppercase tracking-widest shadow-[0_0_15px_rgba(212,180,131,0.1)] hover:shadow-[0_0_25px_rgba(212,180,131,0.3)]"
            >
            TESTE DE PERÍCIA
            </button>
         </div>

         {/* History Panel - Terminal Style */}
         <div className="flex-1 bg-black rounded border border-zinc-800 flex flex-col overflow-hidden relative shadow-inner">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-ordem-gold to-transparent opacity-20"></div>
            <div className="p-2 bg-zinc-900/50 text-[10px] text-zinc-600 font-mono uppercase border-b border-zinc-800 flex justify-between">
                <span>Log de Operações</span>
                <span>REC</span>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar font-mono">
                {history.map((h, i) => (
                    <div key={h.timestamp + i} className="flex items-start gap-4 border-b border-zinc-900 pb-2 animate-in slide-in-from-right-2 fade-in duration-300">
                        <div className="text-[10px] text-zinc-600 w-12 text-right pt-1">
                            {new Date(h.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}
                        </div>
                        <div className="flex-1">
                             <div className="flex justify-between items-baseline">
                                <span className="text-xs text-ordem-gold uppercase font-bold tracking-wider">
                                    {h.isAttributeRoll ? `TESTE DE PERÍCIA` : `ROLAGEM (d${h.diceType})`}
                                </span>
                                <span className={`text-xl font-bold ${h.final === 20 || (h.diceType === 20 && h.final >= 20) ? 'text-ordem-gold text-glow' : (h.final === 1 ? 'text-ordem-red text-glow-red' : 'text-white')}`}>
                                    {h.final}
                                </span>
                             </div>
                             <div className="text-[10px] text-zinc-500 break-words mt-1">
                                <span className="text-zinc-600">INPUT:</span> [{h.rolls.join(', ')}] {modifier !== 0 && (modifier > 0 ? `+ ${modifier}` : `- ${Math.abs(modifier)}`)}
                             </div>
                        </div>
                    </div>
                ))}
                 {history.length === 0 && (
                     <div className="h-full flex flex-col items-center justify-center text-zinc-700 opacity-50">
                         <Icons.Dices />
                         <span className="mt-2 text-xs">AGUARDANDO DADOS...</span>
                     </div>
                 )}
            </div>
         </div>
      </div>
    </div>
  );
};