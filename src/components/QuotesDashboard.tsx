import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Plus, 
  Search, 
  Filter, 
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
  Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
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

  useEffect(() => {
    setBudgets(storage.getBudgets().sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()));
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
    // Reset times to start of day for fair comparison
    date.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (period === 'today') return diffDays <= 1; // includes today and yesterday technically based on timezone, but close enough
    if (period === 'week') return diffDays <= 7;
    if (period === 'month') return diffDays <= 30;
    return true;
  };

  const filteredBudgets = budgets.filter(b => {
    const matchesSearch = getClientName(b.clientId).toLowerCase().includes(searchTerm.toLowerCase()) || 
                         b.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || b.status === filterStatus;
    const matchesPeriod = isWithinPeriod(b.date, filterPeriod);
    return matchesSearch && matchesStatus && matchesPeriod;
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
    
    // Add BOM for Excel UTF-8 reading
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

  const statusMap = {
    draft: { label: 'Rascunho', color: 'bg-slate-100 text-slate-600', icon: <Clock size={12} /> },
    sent: { label: 'Enviado', color: 'bg-amber-100 text-amber-600', icon: <ExternalLink size={12} /> },
    approved: { label: 'Aprovado', color: 'bg-emerald-100 text-emerald-600', icon: <CheckCircle2 size={12} /> },
    lost: { label: 'Perdido', color: 'bg-rose-100 text-rose-600', icon: <XCircle size={12} /> },
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900">Meus Orçamentos</h2>
          <p className="text-sm text-slate-500 font-medium">Gerencie e acompanhe todos os seus orçamentos</p>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap md:flex-nowrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Buscar por cliente ou ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none w-full md:w-64 transition-all"
            />
          </div>
          <div className="flex items-center gap-2">
            <select 
              value={filterPeriod}
              onChange={(e) => setFilterPeriod(e.target.value)}
              className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none appearance-none font-bold text-slate-700"
            >
              <option value="all">Todo Período</option>
              <option value="today">Hoje</option>
              <option value="week">Últimos 7 dias</option>
              <option value="month">Últimos 30 dias</option>
            </select>
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none appearance-none font-bold text-slate-700"
            >
              <option value="all">Todos os Status</option>
              <option value="draft">Rascunho</option>
              <option value="sent">Enviado</option>
              <option value="approved">Aprovado</option>
              <option value="lost">Perdido</option>
            </select>
            <button
              onClick={exportToCsv}
              disabled={filteredBudgets.length === 0}
              className="p-2.5 bg-slate-900 text-white rounded-xl hover:bg-emerald-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed group flex items-center justify-center"
              title="Exportar para Excel (CSV)"
            >
              <Download size={18} className="group-hover:-translate-y-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-emerald-50 rounded-[2rem] p-6 border border-emerald-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm shrink-0">
            <DollarSign size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-800">Expectativa de Ganhos</p>
            <p className="text-2xl font-black text-emerald-700 tracking-tight">R$ {summary.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </div>
        </div>
        <div className="bg-white rounded-[2rem] p-6 border border-slate-200 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 shadow-sm shrink-0">
            <TrendingDown size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Custo Total Projetado</p>
            <p className="text-2xl font-black text-slate-700 tracking-tight">R$ {summary.totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </div>
        </div>
        <div className="bg-white rounded-[2rem] p-6 border border-slate-200 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 shadow-sm shrink-0">
            <FileText size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total de Orçamentos</p>
            <p className="text-2xl font-black text-slate-700 tracking-tight">{summary.count} / {summaryMargin.toFixed(1)}% margem</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <AnimatePresence mode="popLayout">
          {filteredBudgets.map((budget) => (
            <motion.div
              key={budget.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl border border-slate-200 p-6 hover:shadow-lg transition-all group"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400">
                    <FileText size={24} />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 flex items-center gap-2">
                      {getClientName(budget.clientId)}
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1 ${statusMap[budget.status].color}`}>
                        {statusMap[budget.status].icon} {statusMap[budget.status].label}
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                      {new Date(budget.date).toLocaleDateString('pt-BR')} · {budget.items.length} {budget.items.length === 1 ? 'item' : 'itens'} · ID: {budget.id.split('-')[0]}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-sm font-black text-slate-900">R$ {budget.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest">
                      {budget.margin.toFixed(1)}% margem
                    </p>
                  </div>

                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                    <button 
                      onClick={() => onEdit(budget)}
                      className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-900 transition-all"
                      title="Editar"
                    >
                      <Pencil size={18} />
                    </button>
                    <button 
                      onClick={() => handleDuplicate(budget.id)}
                      className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-900 transition-all"
                      title="Duplicar"
                    >
                      <Copy size={18} />
                    </button>
                    <button 
                      onClick={() => handleDelete(budget.id)}
                      className="p-2 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-600 transition-all"
                      title="Excluir"
                    >
                      <Trash2 size={18} />
                    </button>
                    <button 
                      onClick={() => onEdit(budget)}
                      className="ml-2 w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center hover:bg-emerald-700 transition-all shadow-md shadow-emerald-200"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredBudgets.length === 0 && (
          <div className="py-20 text-center space-y-4 bg-slate-50 rounded-[3rem] border border-dashed border-slate-200">
            <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center text-slate-300 mx-auto shadow-sm">
              <Search size={32} />
            </div>
            <div>
              <p className="text-slate-500 font-bold">Nenhum orçamento encontrado.</p>
              <p className="text-xs text-slate-400 mt-1">Tente ajustar seus filtros ou crie um novo orçamento.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
