import React from 'react';
import { Calculator, Package, HandMetal, ClipboardList, Building2, Linkedin, Mail, Phone } from 'lucide-react';

interface HomeDashboardProps {
  onNavigate: (view: 'calculator' | 'templates' | 'manual' | 'quotes' | 'clients') => void;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({ onNavigate }) => {
  const features = [
    {
      id: 'calculator',
      title: 'Calculadora',
      description: 'Gere preços automáticos para sacolas baseados em regras e margens reais.',
      icon: <Calculator size={32} />,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      border: 'border-emerald-100',
      hover: 'hover:border-emerald-300 hover:shadow-emerald-100'
    },
    {
      id: 'templates',
      title: 'Modelos',
      description: 'Acesse modelos de orçamento pré-configurados e agilize o seu atendimento.',
      icon: <Package size={32} />,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      border: 'border-amber-100',
      hover: 'hover:border-amber-300 hover:shadow-amber-100'
    },
    {
      id: 'manual',
      title: 'Orçamento Manual',
      description: 'Editor de orçamento livre para itens manuais customizados ou componentes do catálogo.',
      icon: <HandMetal size={32} />,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
      border: 'border-indigo-100',
      hover: 'hover:border-indigo-300 hover:shadow-indigo-100'
    },
    {
      id: 'quotes',
      title: 'Meus Orçamentos',
      description: 'Gerencie seu histórico de orçamentos criados, copie textos ou gere PDFs.',
      icon: <ClipboardList size={32} />,
      color: 'text-sky-600',
      bg: 'bg-sky-50',
      border: 'border-sky-100',
      hover: 'hover:border-sky-300 hover:shadow-sky-100'
    },
    {
      id: 'clients',
      title: 'Clientes',
      description: 'Cadastro de clientes e visão de todos os orçamentos atrelados a cada organização.',
      icon: <Building2 size={32} />,
      color: 'text-rose-600',
      bg: 'bg-rose-50',
      border: 'border-rose-100',
      hover: 'hover:border-rose-300 hover:shadow-rose-100'
    }
  ] as const;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center max-w-2xl mx-auto mb-16">
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-4">
          Bem-vindo ao <span className="text-emerald-600">SacolaPro</span>
        </h1>
        <p className="text-lg text-slate-500 font-medium">
          Seu sistema completo para orçamentos, cálculo inteligente de embalagens e gestão de clientes.
          Escolha uma área abaixo para começar.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20 md:px-12">
        {features.map((feature) => (
          <button
            key={feature.id}
            onClick={() => onNavigate(feature.id as any)}
            className={`flex flex-col text-left p-8 rounded-3xl border transition-all duration-300 group shadow-sm hover:-translate-y-1 hover:shadow-xl ${feature.bg} ${feature.border} ${feature.hover}`}
          >
            <div className={`p-4 rounded-2xl bg-white shadow-sm inline-block mb-6 transition-transform group-hover:scale-110 ${feature.color}`}>
              {feature.icon}
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-3">{feature.title}</h3>
            <p className="text-sm font-medium text-slate-600 leading-relaxed">
              {feature.description}
            </p>
          </button>
        ))}
      </div>

      <footer className="mt-auto py-12 border-t border-slate-200">
        <div className="flex flex-col items-center justify-center text-center space-y-6">
          <div className="space-y-2">
            <h4 className="text-sm font-black uppercase tracking-widest text-slate-400">Desenvolvido por</h4>
            <p className="text-xl font-black text-slate-800">Victor Ruba</p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <a 
              href="https://wa.me/5511972224120" 
              target="_blank" 
              rel="noopener noreferrer"
              className="px-6 py-3 bg-white border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 rounded-2xl flex items-center gap-3 transition-colors text-slate-600 hover:text-emerald-700 font-bold text-sm"
            >
              <Phone size={18} />
              (11) 97222-4120
            </a>
            <a 
              href="mailto:victor.ruba@outlook.com" 
              className="px-6 py-3 bg-white border border-slate-200 hover:border-amber-300 hover:bg-amber-50 rounded-2xl flex items-center gap-3 transition-colors text-slate-600 hover:text-amber-700 font-bold text-sm"
            >
              <Mail size={18} />
              victor.ruba@outlook.com
            </a>
            <a 
              href="https://www.linkedin.com/in/victor-ruba/?skipRedirect=true" 
              target="_blank" 
              rel="noopener noreferrer"
              className="px-6 py-3 bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50 rounded-2xl flex items-center gap-3 transition-colors text-slate-600 hover:text-blue-700 font-bold text-sm"
            >
              <Linkedin size={18} />
              LinkedIn
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};
