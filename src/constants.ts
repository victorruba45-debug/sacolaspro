import { BagType, BagCategory, BagPreset, MarketTemplate } from './types';

export const BAG_TYPES: BagType[] = [
  { 
    id: 'kraft', 
    name: 'Papel Kraft (Rústico)', 
    category: BagCategory.PAPER, 
    basePrice: 0, 
    materialAdditional: 0,
    description: 'Material com aparência natural e acabamento fosco, geralmente em tons de marrom.',
    purpose: 'Ideal para marcas com proposta sustentável, artesanal ou ecológica. Muito usado por cafeterias, lojas naturais, empórios e pequenos comércios.'
  },
  { 
    id: 'duplex', 
    name: 'Papel Duplex (Colorido)', 
    category: BagCategory.PAPER, 
    basePrice: 0, 
    materialAdditional: 0,
    description: 'Possui um lado branco (para impressão) e outro colorido (geralmente interno ou externo).',
    purpose: 'Muito utilizado para sacolas promocionais de baixo custo com boa apresentação visual. Indicado para lojas de varejo que precisam de volume com economia.'
  },
  { 
    id: 'triplex', 
    name: 'Papel Gloss / Branco (Premium)', 
    category: BagCategory.PAPER, 
    basePrice: 0, 
    materialAdditional: 0,
    description: 'Papel branco com acabamento liso ou brilhoso, excelente para impressão de alta qualidade.',
    purpose: 'Indicado para marcas que buscam sofisticação e destaque visual. Muito usado em lojas de moda, cosméticos, presentes e produtos premium.'
  },
  { 
    id: 'palhaco', 
    name: 'Boca de Palhaço (Vazada)', 
    category: BagCategory.PLASTIC, 
    basePrice: 0, 
    materialAdditional: 0,
    description: 'Sacola com abertura vazada na parte superior, sem alças aplicadas.',
    purpose: 'Econômica e prática, ideal para alto volume de vendas. Muito usada em farmácias, mercados e lojas populares.'
  },
  { 
    id: 'camiseta', 
    name: 'Alça Camiseta (Resistente)', 
    category: BagCategory.PLASTIC, 
    basePrice: 0, 
    materialAdditional: 0,
    description: 'Modelo clássico com alças integradas (formato de “camiseta”).',
    purpose: 'Alta resistência e ótimo custo-benefício. Indicado para supermercados, hortifrutis e lojas com produtos mais pesados.'
  },
  { 
    id: 'alca_fita', 
    name: 'Alça Fita (Boutique)', 
    category: BagCategory.PLASTIC, 
    basePrice: 0, 
    materialAdditional: 0,
    description: 'Sacola plástica com alça reforçada aplicada (tipo fita).',
    purpose: 'Passa uma imagem mais sofisticada. Muito usada em lojas de roupas, calçados e boutiques que querem agregar valor.'
  },
  { 
    id: 'ecologica', 
    name: 'Ecobag (Plástico Ecológico)', 
    category: BagCategory.PLASTIC, 
    basePrice: 0, 
    materialAdditional: 0,
    description: 'Produzida com plásticos recicláveis ou biodegradáveis.',
    purpose: 'Ideal para empresas com posicionamento sustentável. Usada em eventos, brindes e lojas que querem reforçar responsabilidade ambiental.'
  },
  { 
    id: 'tnt', 
    name: 'TNT (Termosselado / Costurado)', 
    category: BagCategory.FABRIC, 
    basePrice: 0, 
    materialAdditional: 0,
    description: 'Material leve, resistente e econômico, pode ser soldado ou costurado.',
    purpose: 'Muito utilizado em ações promocionais, eventos, feiras e brindes corporativos. Ótimo para reutilização com baixo custo.'
  },
  { 
    id: 'algodao', 
    name: 'Algodão Cru (Ecobag)', 
    category: BagCategory.FABRIC, 
    basePrice: 0, 
    materialAdditional: 0,
    description: 'Tecido natural, resistente e reutilizável, com aparência ecológica.',
    purpose: 'Perfeito para marcas premium e sustentáveis. Muito usado como brinde de valor agregado ou venda em lojas conscientes.'
  },
];

