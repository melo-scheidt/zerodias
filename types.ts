
export enum Elemento {
  NENHUM = 'Nenhum',
  SANGUE = 'Sangue',
  MORTE = 'Morte',
  CONHECIMENTO = 'Conhecimento',
  ENERGIA = 'Energia',
  MEDO = 'Medo'
}

export enum Classe {
  COMBATENTE = 'Combatente',
  ESPECIALISTA = 'Especialista',
  OCULTISTA = 'Ocultista'
}

export type UserRole = 'admin' | 'player';

export interface User {
  id: string;
  username: string;
  role: UserRole;
  password?: string; // Simulado
}

export interface Atributos {
  agi: number;
  for: number;
  int: number;
  pre: number;
  vig: number;
}

export interface Status {
  pvAtual: number;
  pvMax: number;
  sanAtual: number;
  sanMax: number;
  peAtual: number;
  peMax: number;
}

export interface Pericia {
  nome: string;
  treinamento: 'Destreinado' | 'Treinado' | 'Veterano' | 'Expert';
  bonus: number;
}

// Interfaces do Sistema Oblíquo
export interface VitalPart {
  dano: number;
  limite: number; // Quanto aguenta antes de inutilizar
  lesao: string; // Texto livre para descrever (ex: "Queimadura", "Quebrado")
}

export interface SistemaObliquo {
  cabeca: VitalPart;
  torco: VitalPart;
  bracoEsq: VitalPart;
  bracoDir: VitalPart;
  pernaEsq: VitalPart;
  pernaDir: VitalPart;
}

// Novo sistema de Resistências
export interface Resistencias {
  fisica: number;
  balistica: number;
  corte: number;
  impacto: number;
  perfuracao: number;
  eletricidade: number;
  fogo: number;
  frio: number;
  quimico: number;
  mental: number;
  sangue: number;
  morte: number;
  energia: number;
  conhecimento: number;
  medo: number;
}

// Novos campos para ficha completa (Kratos Style)
export interface Ataque {
  nome: string;
  teste: string;
  dano: string;
  critico: string;
  alcance: string;
  especial: string;
}

export interface Habilidade {
  nome: string;
  custo: string;
  pagina?: string;
  descricao: string;
}

export interface Agente {
  id: string; // Identificador único obrigatório
  ownerId?: string; // ID do usuário dono da ficha
  nome: string;
  origem: string;
  classe: Classe;
  trilha: string;
  nex: number;
  patente: string;
  
  atributos: Atributos;
  status: Status;
  pericias: Pericia[];
  
  // Novos Campos
  defesa: number;
  protecao: string; // Equipamentos de proteção
  deslocamento: string;
  
  ataques: Ataque[];
  habilidades: Habilidade[];

  inventario: string;
  detalhes: string;
  imagem?: string; // URL ou Base64 da imagem do personagem
  obliquo?: SistemaObliquo; // Opcional para manter compatibilidade com saves antigos
  resistencias?: Resistencias; // Novo campo
}

export interface Token {
  id: string;
  label: string;
  image?: string; // Imagem do token
  x: number;
  y: number;
  color: string;
  size: number;
}

export interface DiceResult {
  diceType: number;
  rolls: number[];
  final: number;
  timestamp: number;
  isAttributeRoll?: boolean;
}

export interface Jogador {
  id: string;
  nome: string;
  classe: Classe;
  isMestre: boolean;
  status: 'Online' | 'Offline';
}

export interface MapState {
  bgImage: string | null;
  tokens: Token[];
  timestamp: number; // Para forçar atualização
}

export interface Campanha {
  id: string; // Código de acesso (ex: OP-7X21)
  nome: string;
  descricao: string;
  mestre: string;
  jogadores: Jogador[];
  dataCriacao: number;
  mapState?: MapState; // Estado compartilhado da mesa tática
  campaignImage?: string; // Imagem de capa/lore da campanha (não afeta o mapa tático)
}

export interface LibraryDocument {
  id: string;
  title: string;
  url: string;
  type: 'link' | 'local'; // link = salvo no banco, local = blob temporário
  addedBy?: string;
}
