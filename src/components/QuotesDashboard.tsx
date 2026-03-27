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
  XCircle
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

  const filteredBudgets = budgets.filter(b => {
    const matchesSearch = getClientName(b.clientId).toLowerCase().includes(searchTerm.toLowerCase()) || 
                         b.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || b.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

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
        
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Buscar por cliente ou ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none w-64 transition-all"
            />
          </div>
          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none appearance-none"
          >
            <option value="all">Todos os Status</option>
            <option value="draft">Rascunho</option>
            <option value="sent">Enviado</option>
            <option value="approved">Aprovado</option>
            <option value="lost">Perdido</option>
          </select>
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
