
import React, { useState, useRef } from 'react';
import { Agente, Classe, Status, Atributos, SistemaObliquo, VitalPart } from '../types';
import { Icons } from '../constants';
import { generateCharacterPortrait } from '../services/geminiService';

interface CharacterSheetProps {
  agente: Agente;
  setAgente: React.Dispatch<React.SetStateAction<Agente>>;
  onAttributeRoll: (attrName: string, value: number) => void;
}

export const CharacterSheet: React.FC<CharacterSheetProps> = ({ agente, setAgente, onAttributeRoll }) => {
  const [activeTab, setActiveTab] = useState<'geral' | 'adicoes'>('geral');
  const [isGeneratingImg, setIsGeneratingImg] = useState(false);
  const imgInputRef = useRef<HTMLInputElement>(null);

  const handleStatChange = (key: keyof Status, value: number) => {
    setAgente(prev => ({
      ...prev,
      status: { ...prev.status, [key]: value }
    }));
  };

  const handleAttrChange = (key: keyof Atributos, value: number) => {
    setAgente(prev => ({
      ...prev,
      atributos: { ...prev.atributos, [key]: value }
    }));
  };

  const updateObliquo = (part: keyof SistemaObliquo, field: keyof VitalPart, value: any) => {
      if(!agente.obliquo) return;
      
      setAgente(prev => ({
          ...prev,
          obliquo: {
              ...prev.obliquo!,
              [part]: {
                  ...prev.obliquo![part],
                  [field]: value
              }
          }
      }));
  };

  const handleGeneratePortrait = async () => {
    if (!agente.detalhes && !confirm("O campo 'Detalhes' está vazio. A IA pode criar algo aleatório. Continuar?")) return;
    
    setIsGeneratingImg(true);
    const description = `${agente.detalhes || 'Um agente da ordem paranormal, misterioso.'}. ${agente.origem || ''}.`;
    
    const imageUrl = await generateCharacterPortrait(description, agente.classe);
    
    if (imageUrl) {
        setAgente(prev => ({ ...prev, imagem: imageUrl }));
    } else {
        alert("Erro ao gerar imagem. Verifique se a chave de API suporta o modelo Imagen.");
    }
    setIsGeneratingImg(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onload = (ev) => {
              setAgente(prev => ({ ...prev, imagem: ev.target?.result as string }));
          };
          reader.readAsDataURL(file);
      }
  };

  const handleDownloadAgent = () => {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(agente, null, 2));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", `${agente.nome || 'agente'}_ficha.json`);
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
  };

  // Add New Item handlers
  const addAttack = () => {
      setAgente(prev => ({
          ...prev,
          ataques: [...prev.ataques, { nome: '', teste: '', dano: '', critico: '', alcance: '', especial: '' }]
      }));
  };

  const updateAttack = (idx: number, field: string, value: string) => {
      const newAttacks = [...agente.ataques];
      (newAttacks[idx] as any)[field] = value;
      setAgente(prev => ({ ...prev, ataques: newAttacks }));
  };

  const removeAttack = (idx: number) => {
      setAgente(prev => ({
          ...prev,
          ataques: prev.ataques.filter((_, i) => i !== idx)
      }));
  };

  const addAbility = () => {
      setAgente(prev => ({
          ...prev,
          habilidades: [...prev.habilidades, { nome: '', custo: '', descricao: '' }]
      }));
  };

  const updateAbility = (idx: number, field: string, value: string) => {
      const newAbilities = [...agente.habilidades];
      (newAbilities[idx] as any)[field] = value;
      setAgente(prev => ({ ...prev, habilidades: newAbilities }));
  };
  
  const removeAbility = (idx: number) => {
      setAgente(prev => ({
          ...prev,
          habilidades: prev.habilidades.filter((_, i) => i !== idx)
      }));
  };

  // Componente de Atributo Hexagonal
  const AttrBlock = ({ label, value, prop }: { label: string, value: number, prop: keyof Atributos }) => (
    <div className="relative flex flex-col items-center justify-center w-24 h-24 group">
      {/* Hexagon shape border using SVG */}
      <svg className="absolute inset-0 w-full h-full text-zinc-800 group-hover:text-ordem-gold transition-colors duration-300" viewBox="0 0 100 100">
         <path d="M50 0 L93.3 25 L93.3 75 L50 100 L6.7 75 L6.7 25 Z" fill="none" stroke="currentColor" strokeWidth="2"/>
      </svg>
      {/* Background fill */}
      <svg className="absolute inset-0 w-full h-full text-zinc-900/50" viewBox="0 0 100 100">
         <path d="M50 0 L93.3 25 L93.3 75 L50 100 L6.7 75 L6.7 25 Z" fill="currentColor"/>
      </svg>
      
      <span className="relative z-10 text-zinc-500 text-xs font-bold uppercase tracking-widest">{label}</span>
      <input 
        type="number" 
        value={value}
        onChange={(e) => handleAttrChange(prop, parseInt(e.target.value) || 0)}
        className="relative z-10 text-3xl font-display text-white bg-transparent text-center w-16 focus:outline-none focus:text-ordem-gold"
      />
      <button 
        onClick={() => onAttributeRoll(label, value)}
        className="absolute -bottom-2 z-20 text-[10px] bg-zinc-900 border border-zinc-700 text-zinc-400 hover:text-white hover:border-ordem-gold px-2 py-0.5 rounded uppercase tracking-wider transition-all"
      >
        Rolar
      </button>
    </div>
  );

  const StatBar = ({ current, max, label, colorClass, maxProp, currentProp, icon: Icon }: any) => (
    <div className="flex flex-col w-full mb-4 bg-black/40 p-2 rounded border border-zinc-800/50">
      <div className="flex justify-between items-end text-xs uppercase font-bold text-zinc-400 mb-2">
        <div className="flex items-center gap-2">
           {Icon && <Icon />}
           <span className="tracking-wider">{label}</span>
        </div>
        <div className="font-mono text-white text-sm">
           <span className={`${current < max / 2 ? 'text-red-500 animate-pulse' : 'text-white'}`}>{current}</span>
           <span className="text-zinc-600 mx-1">/</span>
           <span className="text-zinc-500">{max}</span>
        </div>
      </div>
      <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden relative">
        <div 
          className={`h-full ${colorClass} shadow-[0_0_10px_currentColor] transition-all duration-500 ease-out`} 
          style={{ width: `${Math.min(100, Math.max(0, (current / max) * 100))}%` }}
        />
      </div>
      {/* Input controls overlay (stealth) */}
      <div className="flex justify-between mt-1 opacity-20 hover:opacity-100 transition-opacity">
         <input 
          type="range" min="0" max={max} value={current}
          onChange={(e) => handleStatChange(currentProp, parseInt(e.target.value) || 0)}
          className="w-full h-6 absolute inset-0 opacity-0 cursor-ew-resize"
         />
         <div className="flex w-full justify-between gap-2 mt-1">
            <input 
               className="bg-zinc-900 border border-zinc-700 text-center text-xs w-12 text-white font-mono rounded focus:border-ordem-gold outline-none"
               value={current}
               onChange={(e) => handleStatChange(currentProp, parseInt(e.target.value) || 0)}
            />
             <input 
               className="bg-zinc-900 border border-zinc-700 text-center text-xs w-12 text-zinc-400 font-mono rounded focus:border-ordem-gold outline-none"
               value={max}
               onChange={(e) => handleStatChange(maxProp, parseInt(e.target.value) || 0)}
            />
         </div>
      </div>
    </div>
  );

  const ObliquePart = ({ name, partKey, data, x, y }: { name: string, partKey: keyof SistemaObliquo, data: VitalPart, x: string, y: string }) => {
      const isCritical = data.dano >= data.limite;
      return (
          <div className="absolute p-2 bg-black/80 border border-zinc-700 rounded w-40 hover:border-ordem-gold hover:z-50 transition-all backdrop-blur-sm" style={{ top: y, left: x }}>
              <div className="flex justify-between items-center mb-1">
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${isCritical ? 'text-red-500 animate-pulse' : 'text-zinc-400'}`}>{name}</span>
                  <span className="text-[10px] font-mono text-zinc-600">{data.dano}/{data.limite}</span>
              </div>
              
              <div className="w-full bg-zinc-800 h-1.5 rounded mb-2 overflow-hidden">
                   <div className="h-full bg-ordem-red" style={{ width: `${Math.min(100, (data.dano/data.limite)*100)}%` }}></div>
              </div>

              <div className="flex gap-1 mb-2">
                  <button onClick={() => updateObliquo(partKey, 'dano', Math.max(0, data.dano - 1))} className="bg-zinc-900 border border-zinc-700 w-6 h-6 flex items-center justify-center text-zinc-400 hover:text-white">-</button>
                  <input 
                    type="number" 
                    value={data.dano}
                    onChange={(e) => updateObliquo(partKey, 'dano', parseInt(e.target.value) || 0)}
                    className="flex-1 bg-zinc-900 border border-zinc-700 text-center text-xs text-white"
                  />
                  <button onClick={() => updateObliquo(partKey, 'dano', data.dano + 1)} className="bg-zinc-900 border border-zinc-700 w-6 h-6 flex items-center justify-center text-zinc-400 hover:text-white">+</button>
              </div>

              <input 
                type="text" 
                placeholder="Obs: Lesão..." 
                value={data.lesao}
                onChange={(e) => updateObliquo(partKey, 'lesao', e.target.value)}
                className="w-full bg-transparent border-b border-zinc-800 text-[10px] text-zinc-300 focus:border-ordem-gold outline-none"
              />
          </div>
      )
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
        
        {/* Sub-Navigation */}
        <div className="flex gap-4 border-b border-zinc-800 pb-4 mb-4 shrink-0 justify-between">
             <div className="flex gap-4">
                <button 
                    onClick={() => setActiveTab('geral')}
                    className={`text-sm font-mono uppercase tracking-widest px-4 py-2 rounded transition-colors ${activeTab === 'geral' ? 'bg-ordem-gold text-black font-bold' : 'bg-black/40 text-zinc-500 hover:text-white'}`}
                >
                    Dossiê Geral
                </button>
                <button 
                    onClick={() => setActiveTab('adicoes')}
                    className={`text-sm font-mono uppercase tracking-widest px-4 py-2 rounded transition-colors flex items-center gap-2 ${activeTab === 'adicoes' ? 'bg-ordem-blood text-white font-bold' : 'bg-black/40 text-zinc-500 hover:text-white'}`}
                >
                    <Icons.Activity /> Adições / Sistema Oblíquo
                </button>
             </div>
             <div>
                 <button 
                    onClick={handleDownloadAgent}
                    className="flex items-center gap-2 text-[10px] font-mono uppercase border border-zinc-700 text-zinc-400 px-3 py-2 rounded hover:text-white hover:border-ordem-gold transition-colors"
                 >
                     <Icons.Upload className="rotate-180" /> Baixar Ficha
                 </button>
             </div>
        </div>

        {activeTab === 'geral' ? (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 h-full overflow-y-auto pr-2 custom-scrollbar pb-20">
            
            {/* Esquerda: Identidade, Atributos, Status, Defesa */}
            <div className="xl:col-span-5 space-y-6 flex flex-col">
                
                {/* Cartão de Identidade */}
                <div className="bg-ordem-panel border border-ordem-border p-5 rounded-sm shadow-lg relative overflow-hidden group">
                    <div className="flex items-center gap-4 mb-6 border-b border-zinc-800 pb-4">
                        <div className="relative group/avatar">
                            <div className="w-20 h-20 bg-zinc-900 border-2 border-zinc-700 flex items-center justify-center overflow-hidden grayscale group-hover/avatar:grayscale-0 transition-all cursor-pointer">
                                {agente.imagem ? (
                                    <img src={agente.imagem} alt="Retrato" className="w-full h-full object-cover" />
                                ) : (
                                    <Icons.Ghost /> 
                                )}
                            </div>
                            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
                                <button onClick={handleGeneratePortrait} disabled={isGeneratingImg} className="bg-zinc-900 border border-ordem-gold text-[8px] text-ordem-gold px-2 py-0.5 rounded shadow hover:bg-ordem-gold hover:text-black transition-colors uppercase">
                                    {isGeneratingImg ? '...' : 'IA'}
                                </button>
                                <button onClick={() => imgInputRef.current?.click()} className="bg-zinc-900 border border-zinc-500 text-[8px] text-zinc-300 px-2 py-0.5 rounded shadow hover:bg-zinc-800 hover:text-white">
                                    <Icons.Upload />
                                </button>
                                <input type="file" ref={imgInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                            </div>
                        </div>

                        <div className="flex-1">
                            <input 
                            value={agente.nome} 
                            onChange={e => setAgente({...agente, nome: e.target.value})}
                            className="w-full bg-transparent text-2xl font-display uppercase text-white placeholder-zinc-700 focus:outline-none focus:text-ordem-gold"
                            placeholder="NOME DO AGENTE"
                            />
                            <div className="flex gap-2 mt-1">
                                <select value={agente.classe} onChange={e => setAgente({...agente, classe: e.target.value as Classe})} className="bg-zinc-900 text-xs font-mono text-ordem-gold border border-zinc-800 uppercase px-2 py-1 outline-none">
                                    {Object.values(Classe).map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                                <input value={`${agente.nex}% NEX`} disabled className="w-20 bg-zinc-900 text-xs font-mono text-center text-zinc-400 border border-zinc-800 uppercase py-1" />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-xs font-mono text-zinc-500 mb-2">
                        <div><label className="block mb-1">ORIGEM</label><input value={agente.origem} onChange={e => setAgente({...agente, origem: e.target.value})} className="w-full bg-transparent border-b border-zinc-800 text-zinc-300 focus:border-ordem-gold outline-none py-1" /></div>
                        <div><label className="block mb-1">TRILHA</label><input value={agente.trilha} onChange={e => setAgente({...agente, trilha: e.target.value})} className="w-full bg-transparent border-b border-zinc-800 text-zinc-300 focus:border-ordem-gold outline-none py-1" /></div>
                        <div><label className="block mb-1">PATENTE</label><input value={agente.patente} onChange={e => setAgente({...agente, patente: e.target.value})} className="w-full bg-transparent border-b border-zinc-800 text-zinc-300 focus:border-ordem-gold outline-none py-1" /></div>
                        <div><label className="block mb-1">DESLOCAMENTO</label><input value={agente.deslocamento} onChange={e => setAgente({...agente, deslocamento: e.target.value})} className="w-full bg-transparent border-b border-zinc-800 text-zinc-300 focus:border-ordem-gold outline-none py-1" /></div>
                    </div>
                </div>

                {/* Atributos (Hexagonais) */}
                <div className="bg-ordem-panel p-6 rounded-sm border border-ordem-border flex justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-5"></div>
                    <div className="grid grid-cols-3 gap-x-2 gap-y-0 place-items-center relative z-10">
                        <div className="col-start-2 translate-y-2"><AttrBlock label="AGI" value={agente.atributos.agi} prop="agi" /></div>
                        <div className="col-start-1 -translate-y-8"><AttrBlock label="FOR" value={agente.atributos.for} prop="for" /></div>
                        <div className="col-start-3 -translate-y-8"><AttrBlock label="INT" value={agente.atributos.int} prop="int" /></div>
                        <div className="col-start-1 -translate-y-6 translate-x-1/2"><AttrBlock label="PRE" value={agente.atributos.pre} prop="pre" /></div>
                        <div className="col-start-3 -translate-y-6 -translate-x-1/2"><AttrBlock label="VIG" value={agente.atributos.vig} prop="vig" /></div>
                    </div>
                </div>

                {/* Status e Defesa (Layout Misto) */}
                <div className="flex gap-4">
                    {/* Status Bars */}
                    <div className="flex-1 bg-ordem-panel p-5 rounded-sm border border-ordem-border relative">
                        <div className="absolute -left-1 top-4 w-1 h-8 bg-ordem-red"></div>
                        <StatBar label="Pontos de Vida" current={agente.status.pvAtual} max={agente.status.pvMax} currentProp="pvAtual" maxProp="pvMax" colorClass="bg-ordem-red" icon={Icons.Heart} />
                        <StatBar label="Sanidade" current={agente.status.sanAtual} max={agente.status.sanMax} currentProp="sanAtual" maxProp="sanMax" colorClass="bg-blue-600" icon={Icons.Brain} />
                        <StatBar label="Esforço" current={agente.status.peAtual} max={agente.status.peMax} currentProp="peAtual" maxProp="peMax" colorClass="bg-ordem-gold" icon={Icons.Sparkles} />
                    </div>

                    {/* Defesa Shield */}
                    <div className="w-32 bg-ordem-panel border border-ordem-border rounded-sm flex flex-col items-center justify-center relative p-2">
                        <Icons.Shield />
                        <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest mt-1">DEFESA</span>
                        <input 
                            type="number" 
                            value={agente.defesa}
                            onChange={(e) => setAgente({...agente, defesa: parseInt(e.target.value) || 0})}
                            className="bg-transparent text-4xl font-display text-white text-center w-full focus:outline-none focus:text-ordem-gold"
                        />
                        <input 
                            placeholder="Proteção..."
                            value={agente.protecao}
                            onChange={(e) => setAgente({...agente, protecao: e.target.value})}
                            className="text-center text-[10px] bg-transparent text-zinc-500 border-b border-zinc-800 w-full focus:border-ordem-gold outline-none"
                        />
                    </div>
                </div>

                {/* Tabela de Ataques (Novo) */}
                <div className="bg-ordem-panel border border-ordem-border rounded-sm overflow-hidden">
                    <div className="bg-zinc-900/80 p-2 border-b border-zinc-800 flex justify-between items-center px-4">
                        <h3 className="text-zinc-300 font-display tracking-widest text-sm flex items-center gap-2"><Icons.Sword /> ATAQUES</h3>
                        <button onClick={addAttack} className="text-[10px] bg-zinc-800 hover:bg-zinc-700 px-2 py-1 rounded text-zinc-300">+ Add Arma</button>
                    </div>
                    <div className="p-2">
                        {/* Header */}
                        <div className="grid grid-cols-12 gap-2 text-[10px] uppercase font-bold text-zinc-600 px-2 mb-1">
                            <div className="col-span-3">Ataque/Arma</div>
                            <div className="col-span-2">Teste</div>
                            <div className="col-span-2">Dano</div>
                            <div className="col-span-2">Crítico</div>
                            <div className="col-span-2">Alcance/Esp.</div>
                            <div className="col-span-1"></div>
                        </div>
                        {/* Rows */}
                        {agente.ataques.map((atk, idx) => (
                            <div key={idx} className="grid grid-cols-12 gap-2 mb-2 px-2 items-center group">
                                <div className="col-span-3"><input value={atk.nome} onChange={e => updateAttack(idx, 'nome', e.target.value)} className="w-full bg-black/30 border border-zinc-800 p-1 text-xs text-white" placeholder="Arma" /></div>
                                <div className="col-span-2"><input value={atk.teste} onChange={e => updateAttack(idx, 'teste', e.target.value)} className="w-full bg-black/30 border border-zinc-800 p-1 text-xs text-white" placeholder="O+10" /></div>
                                <div className="col-span-2"><input value={atk.dano} onChange={e => updateAttack(idx, 'dano', e.target.value)} className="w-full bg-black/30 border border-zinc-800 p-1 text-xs text-white" placeholder="1d8" /></div>
                                <div className="col-span-2"><input value={atk.critico} onChange={e => updateAttack(idx, 'critico', e.target.value)} className="w-full bg-black/30 border border-zinc-800 p-1 text-xs text-white" placeholder="19/x2" /></div>
                                <div className="col-span-2"><input value={atk.alcance} onChange={e => updateAttack(idx, 'alcance', e.target.value)} className="w-full bg-black/30 border border-zinc-800 p-1 text-xs text-white" placeholder="Curto" /></div>
                                <div className="col-span-1 text-center"><button onClick={() => removeAttack(idx)} className="text-zinc-600 hover:text-red-500 text-xs">X</button></div>
                            </div>
                        ))}
                         {agente.ataques.length === 0 && <div className="text-center text-[10px] text-zinc-600 py-2">Nenhum ataque registrado</div>}
                    </div>
                </div>

            </div>

            {/* Direita: Perícias, Habilidades, Inventário */}
            <div className="xl:col-span-7 flex flex-col gap-6">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
                    {/* Perícias */}
                    <div className="bg-ordem-panel border border-ordem-border rounded-sm flex flex-col overflow-hidden relative h-[500px]">
                        <div className="bg-zinc-900/80 p-3 border-b border-zinc-800 flex justify-between items-center backdrop-blur">
                            <h3 className="text-ordem-gold font-display tracking-widest">PERÍCIAS</h3>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2 custom-scrollbar gap-1 flex flex-col">
                            {agente.pericias.map((pericia, idx) => (
                                <div key={idx} className="flex items-center justify-between border-b border-zinc-800/50 py-1 hover:bg-zinc-800/20 px-2 text-xs">
                                <span className="font-mono text-zinc-300">{pericia.nome}</span>
                                <div className="flex items-center gap-2">
                                    <select 
                                    value={pericia.treinamento}
                                    onChange={(e) => {
                                        const newPericias = [...agente.pericias];
                                        newPericias[idx].treinamento = e.target.value as any;
                                        let bonus = 0;
                                        if(e.target.value === 'Treinado') bonus = 5;
                                        if(e.target.value === 'Veterano') bonus = 10;
                                        if(e.target.value === 'Expert') bonus = 15;
                                        newPericias[idx].bonus = bonus;
                                        setAgente({...agente, pericias: newPericias});
                                    }}
                                    className="bg-transparent uppercase text-zinc-500 focus:text-ordem-gold outline-none w-16 text-right"
                                    >
                                        <option value="Destreinado">--</option>
                                        <option value="Treinado">TRE</option>
                                        <option value="Veterano">VET</option>
                                        <option value="Expert">EXP</option>
                                    </select>
                                    <div className="w-8 h-6 bg-zinc-900 border border-zinc-700 rounded flex items-center justify-center font-bold text-white">
                                    +{pericia.bonus}
                                    </div>
                                </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Habilidades & Rituais (Novo) */}
                    <div className="bg-ordem-panel border border-ordem-border rounded-sm flex flex-col overflow-hidden h-[500px]">
                        <div className="bg-zinc-900/80 p-3 border-b border-zinc-800 flex justify-between items-center">
                             <h3 className="text-white font-display tracking-widest flex items-center gap-2"><Icons.Sparkles /> HABILIDADES & RITUAIS</h3>
                             <button onClick={addAbility} className="text-[10px] bg-zinc-800 hover:bg-zinc-700 px-2 py-1 rounded text-zinc-300">+</button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-3 custom-scrollbar space-y-3">
                             {agente.habilidades.map((hab, idx) => (
                                 <div key={idx} className="bg-black/30 border border-zinc-800 p-2 rounded relative group">
                                     <button onClick={() => removeAbility(idx)} className="absolute top-2 right-2 text-zinc-600 hover:text-red-500 text-[10px] opacity-0 group-hover:opacity-100">X</button>
                                     <div className="flex justify-between mb-1">
                                         <input value={hab.nome} onChange={e => updateAbility(idx, 'nome', e.target.value)} className="bg-transparent font-bold text-white text-sm w-2/3 border-b border-transparent focus:border-zinc-700" placeholder="Nome da Habilidade" />
                                         <input value={hab.custo} onChange={e => updateAbility(idx, 'custo', e.target.value)} className="bg-zinc-900 text-center text-xs text-ordem-gold w-16 rounded border border-zinc-800" placeholder="Custo" />
                                     </div>
                                     <textarea 
                                         value={hab.descricao}
                                         onChange={e => updateAbility(idx, 'descricao', e.target.value)}
                                         className="w-full bg-transparent text-[10px] text-zinc-400 font-mono resize-none h-12 focus:outline-none"
                                         placeholder="Descrição do efeito..."
                                     />
                                 </div>
                             ))}
                             {agente.habilidades.length === 0 && <div className="text-center text-zinc-600 text-xs mt-10">Nenhuma habilidade registrada.</div>}
                        </div>
                    </div>
                </div>

                {/* Inventário */}
                <div className="bg-ordem-panel border border-ordem-border rounded-sm flex-1 flex flex-col min-h-[200px]">
                <div className="bg-zinc-900/80 p-3 border-b border-zinc-800 flex justify-between items-center">
                    <h3 className="text-zinc-300 font-display tracking-widest flex items-center gap-2">
                        <Icons.Shield /> INVENTÁRIO
                    </h3>
                </div>
                <textarea 
                    value={agente.inventario}
                    onChange={(e) => setAgente({...agente, inventario: e.target.value})}
                    className="flex-1 bg-black/30 p-4 text-sm text-zinc-300 focus:outline-none focus:bg-black/50 font-mono resize-none leading-relaxed"
                    placeholder="Listar equipamentos, documentos e itens paranormais..."
                    spellCheck={false}
                />
                </div>

            </div>
            </div>
        ) : (
            <div className="h-full bg-zinc-950 border border-zinc-900 rounded p-8 relative overflow-hidden animate-in fade-in">
                
                {/* Medical Overlay Background */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0)_2px,transparent_2px),linear-gradient(90deg,rgba(0,0,0,0)_2px,transparent_2px)] bg-[size:40px_40px] [mask-image:linear-gradient(to_bottom,transparent,black)] border-zinc-800/20 opacity-20 pointer-events-none"></div>

                <div className="flex flex-col md:flex-row h-full gap-8 relative z-10">
                    
                    {/* Left Column: Description */}
                    <div className="w-full md:w-1/3 space-y-6">
                        <div>
                             <h2 className="text-2xl font-display text-ordem-red uppercase tracking-widest text-glow-red">Diagnóstico Tático</h2>
                             <p className="font-mono text-zinc-500 text-xs mt-2">
                                 SISTEMA OBLÍQUO V1.0 - Monitoramento de integridade física segmentada.
                                 Danos excedentes ao limite de um membro causam lesões permanentes ou amputação.
                             </p>
                        </div>
                        
                        <div className="bg-zinc-900/50 p-4 rounded border border-zinc-800">
                            <h3 className="text-ordem-gold font-bold text-sm mb-2 uppercase flex items-center gap-2"><Icons.Activity /> Status Geral</h3>
                            <div className="space-y-2 font-mono text-xs">
                                <div className="flex justify-between">
                                    <span className="text-zinc-400">Batimentos:</span>
                                    <span className="text-green-500 animate-pulse">85 BPM</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-zinc-400">Pressão:</span>
                                    <span className="text-zinc-300">12/8</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-zinc-400">Adrenalina:</span>
                                    <span className="text-ordem-red">ELEVADA</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Interactive Body Map */}
                    <div className="flex-1 relative flex items-center justify-center border border-zinc-800 bg-black/50 rounded-lg">
                        {/* Body Silhouette SVG */}
                        <svg viewBox="0 0 200 400" className="h-[80%] text-zinc-800 fill-current drop-shadow-[0_0_10px_rgba(0,0,0,0.8)]">
                           <path d="M100,20 C115,20 125,35 125,50 C125,65 115,75 100,75 C85,75 75,65 75,50 C75,35 85,20 100,20 Z" className={agente.obliquo?.cabeca.dano! >= agente.obliquo?.cabeca.limite! ? "text-red-900 animate-pulse" : ""}/>
                           <path d="M80,80 L120,80 L130,180 L70,180 Z" className={agente.obliquo?.torco.dano! >= agente.obliquo?.torco.limite! ? "text-red-900 animate-pulse" : ""}/>
                           <path d="M135,80 L160,180 L150,190 L125,90 Z" className={agente.obliquo?.bracoDir.dano! >= agente.obliquo?.bracoDir.limite! ? "text-red-900 animate-pulse" : ""}/>
                           <path d="M65,80 L40,180 L50,190 L75,90 Z" className={agente.obliquo?.bracoEsq.dano! >= agente.obliquo?.bracoEsq.limite! ? "text-red-900 animate-pulse" : ""}/>
                           <path d="M80,185 L95,350 L75,360 L60,190 Z" className={agente.obliquo?.pernaEsq.dano! >= agente.obliquo?.pernaEsq.limite! ? "text-red-900 animate-pulse" : ""}/>
                           <path d="M120,185 L105,350 L125,360 L140,190 Z" className={agente.obliquo?.pernaDir.dano! >= agente.obliquo?.pernaDir.limite! ? "text-red-900 animate-pulse" : ""}/>
                        </svg>

                        {/* Interactive Widgets */}
                        {agente.obliquo && (
                            <>
                                <ObliquePart name="CABEÇA" partKey="cabeca" data={agente.obliquo.cabeca} x="10%" y="5%" />
                                <ObliquePart name="TRONCO" partKey="torco" data={agente.obliquo.torco} x="60%" y="20%" />
                                <ObliquePart name="BRAÇO ESQ." partKey="bracoEsq" data={agente.obliquo.bracoEsq} x="5%" y="30%" />
                                <ObliquePart name="BRAÇO DIR." partKey="bracoDir" data={agente.obliquo.bracoDir} x="70%" y="30%" />
                                <ObliquePart name="PERNA ESQ." partKey="pernaEsq" data={agente.obliquo.pernaEsq} x="10%" y="65%" />
                                <ObliquePart name="PERNA DIR." partKey="pernaDir" data={agente.obliquo.pernaDir} x="60%" y="65%" />
                            </>
                        )}

                        {/* Decorative Grid Lines */}
                        <div className="absolute top-10 left-10 w-20 h-[1px] bg-ordem-red/50"></div>
                        <div className="absolute top-10 left-10 w-[1px] h-20 bg-ordem-red/50"></div>
                        <div className="absolute bottom-10 right-10 w-20 h-[1px] bg-ordem-red/50"></div>
                        <div className="absolute bottom-10 right-10 w-[1px] h-20 bg-ordem-red/50"></div>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};