export const MATERIAL_COMPATIBILITY: Record<string, {
  colors: string[];
  printColors: string[];
  finishes: string[];
  extras: string[];
  printing: string[];
}> = {
  kraft: {
    colors: ['kraft', 'natural'],
    printColors: ['1', '2', '3', 'pantone1', 'pantone2'],
    finishes: ['matte'],
    extras: ['eyelet', 'bottom', 'mouth', 'diecut'],
    printing: ['front', 'both']
  },
  duplex: {
    colors: ['white', 'black'],
    printColors: ['1', '2', '3', 'pantone1', 'pantone2'],
    finishes: ['matte', 'gloss', 'uv'],
    extras: ['eyelet', 'bottom', 'mouth', 'diecut'],
    printing: ['front', 'both']
  },
  triplex: {
    colors: ['white', 'black'],
    printColors: ['1', '2', '3', 'pantone1', 'pantone2'],
    finishes: ['matte', 'gloss', 'uv'],
    extras: ['eyelet', 'bottom', 'mouth', 'diecut'],
    printing: ['front', 'both']
  },
  palhaco: {
    colors: ['white', 'black', 'kraft'],
    printColors: ['1', '2'],
    finishes: [],
    extras: ['bottom'],
    printing: ['front', 'both']
  },
  camiseta: {
    colors: ['white', 'black', 'kraft'],
    printColors: ['1', '2'],
    finishes: [],
    extras: ['bottom'],
    printing: ['front', 'both']
  },
  alca_fita: {
    colors: ['white', 'black', 'color'],
    printColors: ['1', '2', '3', 'pantone1', 'pantone2'],
    finishes: ['gloss', 'matte'],
    extras: ['bottom', 'eyelet'],
    printing: ['both']
  },
  ecologica: {
    colors: ['white', 'natural', 'green'],
    printColors: ['1', '2'],
    finishes: [],
    extras: [],
    printing: ['both']
  },
  tnt: {
    colors: ['white', 'black', 'color'],
    printColors: ['1', '2'],
    finishes: [],
    extras: [],
    printing: ['front', 'both']
  },
  algodao: {
    colors: ['natural', 'black', 'white'],
    printColors: ['1', '2', 'pantone1', 'pantone2'],
    finishes: [],
    extras: [],
    printing: ['front', 'both']
  }
};

export const MATERIAL_PRICING: Record<string, Record<number, number>> = {
  kraft: { 500: 0.45, 1000: 0.34, 2000: 0.30, 5000: 0.24 },
  duplex: { 500: 0.60, 1000: 0.48, 2000: 0.42, 5000: 0.36 },
  triplex: { 500: 0.70, 1000: 0.55, 2000: 0.50, 5000: 0.44 },
  palhaco: { 500: 0.38, 1000: 0.28, 2000: 0.24, 5000: 0.20 },
  camiseta: { 500: 0.42, 1000: 0.32, 2000: 0.28, 5000: 0.22 },
  alca_fita: { 500: 0.44, 1000: 0.34, 2000: 0.30, 5000: 0.24 },
  ecologica: { 500: 1.20, 1000: 1.00, 2000: 0.92, 5000: 0.85 },
  tnt: { 500: 0.40, 1000: 0.30, 2000: 0.26, 5000: 0.22 },
  algodao: { 500: 2.50, 1000: 2.10, 2000: 1.90, 5000: 1.70 },
};

export const PRINTING_BASE_PRICING: Record<number, number> = {
  500: 0.18,
  1000: 0.10,
  2000: 0.08,
  5000: 0.04,
};

export const EXTRA_PRICING: Record<string, Record<number, number>> = {
  eyelet: { 500: 0.06, 1000: 0.04, 2000: 0.03, 5000: 0.02 },
  bottom: { 500: 0.08, 1000: 0.06, 2000: 0.05, 5000: 0.04 },
  mouth: { 500: 0.07, 1000: 0.06, 2000: 0.05, 5000: 0.04 },
};

export const BAG_PRESETS: BagPreset[] = [
  { id: 'p', name: 'P (20x30x10)', width: 20, height: 30, side: 10, category: BagCategory.PAPER },
  { id: 'm', name: 'M (30x40x12)', width: 30, height: 40, side: 12, category: BagCategory.PAPER },
  { id: 'g', name: 'G (40x50x14)', width: 40, height: 50, side: 14, category: BagCategory.PAPER },
];

export const SIZE_MULTIPLIERS: Record<string, number> = {
  p: 0.8,
  m: 1.0,
  g: 1.3,
};

export const MARKET_TEMPLATES: MarketTemplate[] = [
  {
    id: 'supermarket',
    title: 'Supermercado Econômica',
    description: 'Alça camiseta resistente, ideal para varejo alimentar e padarias.',
    imageHint: 'camiseta',
    config: {
      bagTypeId: 'camiseta',
      handleTypeId: 'none',
      quantity: 5000,
      width: 30,
      height: 40,
      side: 10,
      colors: '1',
      lamination: 'none',
      hasEyelet: false,
      hasBottomReinforcement: false,
      hasMouthReinforcement: false,
      isExclusiveDieCut: false,
      printingSides: 'front',
    }
  },
  {
    id: 'boutique_luxury',
    title: 'Boutique de Luxo',
    description: 'Papel Triplex com fita de cetim e laminação fosca. O auge da sofisticação.',
    imageHint: 'triplex',
    config: {
      bagTypeId: 'triplex',
      handleTypeId: 'ribbon',
      quantity: 1000,
      width: 24,
      height: 31,
      side: 10,
      colors: '1',
      lamination: 'matte',
      hasEyelet: true,
      hasBottomReinforcement: true,
      hasMouthReinforcement: true,
      isExclusiveDieCut: false,
      printingSides: 'front',
    }
  },
];

