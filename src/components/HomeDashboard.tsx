import React from 'react';
import { Calculator, Package, HandMetal, ClipboardList, Building2, Linkedin, Mail, Phone, ArrowRight } from 'lucide-react';

interface HomeDashboardProps {
  onNavigate: (view: 'calculator' | 'templates' | 'manual' | 'quotes' | 'clients') => void;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({ onNavigate }) => {
  const features = [
    {
      id: 'calculator',
      title: 'Calculadora',
      description: 'Gere preços automáticos para sacolas baseados em regras e margens reais.',
      icon: <Calculator size={28} strokeWidth={2} />,
      color: 'text-emerald-600',
      bg: 'bg-white',
      border: 'border-slate-200/60',
      iconBg: 'bg-emerald-50',
      shadowHover: 'hover:shadow-2xl hover:shadow-emerald-500/10 hover:border-emerald-300/50'
    },
    {
      id: 'manual',
      title: 'Orçamento Manual',
      description: 'Editor de orçamento livre para itens customizados ou componentes do catálogo.',
      icon: <HandMetal size={28} strokeWidth={2} />,
      color: 'text-indigo-600',
      bg: 'bg-white',
      border: 'border-slate-200/60',
      iconBg: 'bg-indigo-50',
      shadowHover: 'hover:shadow-2xl hover:shadow-indigo-500/10 hover:border-indigo-300/50'
    },
    {
      id: 'quotes',
      title: 'Meus Orçamentos',
      description: 'Gerencie seu histórico de orçamentos, filtre resultados e exporte para o Excel.',
      icon: <ClipboardList size={28} strokeWidth={2} />,
      color: 'text-sky-600',
      bg: 'bg-white',
      border: 'border-slate-200/60',
      iconBg: 'bg-sky-50',
      shadowHover: 'hover:shadow-2xl hover:shadow-sky-500/10 hover:border-sky-300/50'
    },
    {
      id: 'clients',
      title: 'Clientes',
      description: 'Cadastro de clientes e visão de todos os orçamentos atrelados a cada organização.',
      icon: <Building2 size={28} strokeWidth={2} />,
      color: 'text-rose-600',
      bg: 'bg-white',
      border: 'border-slate-200/60',
      iconBg: 'bg-rose-50',
      shadowHover: 'hover:shadow-2xl hover:shadow-rose-500/10 hover:border-rose-300/50'
    },
    {
      id: 'templates',
      title: 'Modelos Prontos',
      description: 'Acesse modelos de orçamento pré-configurados e agilize o seu atendimento.',
      icon: <Package size={28} strokeWidth={2} />,
      color: 'text-amber-600',
      bg: 'bg-white',
      border: 'border-slate-200/60',
      iconBg: 'bg-amber-50',
      shadowHover: 'hover:shadow-2xl hover:shadow-amber-500/10 hover:border-amber-300/50'
    }
  ] as const;

  return (
    <div className="max-w-[85rem] mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-24">
      {/* Hero Header */}
      <div className="text-center max-w-4xl mx-auto mb-20 space-y-8">
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-slate-900 tracking-tighter leading-[1.1] drop-shadow-sm">
          Orçamentos de Alta  <br className="hidden md:block"/> Performance com <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-emerald-400">SacolaPro</span>
        </h1>
        <p className="text-xl md:text-2xl text-slate-500 font-medium leading-relaxed max-w-3xl mx-auto">
          O sistema definitivo para orçamentos estruturados, cálculo inteligente de embalagens e controle robusto de clientes.
        </p>
      </div>

      {/* Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-32 md:px-4">
        {features.map((feature) => (
          <button
            key={feature.id}
            onClick={() => onNavigate(feature.id as any)}
            className={`relative flex flex-col items-start text-left p-6 md:p-10 rounded-[2.5rem] border transition-all duration-300 group shadow-sm hover:-translate-y-2 ${feature.bg} ${feature.border} ${feature.shadowHover}`}
          >
            <div className={`p-4 rounded-[1.25rem] inline-flex mb-8 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3 ${feature.iconBg} ${feature.color}`}>
              {feature.icon}
            </div>
            
            <h3 className="text-2xl font-bold text-slate-900 mb-4 tracking-tight">{feature.title}</h3>
            <p className="text-slate-500 leading-relaxed mb-10 flex-grow font-medium text-[15px]">
              {feature.description}
            </p>

            <div className={`flex items-center gap-2 font-bold transition-all duration-300 opacity-100 translate-x-0 md:opacity-0 md:-translate-x-4 md:group-hover:opacity-100 md:group-hover:translate-x-0 ${feature.color}`}>
              <span>Acessar Módulo</span>
              <ArrowRight size={18} strokeWidth={3} />
            </div>
          </button>
        ))}
      </div>

      {/* Footer */}
      <footer className="mt-auto py-12 border-t border-slate-200/60">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 md:px-8">
          <div className="space-y-1 text-center md:text-left">
            <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400">Design & Code</h4>
            <p className="text-lg font-black text-slate-900 tracking-tight">Victor Ruba</p>
          </div>
          <div className="flex flex-wrap items-center justify-center md:justify-end gap-3">
            <a 
              href="https://wa.me/5511972224120" 
              target="_blank" 
              rel="noopener noreferrer"
              className="px-5 py-2.5 bg-slate-50 border border-slate-200/60 hover:border-emerald-300/50 hover:bg-emerald-50 rounded-2xl flex items-center gap-2.5 transition-all duration-200 text-slate-600 hover:text-emerald-700 font-semibold text-sm shadow-sm hover:shadow-md"
            >
              <Phone size={16} />
              (11) 97222-4120
            </a>
            <a 
              href="mailto:victor.ruba@outlook.com" 
              className="px-5 py-2.5 bg-slate-50 border border-slate-200/60 hover:border-amber-300/50 hover:bg-amber-50 rounded-2xl flex items-center gap-2.5 transition-all duration-200 text-slate-600 hover:text-amber-700 font-semibold text-sm shadow-sm hover:shadow-md"
            >
              <Mail size={16} />
              victor.ruba@outlook.com
            </a>
            <a 
              href="https://www.linkedin.com/in/victor-ruba/?skipRedirect=true" 
              target="_blank" 
              rel="noopener noreferrer"
              className="px-5 py-2.5 bg-slate-50 border border-slate-200/60 hover:border-blue-300/50 hover:bg-blue-50 rounded-2xl flex items-center gap-2.5 transition-all duration-200 text-slate-600 hover:text-blue-700 font-semibold text-sm shadow-sm hover:shadow-md"
            >
              <Linkedin size={16} />
              LinkedIn
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};
