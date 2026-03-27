import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Search, 
  MoreVertical, 
  Pencil, 
  Copy, 
  Trash2, 
  ExternalLink,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Download,
  DollarSign,
  TrendingDown,
  Calendar,
  X,
  ArrowDownUp,
  SlidersHorizontal
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { storage } from '../lib/storage';
import { Budget, Client } from '../types';

interface QuotesDashboardProps {
  onEdit: (budget: Budget) => void;
}

export const QuotesDashboard: React.FC<QuotesDashboardProps> = ({ onEdit }) => {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPeriod, setFilterPeriod] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'highest_value' | 'lowest_value' | 'highest_margin'>('newest');
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  useEffect(() => {
    setBudgets(storage.getBudgets());
    setClients(storage.getClients());
  }, []);

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este orçamento?')) {
      storage.deleteBudget(id);
      setBudgets(prev => prev.filter(b => b.id !== id));
    }
  };

  const handleDuplicate = (id: string) => {
    const newBudget = storage.duplicateBudget(id);
    if (newBudget) {
      setBudgets(prev => [newBudget, ...prev]);
    }
  };

  const getClientName = (clientId?: string) => {
    if (!clientId) return 'Cliente não vinculado';
    return clients.find(c => c.id === clientId)?.name || 'Cliente não encontrado';
  };

  const isWithinPeriod = (dateStr: string, period: string) => {
    if (period === 'all') return true;
    const date = new Date(dateStr);
    const now = new Date();
    date.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (period === 'today') return diffDays <= 1; 
    if (period === 'week') return diffDays <= 7;
    if (period === 'month') return diffDays <= 30;
    return true;
  };

  const filteredBudgets = budgets.filter(b => {
    const matchesSearch = getClientName(b.clientId).toLowerCase().includes(searchTerm.toLowerCase()) || 
                         b.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         b.totalValue.toString().includes(searchTerm);
    const matchesStatus = filterStatus === 'all' || b.status === filterStatus;
    const matchesPeriod = isWithinPeriod(b.date, filterPeriod);
    return matchesSearch && matchesStatus && matchesPeriod;
  });

  const sortedBudgets = [...filteredBudgets].sort((a, b) => {
    switch (sortBy) {
      case 'highest_value': return b.totalValue - a.totalValue;
      case 'lowest_value': return a.totalValue - b.totalValue;
      case 'highest_margin': return b.margin - a.margin;
      case 'newest':
      default: return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    }
  });

  const summary = {
    totalValue: filteredBudgets.reduce((sum, b) => sum + b.totalValue, 0),
    totalCost: filteredBudgets.reduce((sum, b) => sum + b.totalCost, 0),
    count: filteredBudgets.length
  };
  const summaryProfit = summary.totalValue - summary.totalCost;
  const summaryMargin = summary.totalValue > 0 ? (summaryProfit / summary.totalValue) * 100 : 0;

  const exportToCsv = () => {
    if (filteredBudgets.length === 0) return;
    
    const headers = ['ID', 'Data', 'Cliente', 'Status', 'Qtd Itens', 'Custo Total (R$)', 'Venda Total (R$)', 'Lucro Máximo (R$)'];
    const rows = filteredBudgets.map(b => [
      b.id.split('-')[0],
      new Date(b.date).toLocaleDateString('pt-BR'),
      getClientName(b.clientId),
      statusMap[b.status as keyof typeof statusMap].label,
      b.items.length.toString(),
      b.totalCost.toFixed(2).replace('.', ','),
      b.totalValue.toFixed(2).replace('.', ','),
      (b.totalValue - b.totalCost).toFixed(2).replace('.', ',')
    ]);
    
    const csvContent = [
      headers.join(';'),
      ...rows.map(r => r.join(';'))
    ].join('\n');
    
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `orcamentos_${filterPeriod}_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPdf = () => {
    if (filteredBudgets.length === 0) return;
    
    const doc = new jsPDF();
    
    doc.setFontSize(16);
    doc.text('Relatório de Orçamentos - SacolaPro', 14, 15);
    
    doc.setFontSize(10);
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, 22);

    const headers = [['ID', 'Data', 'Cliente', 'Status', 'Itens', 'Custo Total', 'Venda Total', 'Lucro']];
    const data = filteredBudgets.map(b => [
      b.id.split('-')[0].toUpperCase(),
      new Date(b.date).toLocaleDateString('pt-BR'),
      getClientName(b.clientId),
      statusMap[b.status as keyof typeof statusMap].label,
      b.items.length.toString(),
      `R$ ${b.totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      `R$ ${b.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      `R$ ${(b.totalValue - b.totalCost).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
    ]);

    autoTable(doc, {
      startY: 28,
      head: headers,
      body: data,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [5, 150, 105] }, // emerald-600
    });

    doc.save(`relatorio_orcamentos_${filterPeriod}_${new Date().getTime()}.pdf`);
  };

  const statusMap = {
    draft: { label: 'Rascunho', color: 'bg-slate-100 text-slate-600 border-slate-200', icon: <Clock size={12} /> },
    sent: { label: 'Enviado', color: 'bg-amber-50 text-amber-600 border-amber-200', icon: <ExternalLink size={12} /> },
    approved: { label: 'Aprovado', color: 'bg-emerald-50 text-emerald-600 border-emerald-200', icon: <CheckCircle2 size={12} /> },
    lost: { label: 'Perdido', color: 'bg-rose-50 text-rose-600 border-rose-200', icon: <XCircle size={12} /> },
  };

  const activeFiltersCount = (filterStatus !== 'all' ? 1 : 0) + (filterPeriod !== 'all' ? 1 : 0) + (searchTerm ? 1 : 0);

  const clearFilters = () => {
    setSearchTerm('');
    setFilterStatus('all');
    setFilterPeriod('all');
  };

  const Chip: React.FC<{ label: string; active: boolean; onClick: () => void }> = ({ label, active, onClick }) => (
    <button
      onClick={onClick}
      className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
        active 
          ? 'bg-white text-slate-900 shadow-sm border border-slate-200/60' 
          : 'bg-transparent text-slate-500 border border-transparent hover:text-slate-800 hover:bg-slate-200/50'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-8 max-w-[85rem] mx-auto pb-12">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Meus Orçamentos</h2>
          <p className="text-[15px] text-slate-500 font-medium mt-1">Gerencie, acompanhe e exporte seu histórico completo.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
          {/* Mobile Filter Toggle */}
          <button 
            onClick={() => setIsFilterDrawerOpen(true)}
            className="lg:hidden w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold text-sm transition-all shadow-sm"
          >
            <SlidersHorizontal size={18} /> Filtros e Busca {activeFiltersCount > 0 && <span className="bg-emerald-500 text-white px-2 py-0.5 rounded-full text-[10px] ml-1">{activeFiltersCount}</span>}
          </button>

          {/* Mobile Export Buttons (Visible ONLY on mobile here) */}
          <div className="flex lg:hidden w-full gap-2">
            <button
              onClick={exportToPdf}
              disabled={filteredBudgets.length === 0}
              className="flex-1 px-4 py-3 bg-emerald-600 justify-center text-white rounded-xl text-[14px] font-semibold flex items-center gap-2 hover:bg-emerald-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed group mr-0"
              title="Exportar para PDF"
            >
              <Download size={18} className="group-hover:-translate-y-0.5 transition-transform" /> PDF
            </button>
            <button
              onClick={exportToCsv}
              disabled={filteredBudgets.length === 0}
              className="flex-1 px-4 py-3 bg-slate-900 justify-center text-white rounded-xl text-[14px] font-semibold flex items-center gap-2 hover:bg-slate-800 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
              title="Exportar para Excel (CSV)"
            >
              <Download size={18} className="group-hover:-translate-y-0.5 transition-transform" /> Excel
            </button>
          </div>
        </div>
      </div>
      
      {/* Financial Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white rounded-3xl p-6 border border-slate-200/60 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl -mr-10 -mt-10 transition-all group-hover:bg-emerald-500/10"></div>
          <div className="flex items-center gap-4 relative">
            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 shadow-inner shrink-0 border border-emerald-100/50">
              <DollarSign size={24} strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1">Expectativa de Ganhos</p>
              <p className="text-3xl font-black text-slate-900 tracking-tight">R$ {summary.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-3xl p-6 border border-slate-200/60 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-slate-500/5 rounded-full blur-3xl -mr-10 -mt-10 transition-all group-hover:bg-slate-500/10"></div>
          <div className="flex items-center gap-4 relative">
            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-500 shadow-inner shrink-0 border border-slate-200/50">
              <TrendingDown size={24} strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1">Custo Total Projetado</p>
              <p className="text-3xl font-black text-slate-900 tracking-tight">R$ {summary.totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-3xl p-6 border border-slate-200/60 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl -mr-10 -mt-10 transition-all group-hover:bg-amber-500/10"></div>
          <div className="flex items-center gap-4 relative">
            <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 shadow-inner shrink-0 border border-amber-100/50">
              <FileText size={24} strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1">Total de Orçamentos</p>
              <p className="text-3xl font-black text-slate-900 tracking-tight">{summary.count} <span className="text-base font-bold text-emerald-600 ml-1">({summaryMargin.toFixed(1)}% luc.)</span></p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Bar (Desktop Inline, Mobile Drawer) */}
      <div className={`fixed inset-0 z-50 flex flex-col justify-end lg:static lg:block lg:z-auto transition-all ${isFilterDrawerOpen ? 'visible bg-slate-900/40 backdrop-blur-sm' : 'invisible lg:visible'}`}>
        
        {/* Mobile close overlay */}
        <div className="absolute inset-0 lg:hidden" onClick={() => setIsFilterDrawerOpen(false)} />
        
        <div className={`bg-white p-6 lg:p-4 rounded-t-3xl lg:rounded-3xl border-t lg:border border-slate-200/60 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] lg:shadow-sm flex flex-col gap-6 lg:gap-4 relative z-10 transition-transform duration-300 ${isFilterDrawerOpen ? 'translate-y-0' : 'translate-y-full lg:translate-y-0 w-full'}`}>
          <div className="flex items-center justify-between lg:hidden mb-2">
            <h3 className="font-black text-slate-800 text-lg flex items-center gap-2"><SlidersHorizontal size={20} /> Filtros</h3>
            <button onClick={() => setIsFilterDrawerOpen(false)} className="p-2 bg-slate-100 rounded-xl text-slate-500"><X size={20} /></button>
          </div>

          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar por cliente, ID ou valor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 md:py-3 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 focus:border-emerald-300 rounded-2xl text-[15px] font-medium focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all placeholder:text-slate-400"
            />
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 lg:gap-4">
            <div className="flex items-start lg:items-center gap-3 flex-col lg:flex-row flex-wrap">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest lg:hidden">Período</span>
              {/* Period Chips */}
              <div className="flex items-center flex-wrap gap-2 lg:bg-slate-100/50 lg:p-1 lg:rounded-2xl lg:border border-slate-200/50 w-full lg:w-auto">
                <Chip label="Todo período" active={filterPeriod === 'all'} onClick={() => setFilterPeriod('all')} />
                <Chip label="Hoje" active={filterPeriod === 'today'} onClick={() => setFilterPeriod('today')} />
                <Chip label="Últimos 7 dias" active={filterPeriod === 'week'} onClick={() => setFilterPeriod('week')} />
                <Chip label="Últimos 30 dias" active={filterPeriod === 'month'} onClick={() => setFilterPeriod('month')} />
              </div>

              <div className="h-6 w-px bg-slate-200 hidden lg:block" />

              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest lg:hidden mt-2">Status do Orçamento</span>
              {/* Status Select */}
              <select 
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full lg:w-auto px-4 py-3 lg:py-2 bg-slate-50 lg:bg-slate-100/50 border border-slate-200/80 rounded-xl text-[14px] lg:text-sm font-semibold text-slate-600 focus:ring-4 focus:ring-emerald-500/10 outline-none appearance-none cursor-pointer transition-all hover:bg-slate-100"
              >
                <option value="all">Todos os Status</option>
                <option value="draft">Somente Rascunhos</option>
                <option value="sent">Somente Enviados</option>
                <option value="approved">Somente Aprovados</option>
                <option value="lost">Somente Perdidos</option>
              </select>

              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest lg:hidden mt-2">Ordenação</span>
              {/* Sort Dropdown */}
              <div className="w-full lg:w-auto flex items-center gap-2 bg-slate-50 lg:bg-slate-100/50 border border-slate-200/80 rounded-xl px-2 transition-all hover:bg-slate-100">
                <ArrowDownUp size={16} className="text-slate-400 ml-2 shrink-0" />
                <select 
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full py-3 lg:py-2 pr-2 bg-transparent text-[14px] lg:text-sm font-semibold text-slate-600 outline-none appearance-none cursor-pointer"
                >
                  <option value="newest">Mais recentes</option>
                  <option value="highest_value">Maior Valor</option>
                  <option value="lowest_value">Menor Valor</option>
                  <option value="highest_margin">Maior Margem</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-4 mt-2 lg:mt-0 pt-4 lg:pt-0 border-t lg:border-0 border-slate-100">
              {activeFiltersCount > 0 && (
                <button 
                  onClick={clearFilters}
                  className="w-full sm:w-auto justify-center py-3 lg:py-0 text-sm lg:text-xs font-bold text-slate-400 hover:text-slate-700 flex items-center gap-1.5 transition-colors bg-slate-50 lg:bg-transparent rounded-xl"
                  title="Limpar todos os filtros da busca"
                >
                  <X size={16}/> Limpar <span className="hidden sm:inline">({activeFiltersCount})</span>
                </button>
              )}
              <div className="hidden lg:flex w-full sm:w-auto gap-2">
                <button
                  onClick={exportToPdf}
                  disabled={filteredBudgets.length === 0}
                  className="w-full sm:w-auto px-4 py-2.5 bg-emerald-600 justify-center text-white rounded-xl text-[13px] font-semibold flex items-center gap-2 hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed group shrink-0"
                  title="Exportar para PDF"
                >
                  <Download size={18} className="group-hover:-translate-y-0.5 transition-transform" />
                  <span className="hidden sm:inline">PDF</span>
                </button>
                <button
                  onClick={exportToCsv}
                  disabled={filteredBudgets.length === 0}
                  className="w-full sm:w-auto px-4 py-2.5 bg-slate-900 justify-center text-white rounded-xl text-[13px] font-semibold flex items-center gap-2 hover:bg-slate-800 hover:shadow-lg hover:shadow-slate-900/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed group shrink-0"
                  title="Exportar para Excel (CSV)"
                >
                  <Download size={18} className="group-hover:-translate-y-0.5 transition-transform" />
                  <span className="hidden sm:inline">Excel</span>
                </button>
              </div>
              
              <button onClick={() => setIsFilterDrawerOpen(false)} className="lg:hidden w-full py-4 mt-2 bg-emerald-600 text-white rounded-xl font-black text-sm uppercase tracking-widest shadow-lg shadow-emerald-500/20">
                 Ver Resultados
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quotes List */}
      <div className="grid grid-cols-1 gap-4">
        <AnimatePresence mode="popLayout">
          {sortedBudgets.map((budget) => (
            <motion.div
              layout
              key={budget.id}
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl border border-slate-200/60 p-4 md:p-5 hover:border-slate-300 hover:shadow-xl hover:shadow-slate-200/20 transition-all group flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-5 relative overflow-hidden"
            >
              {/* Subtle accent bar matching status color if desired, optional */}
              <div className="flex items-start md:items-center gap-3 md:gap-5">
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 shrink-0 group-hover:scale-105 transition-transform duration-300">
                  <FileText size={20} className="md:w-6 md:h-6" strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2.5 tracking-tight">
                    {getClientName(budget.clientId)}
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 border ${statusMap[budget.status as keyof typeof statusMap].color}`}>
                      {statusMap[budget.status as keyof typeof statusMap].icon} {statusMap[budget.status as keyof typeof statusMap].label}
                    </span>
                  </h3>
                  <p className="text-[13px] text-slate-500 font-medium mt-1.5 flex items-center gap-2">
                    <Calendar size={14} className="opacity-70" /> {new Date(budget.date).toLocaleDateString('pt-BR')}
                    <span className="w-1 h-1 rounded-full bg-slate-300 block mx-1" />
                    {budget.items.length} {budget.items.length === 1 ? 'item' : 'itens'}
                    <span className="w-1 h-1 rounded-full bg-slate-300 block mx-1" />
                    ID: {budget.id.split('-')[0]}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between md:justify-end gap-6 md:gap-8 border-t border-slate-100 md:border-0 pt-4 md:pt-0">
                <div className="text-left md:text-right">
                  <p className="text-xl font-black text-slate-900 tracking-tight">R$ {budget.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  <p className="text-[11px] text-emerald-600 font-bold uppercase tracking-widest mt-0.5">
                    {budget.margin.toFixed(1)}% margem
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-slate-50 p-1 rounded-xl border border-slate-200/60 shadow-sm mr-2">
                    <button 
                      onClick={() => onEdit(budget)}
                      className="p-2 hover:bg-white rounded-lg text-slate-400 hover:text-indigo-600 transition-all shadow-sm"
                      title="Sair do modo leitura e Editar"
                    >
                      <Pencil size={16} strokeWidth={2.5}/>
                    </button>
                    <button 
                      onClick={() => handleDuplicate(budget.id)}
                      className="p-2 hover:bg-white rounded-lg text-slate-400 hover:text-amber-600 transition-all shadow-sm"
                      title="Duplicar Orçamento"
                    >
                      <Copy size={16} strokeWidth={2.5}/>
                    </button>
                    <div className="w-px h-4 bg-slate-200 mx-1 block" />
                    <button 
                      onClick={() => handleDelete(budget.id)}
                      className="p-2 hover:bg-white rounded-lg text-slate-400 hover:text-rose-600 transition-all shadow-sm"
                      title="Excluir Permanentemente"
                    >
                      <Trash2 size={16} strokeWidth={2.5}/>
                    </button>
                  </div>
                  <button 
                    onClick={() => onEdit(budget)}
                    className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center hover:bg-emerald-600 transition-all shadow-md shadow-slate-900/10 group-hover:shadow-emerald-500/20 group-hover:-translate-y-1 duration-300"
                  >
                    <ChevronRight size={20} strokeWidth={2.5}/>
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {sortedBudgets.length === 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-24 text-center space-y-4 bg-slate-50/50 rounded-[3rem] border-2 border-dashed border-slate-200"
          >
            <div className="w-20 h-20 bg-white rounded-[2rem] flex items-center justify-center text-slate-300 mx-auto shadow-sm border border-slate-100">
              <Search size={36} strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-lg font-bold text-slate-700">Nenhum orçamento listado.</p>
              <p className="text-sm font-medium text-slate-400 mt-1 max-w-sm mx-auto">Sua busca ou filtros não retornaram resultados. Tente limpar os filtros ou inicie um novo orçamento.</p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};