export const QUANTITY_MULTIPLIERS: Record<number, number> = {
  500: 1.00,
  1000: 1.00,
  2000: 1.00,
  5000: 1.00,
};

export const COLOR_FACTORS: Record<string, number> = {
  black: 0.90, // -10%
  '1': 1.00,
  '2': 1.08,
  '3': 1.12,
  '4': 1.15,
  'pantone1': 1.25, // +25%
  'pantone2': 1.35, // +35%
};

export const TOOLTIPS: Record<string, string> = {
  kraft: "Material rústico, ecológico e resistente. Muito usado por lojas naturais, cafeterias e marcas que querem transmitir sustentabilidade.",
  duplex: "Tem frente branca e verso pardo. Ótimo custo-benefício para sacolas personalizadas com boa impressão.",
  triplex: "Material premium, branco dos dois lados, ideal para marcas sofisticadas como óticas, joalherias, cosméticos e presentes.",
  palhaco: "Modelo com furo vazado para segurar, mais elegante do que a camiseta. Usado em roupas, perfumarias e lojas de médio padrão.",
  camiseta: "Modelo mais barato e resistente, ideal para grande volume. Muito usado em supermercados e lojas populares.",
  ecologica: "Material reforçado que pode ser reutilizado diversas vezes. Melhora a percepção ambiental da marca.",
  tnt: "Material de tecido não tecido, econômico e resistente. Ideal para brindes e eventos.",
  algodao: "Material premium e sustentável. O auge da ecologia com alta durabilidade e valor percebido.",
  alca_fita: "Modelo sofisticado em plástico, com alça de fita soldada. Muito usada em boutiques de moda.",
  paper_handle: "Boa resistência e aparência artesanal. Muito usada em lojas de roupas e boutiques.",
  nylon_handle: "Alça elegante, resistente, ideal para sacolas premium.",
  cotton_handle: "Textura mais natural. Excelente para marcas sustentáveis.",
  gorgurao_handle: "Toque sofisticado, usada em sacolas de presentes e produtos de alto valor.",
  ribbon_handle: "Acabamento delicado e luxuoso, perfeito para cosméticos e joias.",
  gloss_finish: "Dá brilho e vivacidade às cores. Ideal para produtos modernos.",
  matte_finish: "Acabamento elegante e sóbrio, toque de fosco premium.",
  uv_finish: "Realça detalhes específicos da arte com brilho intenso. Aumenta o valor percebido.",
  print_1: "Mais econômico e rápido de produzir. Ótimo para logos simples.",
  print_4: "Permite artes coloridas, fotos e gradientes.",
  print_pantone: "Cor especial ultra precisa, ideal quando a marca exige cor institucional exata.",
  print_both: "Impressão dos dois lados da sacola. Aumenta o impacto visual.",
  extra_eyelet: "Pequeno anel metálico reforçado que aumenta a resistência do furo do cordão. Muito usado em sacolas premium.",
  extra_bottom: "Base reforçada de papelão interno que aumenta a capacidade de peso.",
  extra_mouth: "Faixa interna que evita rasgos na abertura da sacola.",
  extra_diecut: "Define o formato de corte da sacola. A faca exclusiva permite modelos únicos.",
};

export const LAMINATION_FACTORS: Record<string, number> = {
  none: 1.00,
  gloss: 1.06,
  matte: 1.08,
  uv: 1.12,
};

export const HANDLE_TYPES: { id: string; name: string; price: number }[] = [
  { id: 'none', name: 'Sem Alça / Vazada', price: 0 },
  { id: 'paper', name: 'Papel Retorcido', price: 0.25 },
  { id: 'nylon', name: 'Cordão de Nylon', price: 0.30 },
  { id: 'cotton', name: 'Cordão de Algodão', price: 0.45 },
  { id: 'gorgurao', name: 'Gorgurão', price: 0.55 },
  { id: 'ribbon', name: 'Fita de Cetim', price: 0.60 },
  { id: 'tnt_handle', name: 'Alça de TNT', price: 0.20 },
  { id: 'algodao_handle', name: 'Alça de Algodão (Costurada)', price: 0.80 },
  { id: 'fita_soldada', name: 'Fita Plástica Soldada', price: 0.35 },
];

export const PROFIT_MARGIN = 1.30; // 30%
