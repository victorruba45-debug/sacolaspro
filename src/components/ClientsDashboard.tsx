import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Pencil, 
  Trash2, 
  Phone, 
  Mail, 
  Building2, 
  ChevronRight,
  UserPlus,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { storage } from '../lib/storage';
import { Client, Budget } from '../types';

export const ClientsDashboard: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  // Form State
  const [formData, setFormData] = useState<Omit<Client, 'id' | 'createdAt'>>({
    name: '',
    company: '',
    phone: '',
    email: '',
    notes: ''
  });

  useEffect(() => {
    setClients(storage.getClients().sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
    setBudgets(storage.getBudgets());
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const client: Client = {
      ...formData,
      id: editingClient?.id || crypto.randomUUID(),
      createdAt: editingClient?.createdAt || new Date().toISOString()
    };
    storage.saveClient(client);
    setClients(storage.getClients().sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
    closeModal();
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este cliente?')) {
      storage.deleteClient(id);
      setClients(prev => prev.filter(c => c.id !== id));
    }
  };

  const openModal = (client?: Client) => {
    if (client) {
      setEditingClient(client);
      setFormData({
        name: client.name,
        company: client.company,
        phone: client.phone,
        email: client.email,
        notes: client.notes
      });
    } else {
      setEditingClient(null);
      setFormData({ name: '', company: '', phone: '', email: '', notes: '' });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingClient(null);
  };

  const getClientBudgets = (clientId: string) => {
    return budgets.filter(b => b.clientId === clientId);
  };

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.company.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 max-w-[85rem] mx-auto pb-12">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 border border-indigo-100/50 shadow-inner">
              <Users size={24} strokeWidth={2.5} />
            </div>
            Meus Clientes
          </h2>
          <p className="text-[15px] text-slate-500 font-medium mt-2 max-w-lg">Controle e centralize todos os contatos e mantenha o histórico de orçamentos mapeado com eficiência.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar por nome ou empresa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-72 pl-12 pr-4 py-3 bg-white border border-slate-200/60 shadow-sm rounded-2xl text-[15px] font-medium focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all placeholder:text-slate-400"
            />
          </div>
          <button 
            onClick={() => openModal()}
            className="w-full sm:w-auto px-6 py-3 bg-slate-900 text-white rounded-2xl text-[14px] font-semibold flex items-center justify-center gap-2 hover:bg-indigo-600 hover:shadow-lg hover:shadow-indigo-500/20 transition-all duration-300 group shrink-0"
          >
            <UserPlus size={18} className="group-hover:scale-110 transition-transform"/> 
            <span>Novo Cliente</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredClients.map((client) => {
            const clientBudgets = getClientBudgets(client.id);
            const totalValue = clientBudgets.reduce((s, b) => s + b.totalValue, 0);
            
            return (
              <motion.div
                key={client.id}
                layout
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="bg-white rounded-[2rem] border border-slate-200/60 p-6 md:p-8 hover:shadow-2xl hover:shadow-indigo-500/5 hover:-translate-y-1 hover:border-indigo-200/50 transition-all duration-300 group relative overflow-hidden"
              >
                {/* Decorative Accent */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl -mr-10 -mt-10 transition-all group-hover:bg-indigo-500/10 pointer-events-none"></div>

                <div className="absolute top-0 right-0 p-4 md:p-5 flex gap-1.5 opacity-100 md:opacity-0 group-hover:opacity-100 transition-all duration-300 bg-white/80 md:bg-transparent backdrop-blur-md md:backdrop-blur-none rounded-bl-3xl border-b border-l border-slate-100 md:border-transparent z-20">
                  <button 
                    onClick={() => openModal(client)}
                    className="p-3 md:p-2.5 bg-slate-50 border border-slate-100 text-slate-400 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 rounded-xl transition-all shadow-sm"
                    title="Editar Cliente"
                  >
                    <Pencil size={18} className="md:w-4 md:h-4" strokeWidth={2.5}/>
                  </button>
                  <button 
                    onClick={() => handleDelete(client.id)}
                    className="p-3 md:p-2.5 bg-slate-50 border border-slate-100 text-slate-400 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 rounded-xl transition-all shadow-sm"
                    title="Excluir Cliente"
                  >
                    <Trash2 size={18} className="md:w-4 md:h-4" strokeWidth={2.5} />
                  </button>
                </div>

                <div className="space-y-6 relative z-10 pt-8 md:pt-0">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5">
                    <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center font-black text-2xl shadow-inner shrink-0 group-hover:scale-105 transition-transform duration-300">
                      {client.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="pr-0 sm:pr-12">
                      <h3 className="text-xl font-bold text-slate-900 tracking-tight leading-tight truncate" title={client.name}>{client.name}</h3>
                      <p className="text-[13px] text-slate-500 font-medium flex items-center gap-1.5 mt-1 truncate">
                        <Building2 size={14} className="text-slate-400 shrink-0" /> <span className="truncate">{client.company || 'Pessoa Física'}</span>
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    {client.phone && (
                      <div className="flex items-center gap-3 text-slate-600">
                        <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0">
                          <Phone size={14} strokeWidth={2.5}/>
                        </div>
                        <span className="text-[13px] font-semibold">{client.phone}</span>
                      </div>
                    )}
                    {client.email && (
                      <div className="flex items-center gap-3 text-slate-600">
                        <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-500 flex items-center justify-center shrink-0">
                          <Mail size={14} strokeWidth={2.5}/>
                        </div>
                        <span className="text-[13px] font-semibold truncate" title={client.email}>{client.email}</span>
                      </div>
                    )}
                  </div>

                  <div className="h-px bg-slate-100" />

                  <div className="flex items-center justify-between bg-slate-50/50 rounded-2xl p-4 border border-slate-100/50">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Qtd. Orçamentos</p>
                      <p className="text-base font-black text-slate-700">{clientBudgets.length}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Ganhos Totais</p>
                      <p className="text-base font-black text-emerald-600">
                        R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {filteredClients.length === 0 && (
          <div className="md:col-span-2 lg:col-span-3 py-24 text-center space-y-4 bg-slate-50/50 rounded-[3rem] border-2 border-dashed border-slate-200">
            <div className="w-20 h-20 bg-white rounded-[2rem] border border-slate-100 flex items-center justify-center text-slate-300 mx-auto shadow-sm">
              <Users size={36} strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-lg font-bold text-slate-700">Nenhum cliente cadastrado.</p>
              <p className="text-sm font-medium text-slate-400 mt-1 max-w-sm mx-auto">Sua base de clientes está vazia ou a busca não retornou resultados. Cadastre um novo para começar.</p>
            </div>
          </div>
        )}
      </div>

      {/* Modal Cadastro/Edição */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModal}
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
                  <div className="w-12 h-12 bg-indigo-50 border border-indigo-100/50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-inner">
                    <UserPlus size={22} strokeWidth={2.5} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 tracking-tight text-xl">
                      {editingClient ? 'Editar Cliente' : 'Novo Cliente'}
                    </h3>
                    <p className="text-[12px] text-slate-500 font-medium">Preencha as informações de contato do cliente</p>
                  </div>
                </div>
                <button onClick={closeModal} className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-400 border border-slate-100 hover:text-slate-700 transition-all">
                  <X size={18} strokeWidth={2.5}/>
                </button>
              </div>

              <div className="overflow-y-auto p-8 custom-scrollbar">
                <form id="client-form" onSubmit={handleSave} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="md:col-span-2 space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-1">Nome Completo *</label>
                      <input 
                        required
                        type="text" 
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-3.5 bg-slate-50/50 border border-slate-200 rounded-2xl focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 outline-none text-[15px] font-medium transition-all"
                        placeholder="Ex: João Silva"
                      />
                    </div>
                    <div className="md:col-span-2 space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-1">Empresa</label>
                      <input 
                        type="text" 
                        value={formData.company}
                        onChange={e => setFormData({ ...formData, company: e.target.value })}
                        className="w-full px-4 py-3.5 bg-slate-50/50 border border-slate-200 rounded-2xl focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 outline-none text-[15px] font-medium transition-all"
                        placeholder="Ex: Sacolas LTDA"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-1">Telefone / WhatsApp</label>
                      <input 
                        type="text" 
                        value={formData.phone}
                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-4 py-3.5 bg-slate-50/50 border border-slate-200 rounded-2xl focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 outline-none text-[15px] font-medium transition-all"
                        placeholder="(00) 00000-0000"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-1">Email</label>
                      <input 
                        type="email" 
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-3.5 bg-slate-50/50 border border-slate-200 rounded-2xl focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 outline-none text-[15px] font-medium transition-all"
                        placeholder="contato@empresa.com"
                      />
                    </div>
                    <div className="md:col-span-2 space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-1">Observações</label>
                      <textarea 
                        value={formData.notes}
                        onChange={e => setFormData({ ...formData, notes: e.target.value })}
                        rows={3}
                        className="w-full px-4 py-3.5 bg-slate-50/50 border border-slate-200 rounded-2xl focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 outline-none text-[15px] font-medium transition-all resize-none"
                        placeholder="Alguma informação adicional..."
                      />
                    </div>
                  </div>
                </form>
              </div>

              <div className="px-8 py-6 border-t border-slate-100 bg-slate-50 shrink-0">
                <button 
                  type="submit"
                  form="client-form"
                  className="w-full py-4 bg-slate-900 text-white rounded-2xl font-semibold text-[15px] hover:bg-indigo-600 hover:shadow-lg hover:shadow-indigo-500/20 transition-all duration-300"
                >
                  {editingClient ? 'Salvar Alterações' : 'Cadastrar Cliente'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
