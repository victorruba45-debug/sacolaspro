import React, { useState, useCallback } from 'react';
import {
  Plus, Trash2, Copy, Check, FileText, ChevronDown, ChevronUp,
  Package, TrendingUp, AlertCircle, ClipboardList, Building2, Hash, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { jsPDF } from 'jspdf';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ManualItem {
  id: string;
  description: string;
  sizePreset: string;
  sizeW: string;
  sizeH: string;
  sizeD: string;
  handle: string;
  printing: string;
  finishing: string;
  extras: string;
  quantity: number;
  costUnit: number;
  saleUnit: number;
}

interface ManualQuoteProps {
  catalogProducts?: string[];
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

const generateProposalNumber = () =>
  `PROP-${Math.floor(100000 + Math.random() * 900000)}`;

const formatCurrency = (v: number) =>
  v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const buildSizeLabel = (item: ManualItem): string => {
  const hasCustom = item.sizeW || item.sizeH || item.sizeD;
  if (!hasCustom && !item.sizePreset) return '';
  const dims = [item.sizeW, item.sizeH, item.sizeD].filter(Boolean).join('x');
  const suffix = dims ? ` (${dims} cm)` : '';
  return item.sizePreset && item.sizePreset !== 'custom'
    ? `${item.sizePreset}${suffix}`
    : dims ? `${dims} cm` : '';
};

const DEFAULT_ITEM = (): ManualItem => ({
  id: crypto.randomUUID(),
  description: '',
  sizePreset: '',
  sizeW: '',
  sizeH: '',
  sizeD: '',
  handle: '',
  printing: '',
  finishing: '',
  extras: '',
  quantity: 1,
  costUnit: 0,
  saleUnit: 0,
});

// ─── Datalists (autocomplete) ─────────────────────────────────────────────────

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
    <datalist id="list-prazo">
      <option value="5 a 10 dias úteis" />
      <option value="10 a 15 dias úteis" />
      <option value="15 a 20 dias úteis" />
      <option value="20 a 30 dias úteis" />
      <option value="A combinar" />
    </datalist>
  </>
);

// ─── Item Card ────────────────────────────────────────────────────────────────

interface ItemCardProps {
  item: ManualItem;
  index: number;
  catalogProducts: string[];
  onChange: (id: string, patch: Partial<ManualItem>) => void;
  onRemove: (id: string) => void;
  canRemove: boolean;
}

const ItemCard: React.FC<ItemCardProps> = ({
  item, index, catalogProducts, onChange, onRemove, canRemove
}) => {
  const [expanded, setExpanded] = useState(true);
  // which optional fields are currently shown
  const [activeOptionals, setActiveOptionals] = useState<Set<OptionalKey>>(new Set());

  const totalCost = item.costUnit * item.quantity;
  const totalSale = item.saleUnit * item.quantity;
  const marginPct  = item.saleUnit > 0
    ? ((item.saleUnit - item.costUnit) / item.saleUnit) * 100
    : 0;
  const profit = totalSale - totalCost;

  const marginColor =
    marginPct >= 40 ? 'text-emerald-600' :
    marginPct >= 20 ? 'text-amber-500'   :
    'text-rose-500';

  const addOptional = (key: OptionalKey) => {
    setActiveOptionals(prev => new Set([...prev, key]));
  };
  const removeOptional = (key: OptionalKey) => {
    setActiveOptionals(prev => { const s = new Set(prev); s.delete(key); return s; });
    onChange(item.id, { [key]: '' });
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
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black text-sm">
            {index + 1}
          </div>
          <span className="font-black text-slate-700 text-sm truncate max-w-[180px]">
            {item.description || 'Novo Item'}
          </span>
          {sizeLabel && (
            <span className="hidden sm:inline text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
              {sizeLabel}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {item.saleUnit > 0 && (
            <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full bg-slate-100 ${marginColor}`}>
              {marginPct.toFixed(1)}% margem
            </span>
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

      {/* ── Body ── */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-6 space-y-6">

              {/* 1 – Descrição do Produto */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Descrição do Produto *
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Ex: Sacola Kraft Personalizada..."
                    value={item.description}
                    onChange={e => onChange(item.id, { description: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm font-medium"
                  />
                  {catalogProducts.length > 0 && (
                    <div className="space-y-1">
                      <select
                        value=""
                        onChange={e => { if (e.target.value) onChange(item.id, { description: e.target.value }); }}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm font-medium bg-white text-slate-500"
                      >
                        <option value="">Ou usar do catálogo...</option>
                        {catalogProducts.map(p => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>

              {/* 2 – Tamanho */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Tamanho <span className="text-slate-300 font-medium normal-case tracking-normal">(opcional)</span>
                </label>

                {/* Preset chips */}
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(SIZE_PRESETS) as string[]).map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => {
                        const preset = SIZE_PRESETS[p];
                        onChange(item.id, {
                          sizePreset: item.sizePreset === p ? '' : p,
                          sizeW: item.sizePreset === p ? '' : preset.w,
                          sizeH: item.sizePreset === p ? '' : preset.h,
                          sizeD: item.sizePreset === p ? '' : preset.d,
                        });
                      }}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-black uppercase transition-all ${
                        item.sizePreset === p
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => onChange(item.id, { sizePreset: 'custom', sizeW: '', sizeH: '', sizeD: '' })}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-black uppercase transition-all ${
                      item.sizePreset === 'custom'
                        ? 'bg-slate-800 text-white border-slate-800'
                        : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'
                    }`}
                  >
                    Personalizado
                  </button>
                </div>

                {/* Individual dimension inputs */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { field: 'sizeW', label: 'Largura (cm)' },
                    { field: 'sizeH', label: 'Altura (cm)' },
                    { field: 'sizeD', label: 'Profundidade (cm)' },
                  ].map(({ field: f, label: lbl }) => (
                    <div key={f} className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{lbl}</label>
                      <input
                        type="number"
                        min={0}
                        placeholder="0"
                        value={(item as any)[f]}
                        onChange={e => onChange(item.id, { [f]: e.target.value, sizePreset: 'custom' })}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm font-bold"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* 3 – Optional fields */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Campos Opcionais
                </label>

                {/* Add buttons for fields not yet active */}
                {OPTIONAL_FIELDS.filter(f => !activeOptionals.has(f.key)).length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {OPTIONAL_FIELDS.filter(f => !activeOptionals.has(f.key)).map(f => (
                      <button
                        key={f.key}
                        type="button"
                        onClick={() => addOptional(f.key)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl border-2 border-dashed border-slate-200 hover:border-emerald-400 hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 transition-all text-[11px] font-black uppercase tracking-widest"
                      >
                        <Plus size={11} /> {f.label}
                      </button>
                    ))}
                  </div>
                )}

                {/* Active optional fields */}
                <AnimatePresence>
                  {OPTIONAL_FIELDS.filter(f => activeOptionals.has(f.key)).map(f => (
                    <motion.div
                      key={f.key}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          {f.label}
                        </label>
                        <button
                          onClick={() => removeOptional(f.key)}
                          className="p-0.5 text-slate-300 hover:text-rose-400 transition-colors"
                          title={`Remover ${f.label}`}
                        >
                          <X size={12} />
                        </button>
                      </div>
                      <input
                        type="text"
                        list={f.listId}
                        placeholder={f.placeholder}
                        value={(item as any)[f.key]}
                        onChange={e => onChange(item.id, { [f.key]: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm font-medium"
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* 4 – Preços */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">QTD *</label>
                  <input
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={e => onChange(item.id, { quantity: Math.max(1, Number(e.target.value)) })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Custo Unit. (R$) *</label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={item.costUnit || ''}
                    placeholder="0,00"
                    onChange={e => onChange(item.id, { costUnit: Number(e.target.value) })}
                    className="w-full px-4 py-3 rounded-xl border border-amber-200 focus:ring-2 focus:ring-amber-400 outline-none transition-all text-sm font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Venda Unit. (R$) *</label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={item.saleUnit || ''}
                    placeholder="0,00"
                    onChange={e => onChange(item.id, { saleUnit: Number(e.target.value) })}
                    className="w-full px-4 py-3 rounded-xl border border-emerald-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm font-bold"
                  />
                </div>
              </div>

              {/* Margin mini summary */}
              {(item.costUnit > 0 || item.saleUnit > 0) && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`rounded-2xl p-4 grid grid-cols-3 gap-4 border ${
                    marginPct >= 40 ? 'bg-emerald-50 border-emerald-100' :
                    marginPct >= 20 ? 'bg-amber-50  border-amber-100'   :
                    'bg-rose-50 border-rose-100'
                  }`}
                >
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Custo Total</p>
                    <p className="text-sm font-black text-slate-700">R$ {formatCurrency(totalCost)}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Venda Total</p>
                    <p className="text-sm font-black text-slate-700">R$ {formatCurrency(totalSale)}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Lucro / Margem</p>
                    <p className={`text-sm font-black ${marginColor}`}>
                      R$ {formatCurrency(profit)} ({marginPct.toFixed(1)}%)
                    </p>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export const ManualQuote: React.FC<ManualQuoteProps> = ({ catalogProducts = [] }) => {
  const [supplier, setSupplier]         = useState('');
  const [proposalNumber]                = useState(generateProposalNumber);
  const [validity, setValidity]         = useState('5 dias');
  const [productionTime, setProduction] = useState('15 dias úteis');
  const [items, setItems]               = useState<ManualItem[]>([DEFAULT_ITEM()]);
  const [copied, setCopied]             = useState(false);

  // Helper to auto-format numeric inputs
  const formatInput = (value: string, suffix: string) => {
    if (!value.trim()) return '';
    if (/^\d+$/.test(value.trim())) return `${value.trim()} ${suffix}`;
    return value;
  };

  // ── Totals ──────────────────────────────────────────────────────────────
  const totalCost   = items.reduce((s, i) => s + i.costUnit * i.quantity, 0);
  const totalSale   = items.reduce((s, i) => s + i.saleUnit * i.quantity, 0);
  const totalProfit = totalSale - totalCost;
  const totalMargin = totalSale > 0 ? (totalProfit / totalSale) * 100 : 0;

  const marginColor =
    totalMargin >= 40 ? 'text-emerald-400' :
    totalMargin >= 20 ? 'text-amber-400'   :
    'text-rose-400';

  // ── Item operations ──────────────────────────────────────────────────────
  const addItem = () => setItems(prev => [...prev, DEFAULT_ITEM()]);

  const removeItem = useCallback((id: string) =>
    setItems(prev => prev.filter(i => i.id !== id)), []);

  const updateItem = useCallback((id: string, patch: Partial<ManualItem>) =>
    setItems(prev => prev.map(i => i.id === id ? { ...i, ...patch } : i)), []);

  // ── Quote text ───────────────────────────────────────────────────────────
  const buildQuoteText = () => {
    const date = new Date().toLocaleDateString('pt-BR');
    const validityText = validity.trim() || 'A combinar';
    const deadlineText = productionTime.trim() || 'A combinar';

    let text = `ORÇAMENTO SACOLAPRO - ${proposalNumber}\n`;
    text    += `-----------------------------------\n`;
    text    += `FORNECEDOR: ${supplier || 'Não informado'}\n`;
    text    += `DATA: ${date}\n`;

    items.forEach((item, idx) => {
      const sizeLabel = buildSizeLabel(item);
      text += '\n';
      if (items.length > 1) text += `ITEM ${idx + 1}: ${item.description || 'Sem descrição'}\n`;
      if (item.description)    text += `•  Material: ${item.description}\n`;
      if (item.handle)         text += `•  Alça: ${item.handle}\n`;
      if (sizeLabel)           text += `•  Tamanho: ${sizeLabel}\n`;
      if (item.printing)       text += `•  Impressão: ${item.printing}\n`;
      if (item.finishing)      text += `•  Acabamento: ${item.finishing}\n`;
      if (item.extras)         text += `•  Extras: ${item.extras}\n`;
      text += `•  Quantidade: ${item.quantity.toLocaleString()} unidades\n`;
      text += `•  Preço Unitário: R$ ${formatCurrency(item.saleUnit)}\n`;
      text += `•  Preço Total: R$ ${formatCurrency(item.saleUnit * item.quantity)}\n`;
    });

    text += `\n-----------------------------------\n`;
    if (items.length > 1) {
      text += `TOTAL GERAL: R$ ${formatCurrency(totalSale)}\n`;
    }
    text += `•  Prazo de Produção: ${deadlineText}\n`;
    text += `•  Validade do Orçamento: ${validityText}\n`;
    text += `-----------------------------------\nGerado por SacolaPro`;
    return text;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(buildQuoteText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── PDF ──────────────────────────────────────────────────────────────────
  const generatePDF = () => {
    const doc  = new jsPDF();
    const date = new Date().toLocaleDateString('pt-BR');
    const validityText = validity.trim() || 'A combinar';
    const deadlineText = productionTime.trim() || 'A combinar';
    let y = 20;

    const separator = () => {
      doc.setDrawColor(226, 232, 240);
      doc.line(20, y, 190, y);
      y += 6;
    };

    doc.setFontSize(18);
    doc.setTextColor(16, 185, 129);
    doc.text(`ORÇAMENTO SACOLAPRO – ${proposalNumber}`, 20, y); y += 9;

    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Fornecedor: ${supplier || 'Não informado'}`, 20, y); y += 5;
    doc.text(`Data: ${date}`, 20, y); y += 7;
    separator();

    items.forEach((item, idx) => {
      const sizeLabel = buildSizeLabel(item);

      if (items.length > 1) {
        doc.setFontSize(12);
        doc.setTextColor(30, 41, 59);
        doc.text(`ITEM ${idx + 1}: ${item.description || 'Sem descrição'}`, 20, y); y += 7;
      }

      const details = [
        item.description && `Material: ${item.description}`,
        item.handle      && `Alça: ${item.handle}`,
        sizeLabel        && `Tamanho: ${sizeLabel}`,
        item.printing    && `Impressão: ${item.printing}`,
        item.finishing   && `Acabamento: ${item.finishing}`,
        item.extras      && `Extras: ${item.extras}`,
        `Quantidade: ${item.quantity.toLocaleString()} unidades`,
      ].filter(Boolean) as string[];

      doc.setFontSize(10);
      doc.setTextColor(71, 85, 105);
      details.forEach(d => { doc.text(`• ${d}`, 26, y); y += 6; });

      y += 2;
      doc.setFontSize(11);
      doc.setTextColor(30, 41, 59);
      doc.text('VALORES:', 20, y); y += 6;
      doc.setFontSize(10);
      doc.text(`• Preço Unitário: R$ ${formatCurrency(item.saleUnit)}`, 26, y); y += 6;
      doc.setFontSize(13);
      doc.setTextColor(16, 185, 129);
      doc.text(`• Preço Total: R$ ${formatCurrency(item.saleUnit * item.quantity)}`, 26, y); y += 8;

      y += 2;
      separator();
      if (y > 250) { doc.addPage(); y = 20; }
    });

    if (items.length > 1) {
      doc.setFontSize(14);
      doc.setTextColor(30, 41, 59);
      doc.text('TOTAL GERAL', 20, y); y += 8;
      doc.setFontSize(17);
      doc.setTextColor(16, 185, 129);
      doc.text(`R$ ${formatCurrency(totalSale)}`, 20, y); y += 9;
      separator();
    }

    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Prazo de Produção: ${deadlineText}`, 20, y); y += 6;
    doc.text(`Validade do Orçamento: ${validityText}`, 20, y); y += 8;
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text('Gerado automaticamente por SacolaPro', 20, y);

    doc.save(`orcamento-manual-${proposalNumber}.pdf`);
  };

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Autocomplete lists */}
      <DataLists />

      {/* ── Left column ─────────────────────────────────────────────────── */}
      <div className="lg:col-span-7 space-y-6">

        {/* Header card */}
        <section className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
            <ClipboardList size={18} className="text-emerald-600" />
            <div>
              <h2 className="font-black text-slate-900 uppercase tracking-tight text-sm">
                Orçamento Manual
              </h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                Produtos personalizados com preço livre
              </p>
            </div>
          </div>

          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Supplier */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <Building2 size={10} /> Nome do Fornecedor
              </label>
              <input
                type="text"
                placeholder="Ex: GráficaPro, FabricaBags..."
                value={supplier}
                onChange={e => setSupplier(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm font-bold"
              />
            </div>

            {/* Proposal number */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <Hash size={10} /> Número da Proposta
              </label>
              <div className="px-4 py-3 rounded-xl border border-slate-100 bg-slate-50 text-sm font-black text-slate-500 select-all">
                {proposalNumber}
              </div>
            </div>

            {/* Prazo de Produção */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Prazo de Produção
              </label>
              <input
                type="text"
                list="list-prazo"
                placeholder="Ex: 15 dias úteis"
                value={productionTime}
                onChange={e => setProduction(e.target.value)}
                onBlur={e => setProduction(formatInput(e.target.value, 'dias úteis'))}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm font-medium"
              />
            </div>

            {/* Validity */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Validade do Orçamento
              </label>
              <input
                type="text"
                list="list-validity"
                placeholder="Ex: 5 dias"
                value={validity}
                onChange={e => setValidity(e.target.value)}
                onBlur={e => setValidity(formatInput(e.target.value, 'dias'))}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm font-medium"
              />
              <datalist id="list-validity">
                <option value="3 dias" />
                <option value="5 dias" />
                <option value="7 dias" />
                <option value="A combinar" />
              </datalist>
            </div>
          </div>
        </section>

        {/* Items */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-slate-900 uppercase tracking-tight text-sm flex items-center gap-2">
              <Package size={16} className="text-emerald-600" />
              Itens do Orçamento
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-black flex items-center justify-center">
                {items.length}
              </span>
            </h3>
          </div>

          <AnimatePresence mode="popLayout">
            {items.map((item, idx) => (
              <ItemCard
                key={item.id}
                item={item}
                index={idx}
                catalogProducts={catalogProducts}
                onChange={updateItem}
                onRemove={removeItem}
                canRemove={items.length > 1}
              />
            ))}
          </AnimatePresence>

          <button
            onClick={addItem}
            className="w-full py-4 rounded-2xl border-2 border-dashed border-slate-200 hover:border-emerald-400 hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 transition-all font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2"
          >
            <Plus size={16} /> Adicionar Outro Item
          </button>
        </div>
      </div>

      {/* ── Right column (summary) ────────────────────────────────────────── */}
      <div className="lg:col-span-5 space-y-6">
        <section className="bg-slate-900 rounded-[2.5rem] shadow-2xl p-8 text-white md:sticky md:top-24 border border-white/5">
          <div className="space-y-6">

            {/* Total */}
            <div>
              <h3 className="text-slate-500 font-black uppercase text-[10px] tracking-widest mb-3">
                Resumo do Orçamento
              </h3>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-4xl font-black tracking-tighter">
                  R$ {formatCurrency(totalSale)}
                </span>
                <span className="text-slate-500 text-sm font-bold">total</span>
              </div>
              <p className="text-slate-500 text-xs font-bold">
                Prazo: <span className="text-slate-400">{productionTime || 'A combinar'}</span> · Validade:{' '}
                <span className="text-slate-400">{validity || 'A combinar'}</span>
              </p>
            </div>

            <div className="h-px bg-white/5" />

            {/* Margin */}
            <div className="space-y-3">
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                <TrendingUp size={12} /> Análise de Margem
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/5 rounded-2xl p-4">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Custo Total</p>
                  <p className="text-base font-black text-amber-400">R$ {formatCurrency(totalCost)}</p>
                </div>
                <div className="bg-white/5 rounded-2xl p-4">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Lucro Total</p>
                  <p className={`text-base font-black ${marginColor}`}>R$ {formatCurrency(totalProfit)}</p>
                </div>
              </div>

              <div className="bg-white/5 rounded-2xl p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Margem sobre Venda</span>
                  <span className={`text-xl font-black ${marginColor}`}>{totalMargin.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${
                      totalMargin >= 40 ? 'bg-emerald-400' :
                      totalMargin >= 20 ? 'bg-amber-400'   : 'bg-rose-400'
                    }`}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(totalMargin, 100)}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                  />
                </div>
                <p className="text-[10px] text-slate-500 font-medium">
                  {totalMargin >= 40 ? '🟢 Excelente margem de lucro'          :
                   totalMargin >= 20 ? '🟡 Margem razoável, pode melhorar'     :
                   totalSale   === 0 ? '⬜ Preencha os valores para a análise'  :
                                      '🔴 Margem baixa — revise os preços'}
                </p>
              </div>
            </div>

            <div className="h-px bg-white/5" />

            {/* Per-item breakdown */}
            {items.length > 1 && (
              <>
                <div className="space-y-2">
                  <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Por Item</h4>
                  {items.map((item, idx) => {
                    const iSale   = item.saleUnit * item.quantity;
                    const iMargin = item.saleUnit > 0
                      ? ((item.saleUnit - item.costUnit) / item.saleUnit) * 100
                      : 0;
                    return (
                      <div key={item.id} className="flex items-center justify-between text-xs font-bold py-2 border-b border-white/5 last:border-0">
                        <span className="text-slate-400 truncate max-w-[140px]">
                          {idx + 1}. {item.description || 'Item'}
                        </span>
                        <div className="flex items-center gap-3">
                          <span className={`text-[10px] ${
                            iMargin >= 40 ? 'text-emerald-400' :
                            iMargin >= 20 ? 'text-amber-400'   : 'text-rose-400'}`}>
                            {iMargin.toFixed(0)}%
                          </span>
                          <span className="text-white">R$ {formatCurrency(iSale)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="h-px bg-white/5" />
              </>
            )}

            {/* Warning */}
            {totalSale === 0 && (
              <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4">
                <AlertCircle size={16} className="text-amber-400 shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-300 font-medium leading-relaxed">
                  Preencha o <strong>Custo Unit.</strong> e <strong>Venda Unit.</strong> para ver a análise de margem.
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col gap-3">
              <button
                onClick={handleCopy}
                className={`w-full py-5 rounded-3xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 transition-all active:scale-[0.98] ${
                  copied
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                    : 'bg-white text-slate-900 hover:bg-slate-100 shadow-xl shadow-white/5'
                }`}
              >
                {copied ? <><Check size={20} /> Copiado!</> : <><Copy size={20} /> Copiar Orçamento</>}
              </button>
              <button
                onClick={generatePDF}
                className="w-full py-5 bg-slate-900 text-white border border-white/10 rounded-3xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 transition-all hover:bg-emerald-600 shadow-xl"
              >
                <FileText size={20} /> Gerar PDF
              </button>
            </div>

          </div>
        </section>
      </div>
    </div>
  );
};
