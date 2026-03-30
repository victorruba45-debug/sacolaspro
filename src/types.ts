export enum BagCategory {
  PAPER = 'Papel',
  PLASTIC = 'Plástico',
  FABRIC = 'Tecido'
}

export interface BagType {
  id: string;
  name: string;
  category: BagCategory;
  basePrice: number; // For 500 units
  materialAdditional: number;
  description?: string;
  purpose?: string;
}

export interface HandleType {
  id: string;
  name: string;
  price: number;
}

export interface BagPreset {
  id: string;
  name: string;
  width: number;
  height: number;
  side: number;
  category: BagCategory;
}

export interface MarketTemplate {
  id: string;
  title: string;
  description: string;
  config: QuoteConfig;
  imageHint: string;
  customImage?: string; // Keep for backward compatibility or as thumbnail
  customImages?: string[]; // Array of Base64 images
}

export interface QuoteConfig {
  bagTypeId: string;
  handleTypeId: string;
  quantity: number;
  width: number;
  height: number;
  side: number;
  colors: 'black' | '1' | '2' | '3' | '4' | 'pantone1' | 'pantone2';
  pantoneCode?: string;
  lamination: 'none' | 'gloss' | 'matte' | 'uv';
  hasEyelet: boolean;
  hasBottomReinforcement: boolean;
  hasMouthReinforcement: boolean;
  isExclusiveDieCut: boolean;
  printingSides: 'front' | 'both';
  bagColor?: string;
}

export interface CalculationResult {
  unitPrice: number;
  totalPrice: number;
  config: QuoteConfig;
  bagType: BagType;
  handleType: HandleType;
  costs: {
    material: number;
    printing: number;
    extras: number;
    dieCut: number;
  };
}

export interface Recommendation {
  label: string;
  price: number;
  diff: number;
  config: QuoteConfig;
}

export interface Client {
  id: string;
  name: string;
  company: string;
  document: string; // CPF ou CNPJ
  phone: string;
  email: string;
  notes: string;
  createdAt: string;
}

export interface BudgetItemSnapshot {
  material?: string;
  size?: string;
  finish?: string;
  printing?: string;
  config?: QuoteConfig;
  // Manual fields
  sizePreset?: string;
  sizeW?: string;
  sizeH?: string;
  sizeD?: string;
  handle?: string;
  finishing?: string;
  extras?: string;
  bagColor?: string;
  printColors?: string;
}

export interface BudgetItem {
  id: string;
  type: 'catalog' | 'manual';
  name: string;
  description: string;
  quantity: number;
  unitCost: number;
  unitPrice: number;
  subtotal: number;
  snapshot?: BudgetItemSnapshot;
}

export interface Budget {
  id: string;
  clientId?: string;
  origin: 'calculator' | 'template' | 'manual';
  status: 'draft' | 'sent' | 'approved' | 'lost';
  date: string;
  items: BudgetItem[];
  totalValue: number;
  totalCost: number;
  margin: number;
  updatedAt: string;
  deliveryTime?: string;
  notes?: string;
  image?: string;
}
