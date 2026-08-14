// projetoCapaColors.js - Módulo Projetos da Escola (Sprint P2.2)

export const PROJECT_CAPA_FAMILIES = [
  {
    nome: 'Azuis',
    icone: '🔵',
    cores: [
      { id: 'azul', hex: '#2563EB', nome: 'Azul' },
      { id: 'azul-claro', hex: '#3B82F6', nome: 'Azul-claro' },
      { id: 'azul-marinho', hex: '#1E3A8A', nome: 'Azul-marinho' }
    ]
  },
  {
    nome: 'Verdes',
    icone: '🟢',
    cores: [
      { id: 'verde', hex: '#16A34A', nome: 'Verde' },
      { id: 'verde-agua', hex: '#0D9488', nome: 'Verde-água' },
      { id: 'esmeralda', hex: '#059669', nome: 'Esmeralda' }
    ]
  },
  {
    nome: 'Amarelos',
    icone: '🟡',
    cores: [
      { id: 'amarelo', hex: '#EAB308', nome: 'Amarelo' },
      { id: 'dourado', hex: '#D97706', nome: 'Dourado' },
      { id: 'mostarda', hex: '#CA8A04', nome: 'Mostarda' }
    ]
  },
  {
    nome: 'Laranjas',
    icone: '🟠',
    cores: [
      { id: 'laranja', hex: '#EA580C', nome: 'Laranja' },
      { id: 'coral', hex: '#F97316', nome: 'Coral' },
      { id: 'terracota', hex: '#C2410C', nome: 'Terracota' }
    ]
  },
  {
    nome: 'Vermelhos',
    icone: '🔴',
    cores: [
      { id: 'vermelho', hex: '#DC2626', nome: 'Vermelho' },
      { id: 'vinho', hex: '#881337', nome: 'Vinho' },
      { id: 'rosa', hex: '#EC4899', nome: 'Rosa' }
    ]
  },
  {
    nome: 'Roxos',
    icone: '🟣',
    cores: [
      { id: 'roxo', hex: '#8B5CF6', nome: 'Roxo' },
      { id: 'violeta', hex: '#6D28D9', nome: 'Violeta' },
      { id: 'lilas', hex: '#A855F7', nome: 'Lilás' }
    ]
  },
  {
    nome: 'Frios',
    icone: '🩵',
    cores: [
      { id: 'ciano', hex: '#06B6D4', nome: 'Ciano' },
      { id: 'turquesa', hex: '#14B8A6', nome: 'Turquesa' },
      { id: 'azul-petroleo', hex: '#0F766E', nome: 'Azul-petróleo' }
    ]
  },
  {
    nome: 'Neutros',
    icone: '🟤',
    cores: [
      { id: 'cinza', hex: '#64748B', nome: 'Cinza' },
      { id: 'grafite', hex: '#334155', nome: 'Grafite' },
      { id: 'marrom', hex: '#78350F', nome: 'Marrom' },
      { id: 'areia', hex: '#A16207', nome: 'Areia' }
    ]
  },
  {
    nome: 'Padrão / Neutra',
    icone: '⚪',
    cores: [
      { id: 'sem-cor', hex: '#1E293B', nome: 'Sem cor (Padrão)' }
    ]
  }
];

export const DEFAULT_CAPA_COLOR = '#2563EB';

export const VALID_CAPA_COLORS = PROJECT_CAPA_FAMILIES.flatMap(f => f.cores);
export const VALID_CAPA_HEX_SET = new Set(VALID_CAPA_COLORS.map(c => c.hex.toLowerCase()));

export function getProjectCapaColor(capaValue) {
  if (!capaValue) return DEFAULT_CAPA_COLOR;

  const val = String(capaValue).trim();
  
  // Se for código Hexadecimal direto (#RRGGBB)
  if (val.startsWith('#')) {
    const found = VALID_CAPA_COLORS.find(c => c.hex.toLowerCase() === val.toLowerCase());
    return found ? found.hex : DEFAULT_CAPA_COLOR;
  }

  // Se for ID (ex: "blue", "verde", "blue", "slate")
  const foundById = VALID_CAPA_COLORS.find(c => c.id.toLowerCase() === val.toLowerCase());
  if (foundById) return foundById.hex;

  // Mapeamento legado para cores básicas
  const englishMap = {
    blue: '#2563EB',
    green: '#16A34A',
    orange: '#EA580C',
    purple: '#8B5CF6',
    red: '#DC2626',
    teal: '#0D9488',
    yellow: '#EAB308',
    pink: '#EC4899',
    indigo: '#6D28D9',
    slate: '#334155'
  };

  if (englishMap[val.toLowerCase()]) {
    return englishMap[val.toLowerCase()];
  }

  return DEFAULT_CAPA_COLOR;
}
