
import React, { useState } from 'react';
import { Icons } from '../constants';

type Category = 'condicoes' | 'descanso' | 'acoes';

interface RuleItem {
  name: string;
  effect: string;
}

export const MechanicsReference: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<Category>('condicoes');
  const [searchTerm, setSearchTerm] = useState('');

  const data: Record<Category, RuleItem[]> = {
    condicoes: [
      { name: 'Abalado', effect: 'O personagem sofre -2 em testes de perícia (exceto testes de resistência).' },
      { name: 'Agarrado', effect: 'O personagem fica imóvel, não pode falar, desprevenido e sofre -2 em testes de ataque. Só pode atacar com armas leves.' },
      { name: 'Alquebrado', effect: 'Custa 1 PE a mais para usar habilidades e rituais.' },
      { name: 'Atordoado', effect: 'Desprevenido e não pode fazer ações.' },
      { name: 'Caído', effect: 'Deslocamento reduzido a 1,5m. -5 em ataques corpo a corpo. Oponentes têm +5 contra você.' },
      { name: 'Cego', effect: 'Desprevenido, lento, falha automática em testes que dependem da visão. -5 em outros testes.' },
      { name: 'Confuso', effect: 'Comporta-se aleatoriamente. Role 1d6: 1-3 move-se em direção aleatória; 4-6 ataca a criatura mais próxima.' },
      { name: 'Debilitado', effect: 'O personagem sofre -5 em testes de atributos Físicos (Força, Agilidade e Vigor).' },
      { name: 'Desprevenido', effect: '-5 na Defesa e Reflexos. Você não pode reagir.' },
      { name: 'Doente', effect: 'Sob efeito de uma doença. Varia conforme a doença.' },
      { name: 'Enjoado', effect: 'Só pode realizar uma ação padrão ou de movimento por turno (não ambas).' },
      { name: 'Enredado', effect: 'Deslocamento reduzido à metade, não pode correr ou investir. -2 em ataques.' },
      { name: 'Exausto', effect: 'Deslocamento reduzido à metade. -2 em testes. Não pode correr.' },
      { name: 'Fascinado', effect: 'Sofre -5 em Percepção. Não pode fazer ações. Qualquer ameaça quebra o efeito.' },
      { name: 'Fatigado', effect: 'O personagem sofre -2 em testes de perícia. Se ficar fatigado novamente, fica exausto.' },
      { name: 'Fraco', effect: 'O personagem sofre -2 em testes de atributos Físicos e dano corpo a corpo.' },
      { name: 'Frustrado', effect: 'O personagem sofre -2 em testes de atributos Mentais (Intelecto, Presença).' },
      { name: 'Imóvel', effect: 'Deslocamento 0. Desprevenido.' },
      { name: 'Inconsciente', effect: 'Indefeso. Não pode fazer ações. Cai no chão.' },
      { name: 'Indefeso', effect: 'Desprevenido. Oponentes recebem +5 no ataque. Golpe de misericórdia é possível.' },
      { name: 'Lento', effect: 'Deslocamento reduzido à metade. Não pode correr ou investir.' },
      { name: 'Machucado', effect: 'Tem menos da metade dos PV totais. Condição visual para inimigos.' },
      { name: 'Morrendo', effect: 'Com 0 ou menos PV. Inconsciente. Sangrando. Precisa de testes de Vigor para não morrer.' },
      { name: 'Ofuscado', effect: '-2 em ataques e percepção visual.' },
      { name: 'Paralisado', effect: 'Imóvel e indefeso. Só pode realizar ações puramente mentais.' },
      { name: 'Petrificado', effect: 'Inconsciente. Resistência a dano 10. Imune a veneno e doença.' },
      { name: 'Perturbado', effect: 'O personagem sofre -5 em testes de atributos Mentais e Vontade.' },
      { name: 'Sangrando', effect: 'Perde 1d6 PV no início de cada turno. Teste de Medicina (DT 15) para estancar.' },
      { name: 'Surdo', effect: '-5 em testes de Iniciativa e Percepção auditiva. Condição de conjuração 20% de falha.' },
      { name: 'Surpreendido', effect: 'Desprevenido e não pode agir na rodada de surpresa.' },
      { name: 'Vulnerável', effect: 'Sofre -2 na Defesa.' },
    ],
    descanso: [
      { name: 'Descanso Curto (Normal)', effect: 'Duração: 4h (interlúdio). Recupera PV e PE igual ao valor de Vigor e Presença, respectivamente.' },
      { name: 'Descanso Curto (Relaxante)', effect: 'Duração: 4h em local seguro. Recupera o dobro de um descanso normal.' },
      { name: 'Descanso Longo (Normal)', effect: 'Duração: 6h de sono + 2h atividade leve. Recupera o dobro do descanso curto.' },
      { name: 'Descanso Longo (Confortável)', effect: 'Duração: 8h em local muito confortável. Recupera PV e PE totais.' },
      { name: 'Sono Ruim', effect: 'Se dormir de armadura ou em condições ruins, recupera metade do normal e acorda fatigado.' },
    ],
    acoes: [
      { name: 'Agarrar', effect: 'Ataque corpo a corpo (Luta). Se acertar, causa dano e deixa Agarrado (teste oposto).' },
      { name: 'Ajuda', effect: 'Ação padrão. Concede +2 ou +5 (se passar no teste DT 10) para o teste de um aliado.' },
      { name: 'Atropelar', effect: 'Parte do movimento. Derruba o alvo se passar no teste oposto (Atletismo vs Reflexos).' },
      { name: 'Derrubar', effect: 'Ataque (Luta). Não causa dano, mas deixa o alvo Caído.' },
      { name: 'Desarmar', effect: 'Ataque (Luta ou Pontaria). Se acertar, oponente derruba a arma.' },
      { name: 'Fintar', effect: 'Ação padrão (Enganação). Se passar, oponente fica Desprevenido contra seu próximo ataque.' },
      { name: 'Fuga', effect: 'Ação completa. Dobro do deslocamento para fugir.' },
      { name: 'Investida', effect: 'Ação completa. Dobro do deslocamento e ataque com +2 (sofre -2 Defesa).' },
      { name: 'Preparar', effect: 'Ação padrão. Prepara uma ação para acontecer após um gatilho específico.' },
    ]
  };

  const filteredData = data[activeCategory].filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.effect.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-ordem-panel/50 rounded-lg border border-ordem-border relative overflow-hidden animate-in fade-in">
        
        {/* Header */}
        <div className="p-6 border-b border-ordem-border bg-zinc-950 flex flex-col gap-4">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-display text-white tracking-widest uppercase text-glow flex items-center gap-3">
                    <Icons.Book /> Arquivos da Ordem
                </h2>
                <div className="relative">
                    <input 
                        type="text" 
                        placeholder="Buscar regra..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-black border border-zinc-700 rounded px-3 py-1 text-sm text-white focus:border-ordem-gold outline-none w-48 font-mono"
                    />
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 font-mono text-sm border-b border-zinc-800">
                <button 
                    onClick={() => setActiveCategory('condicoes')}
                    className={`px-4 py-2 border-b-2 transition-colors ${activeCategory === 'condicoes' ? 'border-ordem-gold text-ordem-gold' : 'border-transparent text-zinc-500 hover:text-white'}`}
                >
                    CONDIÇÕES
                </button>
                <button 
                    onClick={() => setActiveCategory('acoes')}
                    className={`px-4 py-2 border-b-2 transition-colors ${activeCategory === 'acoes' ? 'border-ordem-gold text-ordem-gold' : 'border-transparent text-zinc-500 hover:text-white'}`}
                >
                    AÇÕES TÁTICAS
                </button>
                <button 
                    onClick={() => setActiveCategory('descanso')}
                    className={`px-4 py-2 border-b-2 transition-colors ${activeCategory === 'descanso' ? 'border-ordem-gold text-ordem-gold' : 'border-transparent text-zinc-500 hover:text-white'}`}
                >
                    DESCANSO
                </button>
            </div>
        </div>

        {/* Content List */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-black/20">
            {filteredData.length === 0 ? (
                <div className="text-zinc-500 font-mono text-center mt-10">Nenhum registro encontrado.</div>
            ) : (
                <div className="space-y-4">
                    {filteredData.map((item, idx) => (
                        <div key={idx} className="bg-zinc-900/50 border border-zinc-800 p-4 rounded hover:border-ordem-gold/30 transition-colors group">
                            <h3 className="font-display text-lg text-ordem-red mb-1 group-hover:text-ordem-gold transition-colors">
                                {item.name}
                            </h3>
                            <p className="font-mono text-sm text-zinc-300 leading-relaxed">
                                {item.effect}
                            </p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    </div>
  );
};
