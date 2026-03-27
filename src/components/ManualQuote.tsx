import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus, Trash2, Copy, Check, FileText, ChevronDown, ChevronUp,
  Package, TrendingUp, AlertCircle, ClipboardList, Building2, Hash, X,
  Calculator, User, Save, DollarSign, UserPlus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { jsPDF } from 'jspdf';
import { Budget, BudgetItem, Client, QuoteConfig, BudgetItemSnapshot } from '../types';
import { storage } from '../lib/storage';

// ─── Types & Props ───────────────────────────────────────────────────────────

export interface ManualQuoteProps {
  catalogProducts?: string[];
  activeBudget: Budget | null;
  onSave?: (budget: Budget) => void;
  onDelete?: (id: string) => void;
  onAddCatalogItem?: () => void;
}

// ─── Predefined options ───────────────────────────────────────────────────────

const SIZE_PRESETS: Record<string, { w: string; h: string; d: string }> = {
  PP: { w: '15', h: '20', d: '5'  },
  P:  { w: '20', h: '30', d: '8'  },
  M:  { w: '25', h: '35', d: '10' },
  G:  { w: '30', h: '40', d: '10' },
  GG: { w: '35', h: '50', d: '12' },
};

const OPTIONAL_FIELDS = [
  { key: 'handle',        label: 'Alça',              placeholder: 'Ex: Fita Plástica', listId: 'list-handle' },
  { key: 'printing',      label: 'Impressão',         placeholder: 'Ex: Apenas Frente', listId: 'list-printing' },
  { key: 'finishing',     label: 'Acabamento',        placeholder: 'Ex: Laminação Brilho', listId: 'list-finishing' },
  { key: 'extras',        label: 'Extras',            placeholder: 'Ex: Ilhós, Reforço...', listId: 'list-extras' },
] as const;

