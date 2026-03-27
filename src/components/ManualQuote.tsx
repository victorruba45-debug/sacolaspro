import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus, Trash2, Copy, Check, FileText, ChevronDown, ChevronUp,
  Package, TrendingUp, AlertCircle, ClipboardList, Building2, Hash, X,
  Calculator, User, Save
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { jsPDF } from 'jspdf';
import { Budget, BudgetItem, Client, QuoteConfig, BudgetItemSnapshot } from '../types';
import { storage } from '../lib/storage';

// ─── Types & Props ───────────────────────────────────────────────────────────

interface ManualQuoteProps {
  catalogProducts?: string[];
  activeBudget?: Budget | null;
  onSave?: (budget: Budget) => void;
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
      className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm"
    >
      <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black text-sm">
            {index + 1}
          </div>
          <span className="font-black text-slate-700 text-sm truncate max-w-[180px]">
            {item.name || item.description || 'Novo Item'}
          </span>
          {sizeLabel && (
            <span className="hidden sm:inline text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
              {sizeLabel}
            </span>
          )}
          {item.type === 'catalog' && (
             <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[9px] font-black rounded-full uppercase tracking-widest">Catálogo</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {item.unitPrice > 0 && (
            <>
              <span className={`hidden sm:inline text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full bg-slate-100 ${marginColor}`}>
                {marginPct.toFixed(1)}% margem
              </span>
              <span className="text-xs font-black text-slate-700">
                R$ {formatCurrency(totalSale)}
              </span>
            </>
          )}
          <button
            onClick={() => setExpanded(p => !p)}
            className="p-2 hover:bg-slate-200 rounded-xl text-slate-400 transition-all"
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          {canRemove && (
            <button
              onClick={() => onRemove(item.id)}
              className="p-2 hover:bg-rose-50 hover:text-rose-500 rounded-xl text-slate-300 transition-all"
            >
              <Trash2 size={16} />
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
            <div className="p-6 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Nome / Descrição do Produto *
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Ex: Sacola Kraft Personalizada..."
                    value={item.name || item.description}
                    onChange={e => onChange(item.id, { name: e.target.value, description: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm font-medium"
                  />
                  {catalogProducts.length > 0 && item.type === 'manual' && (
                    <select
                      value=""
                      onChange={e => { if (e.target.value) onChange(item.id, { name: e.target.value, description: e.target.value }); }}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm font-medium bg-white text-slate-500"
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
                <>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tamanho</label>
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
                          className={`px-3 py-1.5 rounded-xl border text-xs font-black uppercase transition-all ${
                            item.snapshot?.sizePreset === p
                              ? 'bg-emerald-600 text-white border-emerald-600'
                              : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {['sizeW', 'sizeH', 'sizeD'].map((f, i) => (
                        <div key={f}>
                          <span className="text-[9px] font-black text-slate-400 uppercase block mb-1">
                            {['L', 'A', 'P'][i]} (cm)
                          </span>
                          <input
                            type="number"
                            value={(item.snapshot as any)?.[f] || ''}
                            onChange={e => updateSnapshot({ [f]: e.target.value, sizePreset: 'custom' })}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {OPTIONAL_FIELDS.map(f => (
                      <div key={f.key} className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{f.label}</label>
                        <input
                          type="text"
                          list={f.listId}
                          value={(item.snapshot as any)?.[f.key] || ''}
                          onChange={e => updateSnapshot({ [f.key]: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium"
                          placeholder={f.placeholder}
                        />
                      </div>
                    ))}
                  </div>
                </>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">QTD</label>
                  <input
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={e => onChange(item.id, { quantity: Math.max(1, Number(e.target.value)) })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Custo Unit. (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={item.unitCost || ''}
                    onChange={e => onChange(item.id, { unitCost: Number(e.target.value) })}
                    className="w-full px-4 py-3 rounded-xl border border-amber-200 text-sm font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Venda Unit. (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={item.unitPrice || ''}
                    onChange={e => onChange(item.id, { unitPrice: Number(e.target.value) })}
                    className="w-full px-4 py-3 rounded-xl border border-emerald-200 text-sm font-bold"
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
  onAddCatalogItem 
}) => {
  const [budget, setBudget] = useState<Budget>(() => activeBudget || {
    id: crypto.randomUUID(),
    origin: 'manual',
    status: 'draft',
    date: new Date().toISOString(),
    items: [DEFAULT_ITEM()],
    totalValue: 0,
    totalCost: 0,
    margin: 0,
    updatedAt: new Date().toISOString()
  });

  const [clients, setClients] = useState<Client[]>([]);
  const [copied, setCopied] = useState(false);

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
    setBudget(prev => ({
      ...prev,
      items: prev.items.filter(i => i.id !== id)
    }));

  const addItem = () => setBudget(prev => ({
    ...prev,
    items: [...prev.items, DEFAULT_ITEM()]
  }));

  const handleCopy = () => {
    let text = `ORÇAMENTO - ${budget.id.split('-')[0]}\n`;
    budget.items.forEach((item, i) => {
      text += `\nITEM ${i+1}: ${item.name || item.description}\n`;
      text += `• QTD: ${item.quantity}\n`;
      text += `• UN: R$ ${formatCurrency(item.unitPrice)}\n`;
    });
    text += `\nTOTAL: R$ ${formatCurrency(budget.totalValue)}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    doc.text(`Orçamento #${budget.id.split('-')[0]}`, 20, 20);
    doc.save(`orcamento-${budget.id}.pdf`);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <DataLists />
      <div className="lg:col-span-7 space-y-6">
        <section className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <User className="text-emerald-600" size={20} />
            <h2 className="font-black text-slate-900 uppercase text-sm">Cliente e Status</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Selecionar Cliente</label>
              <select 
                value={budget.clientId || ''}
                onChange={e => setBudget({ ...budget, clientId: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-bold bg-white"
              >
                <option value="">Nenhum cliente selecionado</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name} ({c.company})</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</label>
              <select 
                value={budget.status}
                onChange={e => setBudget({ ...budget, status: e.target.value as any })}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-bold bg-white"
              >
                <option value="draft">Rascunho</option>
                <option value="sent">Enviado</option>
                <option value="approved">Aprovado</option>
                <option value="lost">Perdido</option>
              </select>
            </div>
          </div>
        </section>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-slate-900 uppercase tracking-tight text-sm flex items-center gap-2">
              <Package size={16} className="text-emerald-600" />
              Itens do Orçamento
            </h3>
          </div>
          <AnimatePresence mode="popLayout">
            {budget.items.map((item, idx) => (
              <ItemCard
                key={item.id}
                item={item}
                index={idx}
                catalogProducts={catalogProducts}
                onChange={updateItem}
                onRemove={removeItem}
                canRemove={budget.items.length > 1}
              />
            ))}
          </AnimatePresence>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={addItem}
              className="py-4 rounded-2xl border-2 border-dashed border-slate-200 hover:border-emerald-400 hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 transition-all font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2"
            >
              <Plus size={16} /> Item Manual
            </button>
            <button
              onClick={onAddCatalogItem}
              className="py-4 rounded-2xl border-2 border-dashed border-emerald-200 bg-emerald-50/30 hover:border-emerald-400 hover:bg-emerald-50 text-emerald-600 transition-all font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2"
            >
              <Calculator size={16} /> Item Calculadora
            </button>
          </div>
        </div>
      </div>

      <div className="lg:col-span-5">
        <section className="bg-slate-900 rounded-[2.5rem] p-8 text-white md:sticky md:top-24 border border-white/5 space-y-6">
          <div>
            <h3 className="text-slate-500 font-black uppercase text-[10px] tracking-widest mb-3">Resumo Financeiro</h3>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black">R$ {formatCurrency(budget.totalValue)}</span>
            </div>
            <p className={`text-sm font-black mt-1 ${budget.margin >= 20 ? 'text-emerald-400' : 'text-rose-400'}`}>
              Margem Global: {budget.margin.toFixed(1)}%
            </p>
          </div>

          <div className="h-px bg-white/5" />

          <div className="space-y-3">
            <button onClick={handleCopy} className="w-full py-4 bg-white text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2">
              {copied ? <Check size={18} /> : <Copy size={18} />} {copied ? 'Copiado!' : 'Copiar Texto'}
            </button>
            <button onClick={generatePDF} className="w-full py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-black text-xs uppercase tracking-widest border border-white/10 flex items-center justify-center gap-2">
              <FileText size={18} /> Gerar PDF
            </button>
            <button 
              onClick={() => onSave?.(budget)} 
              className="w-full py-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-3xl font-black text-sm uppercase tracking-widest shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2"
            >
              <Save size={20} /> Salvar Orçamento
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};