type OptionalKey = typeof OPTIONAL_FIELDS[number]['key'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatCurrency = (v: number) =>
  v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const buildSizeLabel = (item: BudgetItem): string => {
  if (item.type === 'catalog') return item.snapshot?.size || '';
  const snap = item.snapshot;
  if (!snap) return '';
  const dims = [snap.sizeW, snap.sizeH, snap.sizeD].filter(Boolean).join('x');
  const suffix = dims ? ` (${dims} cm)` : '';
  return snap.sizePreset && snap.sizePreset !== 'custom'
    ? `${snap.sizePreset}${suffix}`
    : dims ? `${dims} cm` : '';
};

const DEFAULT_ITEM = (): BudgetItem => ({
  id: crypto.randomUUID(),
  type: 'manual',
  name: '',
  description: '',
  quantity: 1,
  unitCost: 0,
  unitPrice: 0,
  subtotal: 0,
  snapshot: {
    sizePreset: '',
    sizeW: '',
    sizeH: '',
    sizeD: '',
    handle: '',
    printing: '',
    finishing: '',
    extras: '',
  }
});

// ─── Datalists ────────────────────────────────────────────────────────────────

const DataLists: React.FC = () => (
  <>
    <datalist id="list-handle">
      <option value="Fita Plástica Soldada" />
      <option value="Cordão de Nylon" />
      <option value="Cordão de Algodão" />
      <option value="Cordão de Gorgurão" />
      <option value="Alça de Papel" />
      <option value="Alça de TNT Costurada" />
      <option value="Alça de Algodão Costurada" />
      <option value="Sem Alça" />
    </datalist>
    <datalist id="list-printing">
      <option value="Apenas Frente" />
      <option value="Frente e Verso" />
      <option value="Sem Impressão" />
      <option value="Serigrafia 1 Cor" />
      <option value="Serigrafia 2 Cores" />
      <option value="Digital Policromia" />
    </datalist>
    <datalist id="list-finishing">
      <option value="Nenhum" />
      <option value="Laminação Brilho" />
      <option value="Laminação Fosca" />
      <option value="UV Localizado" />
      <option value="Hot Stamping" />
    </datalist>
    <datalist id="list-extras">
      <option value="Ilhós" />
      <option value="Reforço de Fundo" />
      <option value="Reforço de Boca" />
      <option value="Faca Exclusiva" />
      <option value="Ilhós + Reforço de Fundo" />
    </datalist>
  </>
);

// ─── Item Card ────────────────────────────────────────────────────────────────

interface ItemCardProps {
  item: BudgetItem;
  index: number;
  catalogProducts: string[];
  onChange: (id: string, patch: Partial<BudgetItem>) => void;
  onRemove: (id: string) => void;
  canRemove: boolean;
}

const ItemCard: React.FC<ItemCardProps> = ({
  item, index, catalogProducts, onChange, onRemove, canRemove
}) => {
  const [expanded, setExpanded] = useState(true);
  
  const totalCost = item.unitCost * item.quantity;
  const totalSale = item.unitPrice * item.quantity;
  const marginPct  = item.unitPrice > 0
    ? ((item.unitPrice - item.unitCost) / item.unitPrice) * 100
    : 0;
  const profit = totalSale - totalCost;

  const marginColor =
    marginPct >= 40 ? 'text-emerald-600' :
    marginPct >= 20 ? 'text-amber-500'   :
    'text-rose-500';

  const updateSnapshot = (patch: Partial<BudgetItemSnapshot>) => {
    onChange(item.id, { snapshot: { ...item.snapshot, ...patch } });
  };

  const sizeLabel = buildSizeLabel(item);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      className="bg-white rounded-[2rem] border border-slate-200/80 overflow-hidden shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 group"
    >
      <div className="flex items-center justify-between px-4 md:px-6 py-4 bg-slate-50/80 border-b border-slate-100/80">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-black text-sm shadow-inner shrink-0 group-hover:scale-105 transition-transform">
            {index + 1}
          </div>
          <div>
            <span className="font-bold text-slate-900 text-[15px] truncate max-w-[200px] block leading-tight">
              {item.name || item.description || 'Novo Item'}
            </span>
            <div className="flex items-center gap-2 mt-1">
              {sizeLabel && (
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border border-slate-200 bg-white px-2 py-0.5 rounded-md">
                  {sizeLabel}
                </span>
              )}
              {item.type === 'catalog' && (
                <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-100 text-emerald-600 text-[9px] font-black rounded-md uppercase tracking-widest">
                  Catálogo
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {item.unitPrice > 0 && (
            <div className="text-right hidden sm:block mr-2">
              <span className="text-lg font-black text-slate-900 leading-none block">
                R$ {formatCurrency(totalSale)}
              </span>
              <span className={`text-[10px] font-black uppercase tracking-widest ${marginColor}`}>
                {marginPct.toFixed(1)}% margem
              </span>
            </div>
          )}
          <button
            onClick={() => setExpanded(p => !p)}
            className="p-2.5 bg-white border border-slate-200 shadow-sm hover:bg-slate-50 hover:border-slate-300 rounded-xl text-slate-400 transition-all"
          >
            {expanded ? <ChevronUp size={16} strokeWidth={2.5}/> : <ChevronDown size={16} strokeWidth={2.5}/>}
          </button>
          {canRemove && (
            <button
              onClick={() => onRemove(item.id)}
              className="p-2.5 bg-white border border-slate-200 shadow-sm hover:bg-rose-50 hover:border-rose-200 hover:text-rose-500 rounded-xl text-slate-400 transition-all"
            >
              <Trash2 size={16} strokeWidth={2.5}/>
            </button>
          )}
        </div>
      </div>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 md:p-8 space-y-5 md:space-y-6">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-1">
                  Nome / Descrição do Produto *
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Ex: Sacola Kraft Personalizada..."
                    value={item.name || item.description}
                    onChange={e => onChange(item.id, { name: e.target.value, description: e.target.value })}
                    className="w-full px-4 py-3.5 bg-slate-50/50 border border-slate-200 rounded-2xl focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 outline-none text-[15px] font-medium transition-all"
                  />
                  {catalogProducts.length > 0 && item.type === 'manual' && (
                    <select
                      value=""
                      onChange={e => { if (e.target.value) onChange(item.id, { name: e.target.value, description: e.target.value }); }}
                      className="w-full px-4 py-3.5 bg-slate-50/50 border border-slate-200 rounded-2xl focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 outline-none text-[15px] font-medium transition-all text-slate-500 cursor-pointer"
                    >
                      <option value="">Ou escolher do catálogo...</option>
                      {catalogProducts.map(p => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {item.type === 'manual' && (
                <div className="bg-slate-50/50 border border-slate-100 rounded-3xl p-4 md:p-6 space-y-5 md:space-y-6">
                  <div className="space-y-3">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-1">Tamanho da Embalagem</label>
                    <div className="flex flex-wrap gap-2">
                      {Object.keys(SIZE_PRESETS).map(p => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => updateSnapshot({
                            sizePreset: item.snapshot?.sizePreset === p ? '' : p,
                            sizeW: item.snapshot?.sizePreset === p ? '' : SIZE_PRESETS[p].w,
                            sizeH: item.snapshot?.sizePreset === p ? '' : SIZE_PRESETS[p].h,
                            sizeD: item.snapshot?.sizePreset === p ? '' : SIZE_PRESETS[p].d,
                          })}
                          className={`px-4 py-2 rounded-xl border text-sm font-semibold transition-all ${
                            item.snapshot?.sizePreset === p
                              ? 'bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-500/20'
                              : 'bg-white border-slate-200/80 text-slate-500 hover:border-slate-300 hover:text-slate-800 shadow-sm'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                    <div className="grid grid-cols-3 gap-3 pt-2">
                      {['sizeW', 'sizeH', 'sizeD'].map((f, i) => (
                        <div key={f}>
                          <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5 pl-1">
                            {['L', 'A', 'P'][i]} (cm)
                          </span>
                          <input
                            type="number"
                            value={(item.snapshot as any)?.[f] || ''}
                            onChange={e => updateSnapshot({ [f]: e.target.value, sizePreset: 'custom' })}
                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-emerald-300 focus:ring-4 focus:ring-emerald-500/10 outline-none text-[15px] font-bold transition-all"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4 border-t border-slate-200/60">
                    {OPTIONAL_FIELDS.map(f => (
                      <div key={f.key} className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">{f.label}</label>
                        <input
                          type="text"
                          list={f.listId}
                          value={(item.snapshot as any)?.[f.key] || ''}
                          onChange={e => updateSnapshot({ [f.key]: e.target.value })}
                          className="w-full px-4 py-3.5 bg-white border border-slate-200 rounded-2xl focus:border-emerald-300 focus:ring-4 focus:ring-emerald-500/10 outline-none text-[15px] font-medium transition-all"
                          placeholder={f.placeholder}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 pt-6 border-t border-slate-100">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-emerald-600 uppercase tracking-widest pl-1">QTD</label>
                  <input
                    type="number"
                    min={0}
                    value={item.quantity === 0 ? '' : item.quantity}
                    onChange={e => {
                      const val = e.target.value;
                      onChange(item.id, { quantity: val === '' ? 0 : Math.max(0, Number(val)) });
                    }}
                    className="w-full px-4 py-3.5 bg-emerald-50/30 border border-emerald-200 rounded-2xl focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 outline-none text-base font-black transition-all text-emerald-900"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-1">Custo Unit. (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    value={item.unitCost === 0 ? '' : item.unitCost}
                    onChange={e => onChange(item.id, { unitCost: Number(e.target.value) })}
                    className="w-full px-4 py-3.5 bg-white border border-slate-200 rounded-2xl focus:border-emerald-300 focus:ring-4 focus:ring-emerald-500/10 outline-none text-base font-bold transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-emerald-600 uppercase tracking-widest pl-1">Venda Unit. (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    value={item.unitPrice === 0 ? '' : item.unitPrice}
                    onChange={e => onChange(item.id, { unitPrice: Number(e.target.value) })}
                    className="w-full px-4 py-3.5 bg-emerald-50/50 border border-emerald-300 rounded-2xl focus:border-emerald-400 focus:bg-emerald-50 focus:ring-4 focus:ring-emerald-500/20 outline-none text-base font-black transition-all text-emerald-800"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export const ManualQuote: React.FC<ManualQuoteProps> = ({ 
  catalogProducts = [], 
  activeBudget, 
  onSave,
  onDelete,
  onAddCatalogItem 
}) => {
  const [budget, setBudget] = useState<Budget>(() => activeBudget || {
    id: crypto.randomUUID(),
    clientId: '',
    status: 'draft',
    date: new Date().toISOString(),
    items: [DEFAULT_ITEM()],
    totalValue: 0,
    totalCost: 0,
    margin: 0,
    updatedAt: new Date().toISOString(),
    deliveryTime: '',
    notes: ''
  });

  const [clients, setClients] = useState<Client[]>([]);
  const [copied, setCopied] = useState(false);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [newClientData, setNewClientData] = useState({
    name: '',
    company: '',
    phone: '',
    email: '',
    notes: ''
  });

  useEffect(() => {
    setClients(storage.getClients());
  }, []);

  useEffect(() => {
    if (activeBudget) setBudget(activeBudget);
  }, [activeBudget]);

  useEffect(() => {
    const totalCost = budget.items.reduce((s, i) => s + (i.unitCost * i.quantity), 0);
    const totalValue = budget.items.reduce((s, i) => s + (i.unitPrice * i.quantity), 0);
    const totalProfit = totalValue - totalCost;
    const margin = totalValue > 0 ? (totalProfit / totalValue) * 100 : 0;

    setBudget(prev => ({
      ...prev,
      totalCost,
      totalValue,
      margin
    }));
  }, [budget.items]);

  const updateItem = (id: string, patch: Partial<BudgetItem>) =>
    setBudget(prev => ({
      ...prev,
      items: prev.items.map(i => {
        if (i.id === id) {
          const updated = { ...i, ...patch };
          updated.subtotal = updated.unitPrice * updated.quantity;
          return updated;
        }
        return i;
      })
    }));

  const removeItem = (id: string) =>
    setBudget(prev => {
      const newItems = prev.items.filter(i => i.id !== id);
      return {
        ...prev,
        items: newItems.length > 0 ? newItems : [DEFAULT_ITEM()]
      };
    });

  const addItem = () => setBudget(prev => ({
    ...prev,
    items: [...prev.items, DEFAULT_ITEM()]
  }));

  const getClientName = (clientId?: string) => {
    if (!clientId) return 'Cliente não vinculado';
    return clients.find(c => c.id === clientId)?.name || 'Cliente não encontrado';
  };

  const formatDeliveryTime = (val?: string) => {
    if (!val || val.trim() === '') return 'A combinar';
    if (!isNaN(Number(val))) return `${val} dias úteis`;
    return val;
  };

  const handleCopy = () => {
    const clientName = getClientName(budget.clientId);
    const prazo = formatDeliveryTime(budget.deliveryTime);
    
    let text = `📄 *ORÇAMENTO | SacolaPro*\n`;
    text += `ID: #${budget.id.split('-')[0].toUpperCase()}\n`;
    if (clientName !== 'Cliente não vinculado') {
       text += `Cliente: *${clientName}*\n`;
    }
    text += `Data: ${new Date(budget.date).toLocaleDateString('pt-BR')}\n\n`;
    text += `📦 *ITENS DO PEDIDO:*\n`;
    
    budget.items.forEach((item, i) => {
      text += `\n*${i+1}. ${item.name || item.description || 'Produto'}*\n`;
      const snap = item.snapshot;
      if (snap) {
         if (snap.sizePreset || snap.sizeW) text += `  ▫️ Dimensões: ${buildSizeLabel(item)}\n`;
         if (snap.handle) text += `  ▫️ Alça: ${snap.handle}\n`;
         if (snap.printing) text += `  ▫️ Impressão: ${snap.printing}\n`;
         if (snap.finishing) text += `  ▫️ Acabamento: ${snap.finishing}\n`;
         if (snap.extras) text += `  ▫️ Extras: ${snap.extras}\n`;
      }
      text += `  ▶ Quantidade: ${item.quantity} un\n`;
      text += `  ▶ Valor Unitário: R$ ${formatCurrency(item.unitPrice)}\n`;
      text += `  ▶ Subtotal: R$ ${formatCurrency(item.quantity * item.unitPrice)}\n`;
    });
    
    text += `\n━━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `💰 *VALOR TOTAL: R$ ${formatCurrency(budget.totalValue)}*\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    text += `🚚 Prazo de Entrega: *${prazo}*\n`;
    if (budget.notes?.trim()) {
      text += `📌 Observações: ${budget.notes.trim()}\n`;
    }
    text += `⏳ Validade deste orçamento: 5 dias.\n`;
    text += `Qualquer dúvida, estamos à disposição!\n`;
    
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    const clientName = getClientName(budget.clientId);
    const dateFormatted = new Date(budget.date).toLocaleDateString('pt-BR');
    
    // Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text("ORÇAMENTO", 20, 30);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text(`ID: #${budget.id.split('-')[0].toUpperCase()}`, 20, 38);
    doc.text(`Data: ${dateFormatted}`, 20, 44);
    if (clientName !== 'Cliente não vinculado') {
       doc.text(`Cliente: ${clientName}`, 20, 50);
    }
    
    // Draw line
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.setLineWidth(0.5);
    doc.line(20, 58, 190, 58);
    
    // Items
    let yPos = 70;
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text("Itens do Pedido", 20, yPos);
    
    yPos += 15;
    budget.items.forEach((item, i) => {
      // Check page break
      if (yPos > 260) {
        doc.addPage();
        yPos = 30;
      }
      
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 41, 59); // slate-800
      doc.text(`${i+1}. ${item.name || item.description || 'Produto'}`, 20, yPos);
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 116, 139);
      
      let detailY = yPos + 6;
      const snap = item.snapshot;
      if (snap) {
         if (snap.sizePreset || snap.sizeW) { doc.text(`Dimensões: ${buildSizeLabel(item)}`, 25, detailY); detailY += 5; }
         if (snap.handle) { doc.text(`Alça: ${snap.handle}`, 25, detailY); detailY += 5; }
         if (snap.printing) { doc.text(`Impressão: ${snap.printing}`, 25, detailY); detailY += 5; }
         if (snap.finishing) { doc.text(`Acabamento: ${snap.finishing}`, 25, detailY); detailY += 5; }
         if (snap.extras) { doc.text(`Extras: ${snap.extras}`, 25, detailY); detailY += 5; }
      }
      
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      const qt = `Qtd: ${item.quantity} un`;
      const un = `V. Unit: R$ ${formatCurrency(item.unitPrice)}`;
      const sub = `Subtotal: R$ ${formatCurrency(item.quantity * item.unitPrice)}`;
      
      doc.text(qt, 25, detailY + 2);
      doc.text(un, 70, detailY + 2);
      doc.text(sub, 120, detailY + 2);
      
      yPos = detailY + 15;
      
      // Draw item separator line
      doc.setDrawColor(241, 245, 249); // slate-100
      doc.line(20, yPos - 5, 190, yPos - 5);
    });
    
    // Total section layout
    if (yPos > 240) {
      doc.addPage();
      yPos = 30;
    }
    
    yPos += 10;
    // Commercial Details (Prazo & Obs) above Total Box
    const prazo = formatDeliveryTime(budget.deliveryTime);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text(`Prazo de Entrega:`, 20, yPos);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text(prazo, 55, yPos);
    
    if (budget.notes?.trim()) {
      yPos += 6;
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text(`Observações:`, 20, yPos);
      
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 116, 139);
      const splitNotes = doc.splitTextToSize(budget.notes.trim(), 135);
      doc.text(splitNotes, 50, yPos);
      yPos += ((splitNotes.length - 1) * 5); // Adjust for multip-line obs
    }
    
    yPos += 10;
    doc.setFillColor(248, 250, 252); // slate-50
    doc.rect(20, yPos, 170, 25, 'F');
    
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text("VALOR TOTAL:", 25, yPos + 16);
    
    doc.setFontSize(16);
    doc.setTextColor(5, 150, 105); // emerald-600
    doc.text(`R$ ${formatCurrency(budget.totalValue)}`, 120, yPos + 16);
    
    // Footer message
    yPos += 45;
    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text("Validade deste orçamento: 5 dias. Qualquer dúvida, estamos à disposição!", 20, yPos);
    
    doc.save(`orcamento-${budget.id.split('-')[0].toUpperCase()}.pdf`);
  };

  return (
    <>
    <div className="max-w-[85rem] mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 pb-24">
      <DataLists />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        <div className="lg:col-span-8 space-y-8">
          
          <div className="flex flex-col gap-1">
             <h2 className="text-3xl font-black text-slate-900 tracking-tight">Editor de Orçamento</h2>
             <p className="text-[15px] font-medium text-slate-500">Preencha os dados e adicione os itens para gerar o orçamento.</p>
          </div>

          <section className="bg-white rounded-[2.5rem] border border-slate-200 p-5 md:p-8 space-y-5 md:space-y-6 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-slate-500/5 rounded-full blur-3xl -mr-10 -mt-10 transition-all group-hover:bg-slate-500/10 pointer-events-none"></div>
            <div className="flex items-center gap-4 pb-2 border-b border-slate-100">
              <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500 border border-slate-200 shadow-inner">
                 <User size={18} strokeWidth={2.5} />
              </div>
              <h2 className="font-bold text-slate-900 text-lg">Informações Gerais</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
              <div className="space-y-1.5 flex flex-col">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-1">Selecionar Cliente</label>
                <div className="flex gap-2">
                  <select 
                    value={budget.clientId || ''}
                    onChange={e => setBudget({ ...budget, clientId: e.target.value })}
                    className="flex-1 px-4 py-3.5 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-white text-[15px] font-semibold text-slate-700 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all cursor-pointer"
                  >
                    <option value="">Nenhum cliente selecionado</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name} ({c.company})</option>)}
                  </select>
                  <button 
                    onClick={() => setIsClientModalOpen(true)}
                    className="p-3.5 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-2xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                    title="Novo Cliente"
                  >
                    <Plus size={20} strokeWidth={2.5} />
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-1">Status Comercial</label>
                <select 
                  value={budget.status}
                  onChange={e => setBudget({ ...budget, status: e.target.value as any })}
                  className="w-full px-4 py-3.5 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-white text-[15px] font-semibold text-slate-700 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all cursor-pointer"
                >
                  <option value="draft">Rascunho</option>
                  <option value="sent">Enviado</option>
                  <option value="approved">Aprovado</option>
                  <option value="lost">Perdido</option>
                </select>
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-1">Prazo de Entrega (em dias úteis)</label>
                <input 
                  type="text"
                  placeholder="Ex: 5 ou deixe vazio para 'A combinar'"
                  value={budget.deliveryTime || ''}
                  onChange={e => setBudget({ ...budget, deliveryTime: e.target.value })}
                  className="w-full px-4 py-3.5 bg-slate-50/50 border border-slate-200/80 rounded-2xl focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 outline-none text-[15px] font-medium transition-all"
                />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-1">Observações do Pedido</label>
                <textarea 
                  placeholder="Alguma observação, desconto ou informação adicional..."
                  rows={2}
                  value={budget.notes || ''}
                  onChange={e => setBudget({ ...budget, notes: e.target.value })}
                  className="w-full px-4 py-3.5 bg-slate-50/50 border border-slate-200/80 rounded-2xl focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 outline-none text-[15px] font-medium transition-all resize-none"
                />
              </div>
            </div>
          </section>

          <div className="space-y-6">
            <div className="flex items-center justify-between pl-2">
              <h3 className="font-black text-slate-800 text-lg flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-100/50 text-emerald-600 flex items-center justify-center">
                   <Package size={16} strokeWidth={2.5} />
                </div>
                Itens Adicionados ({budget.items.length})
              </h3>
            </div>
            
            <div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {budget.items.map((item, idx) => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    index={idx}
                    catalogProducts={catalogProducts}
                    onChange={updateItem}
                    onRemove={removeItem}
                    canRemove={true}
                  />
                ))}
              </AnimatePresence>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
              <button
                onClick={addItem}
                className="py-5 rounded-[2rem] border-2 border-dashed border-slate-200 bg-slate-50/50 hover:border-emerald-300 hover:bg-emerald-50 hover:shadow-lg hover:shadow-emerald-500/10 text-slate-500 hover:text-emerald-700 transition-all font-bold text-sm flex items-center justify-center gap-2 group"
              >
                <Plus size={18} strokeWidth={2.5} className="group-hover:scale-110 transition-transform" /> Adicionar Item Manual
              </button>
              <button
                onClick={onAddCatalogItem}
                className="py-5 rounded-[2rem] border-2 border-dashed border-emerald-200 bg-emerald-50/50 hover:border-emerald-400 hover:bg-emerald-100 hover:shadow-lg hover:shadow-emerald-500/20 text-emerald-700 transition-all font-bold text-sm flex items-center justify-center gap-2 group"
              >
                <Calculator size={18} strokeWidth={2.5} className="group-hover:scale-110 transition-transform" /> Buscar na Calculadora
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4">
          <section className="bg-slate-900 rounded-[2.5rem] p-8 text-white md:sticky md:top-24 border border-white/10 space-y-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-[3rem] -mr-10 -mt-10 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-[3rem] -ml-10 -mb-10 pointer-events-none"></div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                 <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-emerald-400">
                    <DollarSign size={20} strokeWidth={2.5} />
                 </div>
                 <h3 className="text-white/70 font-bold uppercase tracking-widest text-[11px]">Resumo Financeiro</h3>
              </div>
              
              <div className="flex flex-col gap-1">
                <span className="text-slate-400 text-sm font-medium">Valor Total</span>
                <span className="text-4xl lg:text-5xl font-black tracking-tight text-white drop-shadow-md">R$ {formatCurrency(budget.totalValue)}</span>
              </div>
              
              <div className="flex items-center gap-4 mt-6 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                 <div className="w-2 h-10 rounded-full bg-slate-700 overflow-hidden relative">
                    <div className={`absolute bottom-0 w-full rounded-full transition-all duration-1000 ${budget.margin >= 20 ? 'bg-emerald-400' : 'bg-rose-400'}`} style={{ height: `${Math.min(100, Math.max(0, budget.margin))}%`}}></div>
                 </div>
                 <div>
                    <p className={`text-[15px] font-black ${budget.margin >= 20 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {budget.margin.toFixed(1)}% de Margem
                    </p>
                    <p className="text-xs text-white/50 font-medium">Custo total: R$ {formatCurrency(budget.totalCost)}</p>
                 </div>
              </div>
            </div>

            <div className="h-px bg-white/10 relative z-10" />

            <div className="space-y-3 relative z-10">
              <div className="flex flex-col gap-3 mb-5">
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={handleCopy} className="py-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-bold text-xs flex flex-col items-center justify-center gap-2 transition-all border border-white/10 hover:border-white/20">
                    {copied ? <Check size={18} strokeWidth={2.5} className="text-emerald-400" /> : <Copy size={18} strokeWidth={2.5} className="text-slate-300" />} {copied ? 'Copiado' : 'Copiar Texto'}
                  </button>
                  <button onClick={generatePDF} className="py-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-bold text-xs flex flex-col items-center justify-center gap-2 transition-all border border-white/10 hover:border-white/20">
                    <FileText size={18} strokeWidth={2.5} className="text-slate-300" /> Gerar PDF
                  </button>
                </div>
                
                {onDelete && (
                  <button 
                    onClick={() => {
                      if (confirm('Tem certeza que deseja excluir este orçamento permanentemente?')) {
                        onDelete(budget.id);
                      }
                    }} 
                    className="w-full py-4 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all border border-rose-500/20"
                  >
                    <Trash2 size={16} strokeWidth={2.5} /> Excluir Orçamento
                  </button>
                )}
              </div>
              <button 
                onClick={() => onSave?.(budget)} 
                className="w-full py-5 bg-emerald-500 hover:bg-emerald-400 text-slate-900 rounded-[1.5rem] font-black text-[15px] uppercase tracking-widest shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all duration-300 hover:shadow-emerald-400/30 hover:-translate-y-1"
              >
                <Save size={20} strokeWidth={3} /> Salvar Orçamento
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
    
    {/* New Client Modal */}
    <AnimatePresence>
      {isClientModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsClientModalOpen(false)}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-xl bg-white rounded-[2.5rem] shadow-2xl border border-white/20 overflow-hidden flex flex-col max-h-[90vh]"
            onClick={e => e.stopPropagation()}
          >
            <div className="px-8 py-6 border-b border-slate-100 bg-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-50 border border-emerald-100/50 text-emerald-600 rounded-2xl flex items-center justify-center shadow-inner">
                  <UserPlus size={22} strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 tracking-tight text-xl">Novo Cliente</h3>
                  <p className="text-[12px] text-slate-500 font-medium">Cadastre rapidamente para vincular ao orçamento</p>
                </div>
              </div>
              <button onClick={() => setIsClientModalOpen(false)} className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-400 border border-slate-100 hover:text-slate-700 transition-all">
                <X size={18} strokeWidth={2.5}/>
              </button>
            </div>

            <div className="overflow-y-auto p-8 custom-scrollbar">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="md:col-span-2 space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-1">Nome Completo *</label>
                    <input 
                      required
                      type="text" 
                      value={newClientData.name}
                      onChange={e => setNewClientData({ ...newClientData, name: e.target.value })}
                      className="w-full px-4 py-3.5 bg-slate-50/50 border border-slate-200 rounded-2xl focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 outline-none text-[15px] font-medium transition-all"
                      placeholder="Ex: João Silva"
                    />
                  </div>
                  <div className="md:col-span-2 space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-1">Empresa</label>
                    <input 
                      type="text" 
                      value={newClientData.company}
                      onChange={e => setNewClientData({ ...newClientData, company: e.target.value })}
                      className="w-full px-4 py-3.5 bg-slate-50/50 border border-slate-200 rounded-2xl focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 outline-none text-[15px] font-medium transition-all"
                      placeholder="Ex: Sacolas LTDA"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-1">Telefone / WhatsApp</label>
                    <input 
                      type="text" 
                      value={newClientData.phone}
                      onChange={e => setNewClientData({ ...newClientData, phone: e.target.value })}
                      className="w-full px-4 py-3.5 bg-slate-50/50 border border-slate-200 rounded-2xl focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 outline-none text-[15px] font-medium transition-all"
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-1">Email</label>
                    <input 
                      type="email" 
                      value={newClientData.email}
                      onChange={e => setNewClientData({ ...newClientData, email: e.target.value })}
                      className="w-full px-4 py-3.5 bg-slate-50/50 border border-slate-200 rounded-2xl focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 outline-none text-[15px] font-medium transition-all"
                      placeholder="contato@empresa.com"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="px-8 py-6 border-t border-slate-100 bg-slate-50 shrink-0">
              <button 
                onClick={() => {
                  if (!newClientData.name) return;
                  const client: Client = {
                    ...newClientData,
                    id: crypto.randomUUID(),
                    totalBudgets: 0,
                    totalValue: 0,
                    lastBudget: ''
                  };
                  storage.saveClient(client);
                  const updatedClients = storage.getClients();
                  setClients(updatedClients);
                  setBudget({ ...budget, clientId: client.id });
                  setIsClientModalOpen(false);
                  setNewClientData({ name: '', company: '', phone: '', email: '', notes: '' });
                }}
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-semibold text-[15px] hover:bg-emerald-600 hover:shadow-lg hover:shadow-emerald-500/20 transition-all duration-300"
              >
                Cadastrar e Selecionar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
    </>
  );
};
