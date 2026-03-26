/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Calculator, 
  Package, 
  Layers, 
  Maximize2, 
  Palette, 
  Sparkles, 
  Copy, 
  Check, 
  ChevronRight,
  ChevronDown,
  TrendingDown,
  Info,
  RotateCcw,
  Settings,
  Lock,
  Unlock,
  X,
  Save,
  HandMetal,
  FileText,
  Trash2,
  ImagePlus,
  Pencil,
  ChevronLeft,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { supabase } from './lib/supabase';
import { Auth } from './components/Auth';
import { ManualQuote } from './components/ManualQuote';
import { Session } from '@supabase/supabase-js';
import { BagCategory, BagType, QuoteConfig, CalculationResult, Recommendation, HandleType, BagPreset, MarketTemplate } from './types';
import { 
  BAG_TYPES as INITIAL_BAG_TYPES, 
  BAG_PRESETS as INITIAL_BAG_PRESETS,
  MARKET_TEMPLATES as INITIAL_MARKET_TEMPLATES,
  QUANTITY_MULTIPLIERS as INITIAL_QUANTITY_MULTIPLIERS, 
  COLOR_FACTORS as INITIAL_COLOR_FACTORS, 
  LAMINATION_FACTORS as INITIAL_LAMINATION_FACTORS, 
  HANDLE_TYPES as INITIAL_HANDLE_TYPES,
  MATERIAL_PRICING,
  PRINTING_BASE_PRICING,
  EXTRA_PRICING,
  SIZE_MULTIPLIERS as INITIAL_SIZE_MULTIPLIERS,
  TOOLTIPS,
  MATERIAL_COMPATIBILITY,
  PROFIT_MARGIN as INITIAL_PROFIT_MARGIN 
} from './constants';

const Tooltip = ({ text }: { text: string }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative inline-block ml-1 align-middle">
      <button
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        onClick={() => setIsOpen(!isOpen)}
        className="text-slate-400 hover:text-emerald-600 transition-colors"
      >
        <Info size={14} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            className="absolute z-[100] bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-slate-900 text-white text-[11px] leading-relaxed rounded-xl shadow-2xl border border-white/10 pointer-events-none"
          >
            {text}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-900" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const DEFAULT_CONFIG: QuoteConfig = {
  bagTypeId: INITIAL_BAG_TYPES[0].id,
  handleTypeId: INITIAL_HANDLE_TYPES[0].id,
  quantity: 500,
  width: 30,
  height: 40,
  side: 10,
  colors: '1',
  lamination: 'none',
  hasEyelet: false,
  hasBottomReinforcement: false,
  hasMouthReinforcement: false,
  isExclusiveDieCut: false,
  printingSides: 'front',
  bagColor: 'white',
};

const MockupPreview = ({ result, images, onClearImages }: { result: CalculationResult, images?: string[] | null, onClearImages?: () => void }) => {
  const { config: cfg, bagType } = result;
  const [activeIndex, setActiveIndex] = useState(0);
  
  // Base colors based on material
  const materialColors: Record<string, { bg: string, border: string, inner: string }> = {
    kraft: { bg: '#e5d3b3', border: '#c1a17b', inner: '#d2b48c' },
    duplex: { bg: '#ffffff', border: '#e2e8f0', inner: '#f8fafc' },
    triplex: { bg: '#ffffff', border: '#cbd5e1', inner: '#f1f5f9' },
    palhaco: { bg: '#f8fafc', border: '#e2e8f0', inner: '#f1f5f9' },
    camiseta: { bg: '#ffffff', border: '#e2e8f0', inner: '#f8fafc' },
    alca_fita: { bg: '#ffffff', border: '#cbd5e1', inner: '#f1f5f9' },
    ecologica: { bg: '#f1f0e8', border: '#dcd8cc', inner: '#e8e4d8' },
    tnt: { bg: '#f8fafc', border: '#cbd5e1', inner: '#e2e8f0' },
    algodao: { bg: '#eae6d9', border: '#dcd8cc', inner: '#d2b48c' },
  };

  const mat = materialColors[bagType.id] || materialColors.kraft;
  
  const bagColors: Record<string, string> = {
    white: '#f8fafc',
    kraft: '#e5d3b3',
    black: '#1a1a1a',
    cru: '#eae6d9',
  };

  const currentBg = cfg.bagColor ? bagColors[cfg.bagColor] : mat.bg;

  if (images && images.length > 0) {
    return (
      <div className="relative aspect-square bg-slate-100 rounded-[2rem] overflow-hidden border border-slate-100 group">
        <img 
          src={images[activeIndex]} 
          alt="Modelo Carregado" 
          className="w-full h-full object-cover"
        />
        {images.length > 1 && (
          <>
            <button 
              onClick={() => setActiveIndex(prev => (prev > 0 ? prev - 1 : images.length - 1))}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 backdrop-blur-sm rounded-full text-slate-900 shadow-lg opacity-0 group-hover:opacity-100 transition-all"
            >
              <ChevronLeft size={20} />
            </button>
            <button 
              onClick={() => setActiveIndex(prev => (prev < images.length - 1 ? prev + 1 : 0))}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 backdrop-blur-sm rounded-full text-slate-900 shadow-lg opacity-0 group-hover:opacity-100 transition-all"
            >
              <ChevronRight size={20} />
            </button>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
              {images.map((_, idx) => (
                <div 
                  key={idx} 
                  className={`w-1.5 h-1.5 rounded-full transition-all ${idx === activeIndex ? 'bg-emerald-600 w-4' : 'bg-slate-300'}`}
                />
              ))}
            </div>
          </>
        )}
        <div className="absolute top-6 left-6">
          <span className="px-3 py-1 bg-white/80 backdrop-blur-sm text-emerald-600 text-[9px] font-black uppercase tracking-widest rounded-full border border-emerald-100 shadow-sm">
            Modelo Carregado
          </span>
        </div>
        {onClearImages && (
          <button 
            onClick={onClearImages}
            className="absolute top-6 right-6 p-2 bg-white/80 backdrop-blur-sm rounded-full text-slate-400 hover:text-rose-500 transition-all shadow-sm"
            title="Ver Representação Técnica"
          >
            <X size={16} />
          </button>
        )}
      </div>
    );
  }

  // Scale based on size
  const scale = cfg.width / 40; 
  const hScale = cfg.height / 50;
  
  const width = 180 * scale;
  const height = 230 * hScale;

  // Colors for printing
  const printColor = cfg.colors === 'black' ? '#1a1a1a' : 
                    cfg.colors.startsWith('pantone') ? '#e11d48' : 
                    cfg.colors === '4' ? '#2563eb' : '#059669';

  const downloadMockup = () => {
    const svg = document.getElementById('bag-mockup');
    if (!svg) return;
    
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = 1024;
      canvas.height = 1024;
      if (ctx) {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        const scale = Math.min(800 / img.width, 800 / img.height);
        const x = (1024 - img.width * scale) / 2;
        const y = (1024 - img.height * scale) / 2;
        ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
        
        const link = document.createElement('a');
        link.download = `arte-tecnica-${bagType.id}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      }
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <div className="relative aspect-square bg-slate-50 rounded-[2rem] overflow-hidden border border-slate-100 group">
      <div className="absolute inset-0 flex items-center justify-center p-12">
        <svg 
          id="bag-mockup"
          viewBox="0 0 400 400" 
          className="w-full h-full"
        >
          <defs>
            <linearGradient id="flatGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.1)" />
              <stop offset="100%" stopColor="rgba(0,0,0,0.02)" />
            </linearGradient>
          </defs>

          {/* Shadow */}
          <ellipse cx="200" cy={200 + height/2 + 10} rx={width/2 + 10} ry="5" fill="rgba(0,0,0,0.05)" />

          {/* Bag Body (Simplified 2D) */}
          <path 
            d={`M ${200 - width/2} ${200 - height/2} L ${200 + width/2} ${200 - height/2} L ${200 + width/2 + 5} ${200 + height/2} L ${200 - width/2 - 5} ${200 + height/2} Z`}
            fill={currentBg}
            stroke={mat.border}
            strokeWidth="1.5"
          />
          
          {/* Subtle Overlay */}
          <path 
            d={`M ${200 - width/2} ${200 - height/2} L ${200 + width/2} ${200 - height/2} L ${200 + width/2 + 5} ${200 + height/2} L ${200 - width/2 - 5} ${200 + height/2} Z`}
            fill="url(#flatGrad)"
          />

          {/* Logo / Print (Professional Flat Style) */}
          <g transform={`translate(200, 200)`}>
            <rect 
              x={-width/4} 
              y={-width/4} 
              width={width/2} 
              height={width/2} 
              fill={printColor} 
              opacity="0.08" 
              rx="8"
            />
            <text 
              y="4" 
              textAnchor="middle" 
              fill={printColor} 
              className="font-black uppercase tracking-tighter"
              style={{ fontSize: width/9, opacity: 0.6 }}
            >
              SUA MARCA
            </text>
            {cfg.printingSides === 'both' && (
               <text 
               y={width/4 + 12} 
               textAnchor="middle" 
               fill={printColor} 
               className="font-bold uppercase opacity-30"
               style={{ fontSize: width/18 }}
             >
               Impressão 360°
             </text>
            )}
          </g>

          {/* Handles (Clean 2D) */}
          {cfg.handleTypeId !== 'none' && (
            <g>
              {cfg.handleTypeId === 'tnt_handle' || cfg.handleTypeId === 'algodao_handle' ? (
                <g>
                  <path 
                    d={`M ${200 - width/3} ${200 - height/2} L ${200 - width/3} ${200 - height/2 - 60} Q 200 ${200 - height/2 - 80} ${200 + width/3} ${200 - height/2 - 60} L ${200 + width/3} ${200 - height/2}`}
                    fill="none"
                    stroke={cfg.handleTypeId === 'tnt_handle' ? '#94a3b8' : '#d2b48c'}
                    strokeWidth="12"
                    strokeLinecap="round"
                  />
                </g>
              ) : cfg.handleTypeId === 'fita_soldada' ? (
                <g>
                   <rect x={200 - width/3 - 10} y={200 - height/2 - 10} width="20" height="40" fill="rgba(0,0,0,0.1)" rx="2" />
                   <rect x={200 + width/3 - 10} y={200 - height/2 - 10} width="20" height="40" fill="rgba(0,0,0,0.1)" rx="2" />
                   <path 
                    d={`M ${200 - width/3} ${200 - height/2} Q 200 ${200 - height/2 - 60} ${200 + width/3} ${200 - height/2}`}
                    fill="none"
                    stroke="rgba(0,0,0,0.2)"
                    strokeWidth="15"
                    strokeLinecap="round"
                  />
                </g>
              ) : (
                <path 
                  d={`M ${200 - width/3.5} ${200 - height/2} Q 200 ${200 - height/2 - (cfg.handleTypeId === 'paper' ? 50 : 70)} ${200 + width/3.5} ${200 - height/2}`}
                  fill="none"
                  stroke={cfg.handleTypeId === 'paper' ? mat.border : (cfg.handleTypeId === 'nylon' ? '#475569' : '#94a3b8')}
                  strokeWidth={cfg.handleTypeId === 'paper' ? "6" : "4"}
                  strokeLinecap="round"
                />
              )}
            </g>
          )}

          {/* Boca de Palhaço Hole */}
          {bagType.id === 'palhaco' && (
            <rect x={200 - 25} y={200 - height/2 + 20} width="50" height="15" rx="7.5" fill="rgba(0,0,0,0.1)" />
          )}

          {/* Camiseta Handles */}
          {bagType.id === 'camiseta' && (
            <g>
              <path d={`M ${200 - width/2} ${200 - height/2} L ${200 - width/2} ${200 - height/2 - 40} Q ${200 - width/2 + 15} ${200 - height/2 - 55} ${200 - width/2 + 30} ${200 - height/2 - 40} L ${200 - width/2 + 30} ${200 - height/2}`} fill={currentBg} stroke={mat.border} strokeWidth="1.5" />
              <path d={`M ${200 + width/2} ${200 - height/2} L ${200 + width/2} ${200 - height/2 - 40} Q ${200 + width/2 - 15} ${200 - height/2 - 55} ${200 + width/2 - 30} ${200 - height/2 - 40} L ${200 + width/2 - 30} ${200 - height/2}`} fill={currentBg} stroke={mat.border} strokeWidth="1.5" />
            </g>
          )}

          {/* Eyelets */}
          {cfg.hasEyelet && (
            <g>
              <circle cx={200 - width/3.5} cy={200 - height/2 + 12} r="4" fill="#94a3b8" />
              <circle cx={200 + width/3.5} cy={200 - height/2 + 12} r="4" fill="#94a3b8" />
            </g>
          )}
        </svg>
      </div>

      <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
        <button 
          onClick={downloadMockup}
          className="p-3 bg-white text-slate-900 rounded-full shadow-lg border border-slate-100 hover:bg-emerald-600 hover:text-white transition-all"
          title="Baixar Arte Técnica"
        >
          <Save size={18} />
        </button>
      </div>
      
      <div className="absolute top-6 left-6">
        <span className="px-3 py-1 bg-white/80 backdrop-blur-sm text-slate-500 text-[9px] font-bold uppercase tracking-widest rounded-full border border-slate-200">
          Representação Técnica 2D
        </span>
      </div>
    </div>
  );
};

const compressImage = (file: File, maxWidth = 600, quality = 0.6): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (maxWidth / width) * height;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
};

export default function App() {
  // Navigation State
  const [view, setView] = useState<'calculator' | 'templates' | 'manual'>('calculator');

  // Config State
  const [config, setConfig] = useState<QuoteConfig>(DEFAULT_CONFIG);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const [customQty, setCustomQty] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string>(INITIAL_BAG_PRESETS[2].id);
  const [previewAngle, setPreviewAngle] = useState<'front' | 'side' | 'perspective'>('front');

  // Admin State
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [showSticky, setShowSticky] = useState(false);
  const summaryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowSticky(!entry.isIntersecting);
      },
      { threshold: 0.1 }
    );
    if (summaryRef.current) observer.observe(summaryRef.current);
    return () => observer.disconnect();
  }, []);

  const scrollToSummary = () => {
    summaryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };
  const [savedModels, setSavedModels] = useState<MarketTemplate[]>([]);
  const [isSavingModel, setIsSavingModel] = useState(false);
  const [newModelName, setNewModelName] = useState('');
  const [newModelImages, setNewModelImages] = useState<string[]>([]);
  const [editingModelId, setEditingModelId] = useState<string | null>(null);
  const [editingConfig, setEditingConfig] = useState<QuoteConfig | null>(null);
  const [previewModel, setPreviewModel] = useState<MarketTemplate | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [loadedModelImages, setLoadedModelImages] = useState<string[] | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const isApplyingTemplateRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load system settings and saved models from Supabase
  useEffect(() => {
    if (!session) {
      setSavedModels([]);
      return;
    }

    const fetchData = async () => {
      // 1. Fetch System Settings
      const { data: settingsData, error: settingsError } = await supabase
        .from('system_settings')
        .select('*');

      if (!settingsError && settingsData) {
        const pricing = settingsData.find(s => s.key === 'pricing_config')?.value;
        if (pricing) {
          if (pricing.bagTypes) setBagTypes(pricing.bagTypes);
          if (pricing.handleTypes) setHandleTypes(pricing.handleTypes);
          if (pricing.bagPresets) setBagPresets(pricing.bagPresets);
          if (pricing.profitMargin) setProfitMargin(pricing.profitMargin);
        }
      }

      // 2. Fetch Saved Models
      const { data, error } = await supabase
        .from('saved_models')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error loading models:", error);
        return;
      }

      const mappedModels: MarketTemplate[] = data.map(m => ({
        id: m.id,
        title: m.title,
        description: m.description,
        config: m.config,
        imageHint: m.image_hint,
        customImage: m.custom_image,
        customImages: m.custom_images
      }));

      setSavedModels(mappedModels);
    };

    fetchData();
  }, [session]);

  // Clear loaded images if config changes manually
  useEffect(() => {
    if (isApplyingTemplateRef.current) {
      isApplyingTemplateRef.current = false;
      return;
    }
    setLoadedModelImages(null);
  }, [config]);



  const handleSaveModel = async () => {
    if (!newModelName.trim()) {
      setAlerts(prev => [...prev, "Por favor, dê um nome ao modelo."]);
      return;
    }

    setIsSaving(true);
    const modelToSave = {
      title: newModelName,
      description: editingModelId 
        ? undefined 
        : `Modelo personalizado salvo em ${new Date().toLocaleDateString()}`,
      config: editingConfig ? { ...editingConfig } : { ...config },
      image_hint: 'custom',
      custom_images: newModelImages,
      custom_image: newModelImages[0] || undefined,
      user_id: session?.user.id
    };

    try {
      if (editingModelId) {
        const { error } = await supabase
          .from('saved_models')
          .update(modelToSave)
          .eq('id', editingModelId);
        
        if (error) throw error;
        
        setSavedModels(prev => prev.map(m => m.id === editingModelId ? {
          ...m,
          title: modelToSave.title,
          customImages: modelToSave.custom_images,
          customImage: modelToSave.custom_image,
          config: modelToSave.config || m.config
        } : m));
        
        setAlerts(prev => [...prev, "Modelo atualizado com sucesso!"]);
      } else {
        const { data, error } = await supabase
          .from('saved_models')
          .insert(modelToSave)
          .select()
          .single();

        if (error) throw error;

        const newMarketModel: MarketTemplate = {
          id: data.id,
          title: data.title,
          description: data.description,
          config: data.config,
          imageHint: data.image_hint,
          customImages: data.custom_images,
          customImage: data.custom_image
        };

        setSavedModels(prev => [newMarketModel, ...prev]);
        setAlerts(prev => [...prev, "Modelo salvo com sucesso!"]);
      }
      setIsSavingModel(false);
      setEditingModelId(null);
      setEditingConfig(null);
      setNewModelName('');
      setNewModelImages([]);
    } catch (err: any) {
      console.error("Error saving model:", err);
      let errorMessage = err.message || "Verifique o tamanho das fotos ou sua conexão.";
      if (err.message === 'Failed to fetch') {
        errorMessage = "Bloqueio de Segurança: O domínio localhost:3000 precisa ser liberado no seu painel do Supabase (Authentication > URL Configuration > Site URL/Redirect URLs).";
      }
      setAlerts(prev => [...prev, `Erro ao salvar: ${errorMessage}`]);
    } finally {
      setIsSaving(false);
    }
  };

  const startEditing = (model: MarketTemplate) => {
    setEditingModelId(model.id);
    setNewModelName(model.title);
    setNewModelImages(model.customImages || (model.customImage ? [model.customImage] : []));
    setEditingConfig({ ...model.config });
    setIsSavingModel(true);
    setPreviewModel(null);
  };

  const closeSaveModal = () => {
    setIsSavingModel(false);
    setEditingModelId(null);
    setEditingConfig(null);
    setNewModelName('');
    setNewModelImages([]);
  };

  const handleDeleteModel = async (id: string) => {
    try {
      const { error } = await supabase
        .from('saved_models')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setSavedModels(prev => prev.filter(m => m.id !== id));
      setAlerts(prev => [...prev, "Modelo removido."]);
    } catch (err: any) {
      console.error("Error deleting model:", err);
      setAlerts(prev => [...prev, "Erro ao remover modelo."]);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach(async (file: File) => {
        try {
          const compressed = await compressImage(file);
          setNewModelImages(prev => [...prev, compressed]);
        } catch (err) {
          console.error("Error compressing image:", err);
          setAlerts(prev => [...prev, "Erro ao processar imagem."]);
        }
      });
    }
  };

  const removeImage = (index: number) => {
    setNewModelImages(prev => prev.filter((_, i) => i !== index));
  };

  const [isAdminSaving, setIsAdminSaving] = useState(false);
  const handleSaveAdminSettings = async () => {
    setIsAdminSaving(true);
    try {
      const configToSave = {
        bagTypes,
        handleTypes,
        bagPresets,
        profitMargin
      };

      const { error } = await supabase
        .from('system_settings')
        .upsert({ 
          key: 'pricing_config', 
          value: configToSave,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      setAlerts(prev => [...prev, "Configurações do sistema salvas com sucesso!"]);
      setIsAdminOpen(false);
    } catch (err: any) {
      console.error("Error saving system settings:", err);
      setAlerts(prev => [...prev, "Erro ao salvar configurações do sistema."]);
    } finally {
      setIsAdminSaving(false);
    }
  };


  // Editable Constants State
  const [bagTypes, setBagTypes] = useState<BagType[]>(INITIAL_BAG_TYPES);
  const [handleTypes, setHandleTypes] = useState<HandleType[]>(INITIAL_HANDLE_TYPES);
  const [bagPresets, setBagPresets] = useState<BagPreset[]>(INITIAL_BAG_PRESETS);
  const [marketTemplates, setMarketTemplates] = useState<MarketTemplate[]>(INITIAL_MARKET_TEMPLATES);
  const [profitMargin, setProfitMargin] = useState(INITIAL_PROFIT_MARGIN);
  const [alerts, setAlerts] = useState<string[]>([]);

  // Compatibility Logic
  useEffect(() => {
    const newAlerts: string[] = [];
    let updated = false;
    const newConfig = { ...config };
    const rules = MATERIAL_COMPATIBILITY[config.bagTypeId];

    if (!rules) return;

    // 1. Colors (Printing Colors)
    if (!rules.printColors.includes(newConfig.colors)) {
      newConfig.colors = rules.printColors[0] as any;
      updated = true;
      newAlerts.push(`Cores de impressão limitadas para este material.`);
    }

    // 2. Lamination (Finishes)
    if (newConfig.lamination !== 'none' && !rules.finishes.includes(newConfig.lamination)) {
      newConfig.lamination = 'none';
      updated = true;
      newAlerts.push(`Acabamento não disponível para este material.`);
    }

    // 3. Extras
    if (newConfig.hasEyelet && !rules.extras.includes('eyelet')) {
      newConfig.hasEyelet = false;
      updated = true;
      newAlerts.push(`Ilhós não disponível para este material.`);
    }
    if (newConfig.hasBottomReinforcement && !rules.extras.includes('bottom')) {
      newConfig.hasBottomReinforcement = false;
      updated = true;
      newAlerts.push(`Reforço de fundo não disponível para este material.`);
    }
    if (newConfig.hasMouthReinforcement && !rules.extras.includes('mouth')) {
      newConfig.hasMouthReinforcement = false;
      updated = true;
      newAlerts.push(`Reforço de boca não disponível para este material.`);
    }
    if (newConfig.isExclusiveDieCut && !rules.extras.includes('diecut')) {
      newConfig.isExclusiveDieCut = false;
      updated = true;
      newAlerts.push(`Faca exclusiva não disponível para este material.`);
    }

    // 4. Printing Sides
    if (newConfig.printingSides === 'both' && !rules.printing.includes('both')) {
      newConfig.printingSides = 'front';
      updated = true;
      newAlerts.push(`Impressão frente e verso não disponível para este material.`);
    }

    // 5. Handles (Specific rules)
    const isPaper = bagTypes.find(t => t.id === config.bagTypeId)?.category === BagCategory.PAPER;
    const cordaoHandles = ['nylon', 'cotton', 'gorgurao', 'ribbon', 'paper'];
    if (!isPaper && cordaoHandles.includes(newConfig.handleTypeId)) {
      newConfig.handleTypeId = 'none';
      updated = true;
      newAlerts.push(`Alças de cordão disponíveis apenas para sacolas de papel.`);
    }

    if (config.bagTypeId === 'algodao' && newConfig.handleTypeId !== 'algodao_handle') {
      newConfig.handleTypeId = 'algodao_handle';
      updated = true;
      newAlerts.push(`Algodão Cru exige alça de algodão costurada.`);
    }
    
    if (config.bagTypeId === 'tnt' && !['none', 'tnt_handle'].includes(newConfig.handleTypeId)) {
      newConfig.handleTypeId = 'tnt_handle';
      updated = true;
      newAlerts.push(`TNT exige alça de TNT ou sem alça.`);
    }

    if (config.bagTypeId === 'alca_fita' && newConfig.handleTypeId !== 'fita_soldada') {
      newConfig.handleTypeId = 'fita_soldada';
      updated = true;
      newAlerts.push(`Alça Fita exige alça plástica soldada.`);
    }

    if (config.bagTypeId === 'camiseta' && newConfig.handleTypeId !== 'none') {
      newConfig.handleTypeId = 'none';
      updated = true;
      newAlerts.push(`Alça camiseta não permite alças adicionais.`);
    }

    if (updated) {
      setConfig(newConfig);
      setAlerts(prev => [...prev, ...newAlerts].slice(-3)); // Keep last 3 alerts
      setTimeout(() => setAlerts([]), 5000); // Clear alerts after 5s
    }
  }, [config.bagTypeId, config.handleTypeId, config.colors, config.lamination, config.hasEyelet, config.hasMouthReinforcement, config.printingSides, config.isExclusiveDieCut]);

  const resetConfig = () => {
    setConfig(DEFAULT_CONFIG);
    setSelectedPreset('custom');
    setCustomQty('');
  };

  const applyPreset = (preset: BagPreset) => {
    setSelectedPreset(preset.id);
    setConfig(prev => ({
      ...prev,
      width: preset.width,
      height: preset.height,
      side: preset.side
    }));
  };

  const applyMarketTemplate = (template: MarketTemplate) => {
    isApplyingTemplateRef.current = true;
    setConfig(template.config);
    setLoadedModelImages(template.customImages || (template.customImage ? [template.customImage] : null));
    setSelectedPreset('custom'); // Or find matching preset
    setView('calculator');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const calculatePrice = (cfg: QuoteConfig): CalculationResult => {
    const bagType = bagTypes.find(t => t.id === cfg.bagTypeId) || bagTypes[0];
    const handleType = handleTypes.find(h => h.id === cfg.handleTypeId) || handleTypes[0];
    
    const getTier = (qty: number) => {
      if (qty >= 5000) return 5000;
      if (qty >= 2000) return 2000;
      if (qty >= 1000) return 1000;
      return 500;
    };

    const tier = getTier(cfg.quantity);
    
    // 1. Custo Material (Base Tier + Custom Admin Base Price)
    let materialCostPerUnit = MATERIAL_PRICING[bagType.id]?.[tier] || 0;
    let baseOffset = bagType.basePrice || 0;
    let materialCost = materialCostPerUnit + baseOffset;

    // Multiplicador de Tamanho
    let sizeMultiplier = 1.0;
    if (selectedPreset === 'p') sizeMultiplier = INITIAL_SIZE_MULTIPLIERS.p;
    else if (selectedPreset === 'm') sizeMultiplier = INITIAL_SIZE_MULTIPLIERS.m;
    else if (selectedPreset === 'g') sizeMultiplier = INITIAL_SIZE_MULTIPLIERS.g;
    else {
      // Custom Size Formula
      const areaTotal = cfg.width * cfg.height * 0.001 + cfg.side * 0.0004;
      const areaMPadrao = 30 * 40 * 0.001 + 12 * 0.0004;
      sizeMultiplier = areaTotal / areaMPadrao;
    }

    materialCost *= sizeMultiplier;
    
    // 2. Custo Impressão
    const printingBase = PRINTING_BASE_PRICING[tier] || 0;
    const printingSidesFactor = cfg.printingSides === 'both' ? 1.6 : 1.0;
    let printingCost = printingBase * printingSidesFactor;

    // 3. Base Unit Cost (incl. Handle Price from Admin)
    const handleCost = handleType.price || 0;
    let unitCost = materialCost + printingCost + handleCost;

    // 4. Multiplicadores (Cores e Acabamento)
    const colorFactor = INITIAL_COLOR_FACTORS[cfg.colors] || 1.0;
    const laminationFactor = INITIAL_LAMINATION_FACTORS[cfg.lamination] || 1.0;
    
    unitCost *= colorFactor;
    unitCost *= laminationFactor;

    // 5. Extras
    const eyeletCost = cfg.hasEyelet ? (EXTRA_PRICING.eyelet[tier] || 0) : 0;
    const bottomCost = cfg.hasBottomReinforcement ? (EXTRA_PRICING.bottom[tier] || 0) : 0;
    const mouthCost = cfg.hasMouthReinforcement ? (EXTRA_PRICING.mouth[tier] || 0) : 0;
    const extrasCost = eyeletCost + bottomCost + mouthCost;

    // 6. Faca Exclusiva
    const dieCutCost = cfg.isExclusiveDieCut ? (350 / cfg.quantity) : 0;

    // 7. Preço Final
    const totalUnitCost = unitCost + extrasCost + dieCutCost;
    const unitPrice = totalUnitCost * profitMargin;
    const totalPrice = unitPrice * cfg.quantity;

    return {
      unitPrice,
      totalPrice,
      config: cfg,
      bagType,
      handleType,
      costs: {
        material: materialCost,
        printing: printingCost,
        extras: extrasCost,
        dieCut: dieCutCost
      }
    };
  };

  const currentResult = useMemo(() => calculatePrice(config), [config, bagTypes, handleTypes, profitMargin]);

  const productInsight = useMemo(() => {
    const { bagType, config: cfg } = currentResult;
    let score = 0;
    
    if (bagType.id === 'triplex' || bagType.id === 'ecologica') score += 3;
    if (cfg.lamination === 'uv' || cfg.lamination === 'matte') score += 2;
    if (cfg.colors === '4') score += 2;
    if (cfg.handleTypeId === 'ribbon' || cfg.handleTypeId === 'cotton') score += 2;

    if (score >= 6) return { label: 'Produto de Luxo', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', icon: <Sparkles size={16} /> };
    if (score >= 3) return { label: 'Equilibrado / Premium', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', icon: <Info size={16} /> };
    return { label: 'Custo-Benefício', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: <TrendingDown size={16} /> };
  }, [currentResult]);

  const usageRecommendation = useMemo(() => {
    if (config.bagTypeId === 'vinho' || selectedPreset === 'vinho') return "Ideal para Garrafas de Vinho e Bebidas";
    if (config.bagTypeId === 'camiseta') return "Ideal para Supermercados, Padarias e Varejo";
    if (config.bagTypeId === 'palhaco') return "Ideal para Lojas de Roupas, Acessórios e Eventos";
    if (config.bagTypeId === 'triplex') return "Ideal para Boutiques, Cosméticos e Marcas de Luxo";
    if (selectedPreset === 'pp') return "Ideal para Joias, Relógios e Pequenos Brindes";
    if (config.bagTypeId === 'kraft') return "Ideal para Delivery, Lojas Rústicas e Brindes";
    return "Uso Geral: Comércio e Eventos";
  }, [config, selectedPreset]);

  const recommendations = useMemo(() => {
    const recs: Recommendation[] = [];
    const basicConfig: QuoteConfig = { ...config, colors: '1', lamination: 'none', handleTypeId: 'none' };
    const basicResult = calculatePrice(basicConfig);

    if (currentResult.unitPrice > 1.20 * basicResult.unitPrice) {
      if (config.colors !== '1' && config.colors !== 'black') {
        const alt = { ...config, colors: '1' as const };
        const res = calculatePrice(alt);
        recs.push({ label: 'Trocar para 1 cor', price: res.unitPrice, diff: currentResult.unitPrice - res.unitPrice, config: alt });
      }
      if (config.lamination === 'uv' || config.lamination === 'matte') {
        const alt = { ...config, lamination: 'gloss' as const };
        const res = calculatePrice(alt);
        recs.push({ label: 'Usar laminação Brilho', price: res.unitPrice, diff: currentResult.unitPrice - res.unitPrice, config: alt });
      }
      if (config.handleTypeId !== 'none' && config.handleTypeId !== 'paper') {
        const alt = { ...config, handleTypeId: 'paper' };
        const res = calculatePrice(alt);
        recs.push({ label: 'Usar Alça de Papel', price: res.unitPrice, diff: currentResult.unitPrice - res.unitPrice, config: alt });
      }
      if (config.isExclusiveDieCut) {
        const alt = { ...config, isExclusiveDieCut: false };
        const res = calculatePrice(alt);
        recs.push({ label: 'Usar Faca Existente', price: res.unitPrice, diff: currentResult.unitPrice - res.unitPrice, config: alt });
      }
    }
    return recs.sort((a, b) => b.diff - a.diff).slice(0, 3);
  }, [currentResult, config, bagTypes, handleTypes, profitMargin]);



  const generateQuoteText = () => {
    const { 
      bagType, 
      handleType, 
      config: cfg, 
      unitPrice, 
      totalPrice,
    } = currentResult;
    const sizeLabel = selectedPreset === 'custom' ? 'Personalizado' : selectedPreset.toUpperCase();
    const colorLabel = cfg.colors === 'black' ? 'Preto (Mono)' : 
                      cfg.colors.startsWith('pantone') ? `Pantone (${cfg.pantoneCode || 'Não informado'})` : 
                      cfg.colors + ' cor(es)';

    return `
ORÇAMENTO DE SACOLAS PERSONALIZADAS
-----------------------------------
RESUMO TÉCNICO:
- Tipo: ${bagType.category}
- Material: ${bagType.name}
- Alça: ${handleType.name}
- Tamanho: ${sizeLabel} (${cfg.width}x${cfg.height}x${cfg.side} cm)
- Cores: ${colorLabel}
- Impressão: ${cfg.printingSides === 'both' ? 'Frente e Verso' : 'Apenas Frente'}
- Acabamento: ${cfg.lamination === 'none' ? 'Nenhuma' : cfg.lamination.toUpperCase()}
- Extras: ${[
      cfg.hasEyelet ? 'Ilhós' : null,
      cfg.hasBottomReinforcement ? 'Reforço Fundo' : null,
      cfg.hasMouthReinforcement ? 'Reforço Boca' : null,
      cfg.isExclusiveDieCut ? 'Faca Exclusiva' : null
    ].filter(Boolean).join(', ') || 'Nenhum'}
- Quantidade: ${cfg.quantity} unidades

VALORES:
- Preço Unitário: R$ ${unitPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
- Preço Total: R$ ${totalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}

PRAZOS E VALIDADE:
- Prazo de Produção: 15 a 20 dias úteis
- Validade do Orçamento: 7 dias
-----------------------------------
Gerado por SacolaPro
    `.trim();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generateQuoteText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const generatePDF = async () => {
    const doc = new jsPDF();
    const { bagType, handleType, config: cfg, unitPrice, totalPrice } = currentResult;
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(16, 185, 129); // Emerald 600
    doc.text('SacolaPro - Orçamento', 20, 20);
    
    doc.setFontSize(12);
    doc.setTextColor(100, 116, 139); // Slate 500
    doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 20, 30);
    doc.text('------------------------------------------------------------', 20, 35);
    
    // Technical Details
    doc.setFontSize(14);
    doc.setTextColor(30, 41, 59); // Slate 800
    doc.text('RESUMO TÉCNICO', 20, 45);
    
    doc.setFontSize(11);
    doc.text(`- Tipo: ${bagType.category}`, 25, 55);
    doc.text(`- Material: ${bagType.name}`, 25, 62);
    doc.text(`- Alça: ${handleType.name}`, 25, 69);
    doc.text(`- Tamanho: ${selectedPreset === 'custom' ? 'Personalizado' : selectedPreset.toUpperCase()} (${cfg.width}x${cfg.height}x${cfg.side} cm)`, 25, 76);
    
    const colorLabel = cfg.colors === 'black' ? 'Preto (Mono)' : 
                      cfg.colors.startsWith('pantone') ? `Pantone (${cfg.pantoneCode || 'Não informado'})` : 
                      cfg.colors + ' cor(es)';
    doc.text(`- Cores: ${colorLabel}`, 25, 83);
    doc.text(`- Impressão: ${cfg.printingSides === 'both' ? 'Frente e Verso' : 'Apenas Frente'}`, 25, 90);
    doc.text(`- Acabamento: ${cfg.lamination === 'none' ? 'Nenhuma' : cfg.lamination.toUpperCase()}`, 25, 97);
    
    const extras = [
      cfg.hasEyelet ? 'Ilhós' : null,
      cfg.hasBottomReinforcement ? 'Reforço Fundo' : null,
      cfg.hasMouthReinforcement ? 'Reforço Boca' : null,
      cfg.isExclusiveDieCut ? 'Faca Exclusiva' : null
    ].filter(Boolean).join(', ') || 'Nenhum';
    doc.text(`- Extras: ${extras}`, 25, 104);
    doc.text(`- Quantidade: ${cfg.quantity} unidades`, 25, 111);
    
    // Values
    doc.text('------------------------------------------------------------', 20, 120);
    doc.setFontSize(14);
    doc.text('VALORES', 20, 130);
    
    doc.setFontSize(12);
    doc.text(`Preço Unitário: R$ ${unitPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 25, 140);
    doc.setFontSize(16);
    doc.setTextColor(16, 185, 129);
    doc.text(`TOTAL DO LOTE: R$ ${totalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 25, 150);
    
    // Footer
    doc.setFontSize(10);
    doc.setTextColor(148, 163, 184); // Slate 400
    doc.text('Prazo de Produção: 15 a 20 dias úteis', 20, 170);
    doc.text('Validade do Orçamento: 7 dias', 20, 177);
    doc.text('Gerado automaticamente por SacolaPro', 20, 184);

    doc.save(`orcamento-sacolapro-${bagType.id}.pdf`);
  };

  if (!session) {
    return <Auth />;
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-emerald-100 selection:text-emerald-900 text-slate-900">
      {/* Save Model Modal */}
      <AnimatePresence>
        {isSavingModel && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600">
                    <Save size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                      {editingModelId ? 'Editar Modelo' : 'Salvar Modelo'}
                    </h3>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">
                      {editingModelId ? 'Atualize os detalhes do seu template' : 'Personalize seu template'}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={closeSaveModal}
                  className="p-2 hover:bg-slate-200 rounded-full transition-colors"
                >
                  <X size={20} className="text-slate-400" />
                </button>
              </div>

              <div className="p-8 space-y-8 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome do Modelo</label>
                      <input 
                        type="text"
                        autoFocus
                        placeholder="Ex: Sacola Kraft Natal 2024"
                        value={newModelName}
                        onChange={(e) => setNewModelName(e.target.value)}
                        className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-bold text-slate-700"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Fotos do Modelo ({newModelImages.length})</label>
                      <div className="grid grid-cols-2 gap-3">
                        {newModelImages.map((img, idx) => (
                          <div key={idx} className="aspect-square rounded-2xl overflow-hidden relative group border border-slate-100">
                            <img src={img} alt={`Preview ${idx}`} className="w-full h-full object-cover" />
                            <button 
                              onClick={() => removeImage(idx)}
                              className="absolute top-2 right-2 p-1.5 bg-rose-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X size={12} />
                            </button>
                            {idx === 0 && (
                              <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-emerald-500 text-white text-[8px] font-black uppercase tracking-widest rounded-full">
                                Capa
                              </div>
                            )}
                          </div>
                        ))}
                        <button 
                          onClick={() => fileInputRef.current?.click()}
                          className="aspect-square rounded-2xl border-2 border-dashed border-slate-200 hover:border-emerald-500 bg-slate-50 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all"
                        >
                          <ImagePlus size={20} className="text-slate-400" />
                          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Adicionar</span>
                        </button>
                      </div>
                      <input 
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageUpload}
                        accept="image/*"
                        multiple
                        className="hidden"
                      />
                    </div>
                  </div>

                  <div className="space-y-6 bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                      <Settings size={14} className="text-emerald-600" /> Configuração Técnica
                    </h4>
                    
                    {editingConfig && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-3">
                          <div className="space-y-1">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Largura</label>
                            <input 
                              type="number"
                              value={editingConfig.width}
                              onChange={(e) => setEditingConfig({ ...editingConfig, width: Number(e.target.value) })}
                              className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold text-xs"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Altura</label>
                            <input 
                              type="number"
                              value={editingConfig.height}
                              onChange={(e) => setEditingConfig({ ...editingConfig, height: Number(e.target.value) })}
                              className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold text-xs"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Lateral</label>
                            <input 
                              type="number"
                              value={editingConfig.side}
                              onChange={(e) => setEditingConfig({ ...editingConfig, side: Number(e.target.value) })}
                              className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold text-xs"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Quantidade</label>
                          <input 
                            type="number"
                            value={editingConfig.quantity}
                            onChange={(e) => setEditingConfig({ ...editingConfig, quantity: Number(e.target.value) })}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold text-xs"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Cores</label>
                          <select 
                            value={editingConfig.colors}
                            onChange={(e) => setEditingConfig({ ...editingConfig, colors: e.target.value as any })}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold text-xs"
                          >
                            <option value="black">Preto (Mono)</option>
                            <option value="1">1 Cor</option>
                            <option value="2">2 Cores</option>
                            <option value="3">3 Cores</option>
                            <option value="4">4 Cores (Policromia)</option>
                            <option value="pantone1">1 Pantone</option>
                            <option value="pantone2">2 Pantones</option>
                          </select>
                        </div>
                      </div>
                    )}
                    {!editingConfig && (
                      <div className="text-center py-8">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Configuração atual será salva</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-3 flex-shrink-0">
                <button 
                  onClick={closeSaveModal}
                  className="flex-1 py-4 bg-white text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-100 border border-slate-200 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleSaveModel}
                  disabled={isSaving}
                  className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Salvando...
                    </>
                  ) : (
                    editingModelId ? 'Atualizar Modelo' : 'Salvar Agora'
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Preview Model Modal */}
      <AnimatePresence>
        {previewModel && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]"
            >
              <div className="flex-1 bg-slate-100 relative group overflow-hidden">
                {previewModel.customImages && previewModel.customImages.length > 0 ? (
                  <>
                    <img 
                      src={previewModel.customImages[activeImageIndex]} 
                      alt={previewModel.title} 
                      className="w-full h-full object-contain"
                    />
                    {previewModel.customImages.length > 1 && (
                      <>
                        <button 
                          onClick={() => setActiveImageIndex(prev => (prev > 0 ? prev - 1 : previewModel.customImages!.length - 1))}
                          className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/80 backdrop-blur-sm rounded-full text-slate-900 shadow-lg opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <ChevronLeft size={24} />
                        </button>
                        <button 
                          onClick={() => setActiveImageIndex(prev => (prev < previewModel.customImages!.length - 1 ? prev + 1 : 0))}
                          className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/80 backdrop-blur-sm rounded-full text-slate-900 shadow-lg opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <ChevronRight size={24} />
                        </button>
                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                          {previewModel.customImages.map((_, idx) => (
                            <div 
                              key={idx} 
                              className={`w-2 h-2 rounded-full transition-all ${idx === activeImageIndex ? 'bg-emerald-600 w-6' : 'bg-slate-300'}`}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package size={100} className="text-slate-300" />
                  </div>
                )}
                <button 
                  onClick={() => setPreviewModel(null)}
                  className="absolute top-6 left-6 p-3 bg-white/80 backdrop-blur-sm rounded-full text-slate-900 shadow-lg md:hidden"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="w-full md:w-80 p-8 flex flex-col justify-between bg-white">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-black text-slate-900">{previewModel.title}</h3>
                    <button 
                      onClick={() => setPreviewModel(null)}
                      className="p-2 hover:bg-slate-100 rounded-full transition-colors hidden md:block"
                    >
                      <X size={24} className="text-slate-400" />
                    </button>
                  </div>
                  
                  <p className="text-slate-500 font-medium leading-relaxed">{previewModel.description}</p>

                  <div className="space-y-4 pt-4 border-t border-slate-100">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Especificações</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-50 p-3 rounded-2xl">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Tamanho</p>
                        <p className="text-sm font-black text-slate-700">{previewModel.config.width}x{previewModel.config.height}x{previewModel.config.side} cm</p>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-2xl">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Quantidade</p>
                        <p className="text-sm font-black text-slate-700">{previewModel.config.quantity} un</p>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-2xl">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Cores</p>
                        <p className="text-sm font-black text-slate-700">{previewModel.config.colors} cor(es)</p>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-2xl">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Acabamento</p>
                        <p className="text-sm font-black text-slate-700 uppercase">{previewModel.config.lamination}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-8 space-y-3">
                  <button 
                    onClick={() => {
                      applyMarketTemplate(previewModel);
                      setPreviewModel(null);
                    }}
                    className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2"
                  >
                    Carregar Configuração <ChevronRight size={16} />
                  </button>
                  <button 
                    onClick={() => startEditing(previewModel)}
                    className="w-full py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
                  >
                    Editar Modelo <Pencil size={14} />
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Admin Modal */}
      <AnimatePresence>
        {isAdminOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-white">
                    <Settings size={20} />
                  </div>
                  <div>
                    <h2 className="font-bold text-lg">Painel Administrativo</h2>
                    <p className="text-xs text-slate-500 font-medium">Configuração de valores e materiais</p>
                  </div>
                </div>
                <button onClick={() => setIsAdminOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                {!!!session ? (
                  <div className="max-w-xs mx-auto py-12 text-center space-y-4">
                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
                      <Lock size={20} />
                    </div>
                    <p className="text-sm text-slate-500 font-bold uppercase tracking-widest">Acesso Restrito</p>
                    <p className="text-xs text-slate-400">Faça login para gerenciar as configurações do sistema.</p>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {/* Bag Types Config */}
                    <div className="space-y-4">
                      <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <Package size={18} className="text-slate-400" /> Preços Base de Sacolas
                      </h3>
                      <div className="grid grid-cols-1 gap-3">
                        {bagTypes.map((type, idx) => (
                          <div key={type.id} className="flex items-center gap-4 p-4 rounded-2xl border border-slate-100 bg-slate-50/50">
                            <div className="flex-1">
                              <span className="text-xs font-bold text-slate-400 uppercase">{type.category}</span>
                              <p className="font-bold text-sm">{type.name}</p>
                            </div>
                            <div className="w-32">
                              <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Preço Base</span>
                              <input 
                                type="number" 
                                value={type.basePrice}
                                step="0.01"
                                onChange={(e) => {
                                  const newTypes = [...bagTypes];
                                  newTypes[idx].basePrice = Number(e.target.value);
                                  setBagTypes(newTypes);
                                }}
                                className="w-full px-2 py-1 rounded border border-slate-200 text-sm font-bold"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Handle Types Config */}
                    <div className="space-y-4">
                      <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <HandMetal size={18} className="text-slate-400" /> Preços de Alças
                      </h3>
                      <div className="grid grid-cols-1 gap-3">
                        {handleTypes.map((handle, idx) => (
                          <div key={handle.id} className="flex items-center gap-4 p-4 rounded-2xl border border-slate-100 bg-slate-50/50">
                            <div className="flex-1">
                              <p className="font-bold text-sm">{handle.name}</p>
                            </div>
                            <div className="w-32">
                              <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Preço Unit.</span>
                              <input 
                                type="number" 
                                value={handle.price}
                                step="0.01"
                                onChange={(e) => {
                                  const newHandles = [...handleTypes];
                                  newHandles[idx].price = Number(e.target.value);
                                  setHandleTypes(newHandles);
                                }}
                                className="w-full px-2 py-1 rounded border border-slate-200 text-sm font-bold"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Presets Management */}
                    <div className="space-y-4">
                      <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <Maximize2 size={18} className="text-slate-400" /> Tamanhos Padrão (Presets)
                      </h3>
                      <div className="grid grid-cols-1 gap-3">
                        {bagPresets.map((preset, idx) => (
                          <div key={preset.id} className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-4 rounded-2xl border border-slate-100 bg-slate-50/50">
                            <div className="sm:col-span-1">
                              <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Nome</span>
                              <p className="font-bold text-sm truncate">{preset.name}</p>
                            </div>
                            <div className="grid grid-cols-3 gap-2 sm:col-span-3">
                              <div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Largura</span>
                                <input 
                                  type="number" 
                                  value={preset.width}
                                  onChange={(e) => {
                                    const newPresets = [...bagPresets];
                                    newPresets[idx].width = Number(e.target.value);
                                    setBagPresets(newPresets);
                                  }}
                                  className="w-full px-2 py-1 rounded border border-slate-200 text-sm font-bold"
                                />
                              </div>
                              <div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Altura</span>
                                <input 
                                  type="number" 
                                  value={preset.height}
                                  onChange={(e) => {
                                    const newPresets = [...bagPresets];
                                    newPresets[idx].height = Number(e.target.value);
                                    setBagPresets(newPresets);
                                  }}
                                  className="w-full px-2 py-1 rounded border border-slate-200 text-sm font-bold"
                                />
                              </div>
                              <div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Lateral</span>
                                <input 
                                  type="number" 
                                  value={preset.side}
                                  onChange={(e) => {
                                    const newPresets = [...bagPresets];
                                    newPresets[idx].side = Number(e.target.value);
                                    setBagPresets(newPresets);
                                  }}
                                  className="w-full px-2 py-1 rounded border border-slate-200 text-sm font-bold"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-emerald-800">Margem de Lucro Global</h4>
                        <p className="text-xs text-emerald-600">Multiplicador aplicado sobre o custo final</p>
                      </div>
                      <input 
                        type="number" 
                        value={profitMargin}
                        step="0.05"
                        onChange={(e) => setProfitMargin(Number(e.target.value))}
                        className="w-24 px-3 py-2 rounded-xl border border-emerald-200 text-center font-bold text-emerald-800"
                      />
                    </div>
                  </div>
                )}
              </div>

              {!!session && (
                <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end">
                  <button 
                    onClick={handleSaveAdminSettings}
                    disabled={isAdminSaving}
                    className="bg-slate-800 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-900 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isAdminSaving ? (
                      <>
                        <Loader2 size={18} className="animate-spin" /> Salvando...
                      </>
                    ) : (
                      <>
                        <Save size={18} /> Salvar Alterações
                      </>
                    )}
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white">
              <Package size={20} />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-800">Sacola<span className="text-emerald-600">Pro</span></h1>
          </div>
          
          <nav className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 overflow-x-auto no-scrollbar max-w-[200px] xs:max-w-[250px] sm:max-w-none mx-2">
            <button 
              onClick={() => setView('calculator')}
              className={`px-3 sm:px-4 py-1.5 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                view === 'calculator' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Calculadora
            </button>
            <button 
              onClick={() => setView('templates')}
              className={`px-3 sm:px-4 py-1.5 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                view === 'templates' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Modelos
            </button>
            <button 
              onClick={() => setView('manual')}
              className={`px-3 sm:px-4 py-1.5 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                view === 'manual' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Manual
            </button>
          </nav>

          <div className="flex items-center gap-3">
            <button 
              onClick={resetConfig}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all flex items-center gap-2 text-sm font-bold"
            >
              <RotateCcw size={18} /> <span className="hidden sm:inline">Recomeçar</span>
            </button>
            <button 
              onClick={() => setIsAdminOpen(true)}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
            >
              <Settings size={18} />
            </button>
            <button 
              onClick={handleLogout}
              className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-all flex items-center gap-2"
              title="Sair do Sistema"
            >
              <X size={14} /> Sair
            </button>
          </div>
        </div>
      </header>
      
      {/* Sticky Mobile Summary (Calculator) */}
      <AnimatePresence>
        {view === 'calculator' && showSticky && currentResult && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="fixed top-[64px] left-0 right-0 z-[45] bg-slate-900/95 backdrop-blur-md border-b border-white/10 px-5 py-3 flex items-center justify-between shadow-2xl lg:hidden cursor-pointer"
            onClick={scrollToSummary}
          >
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Resumo do Pedido</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-black text-white">R$ {currentResult.totalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                <span className="text-[10px] font-bold text-slate-500">{config.quantity.toLocaleString()} un</span>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-emerald-600/20 text-emerald-400 px-3 py-2 rounded-xl border border-emerald-600/30">
              <span className="text-[10px] font-black uppercase tracking-widest">Detalhes</span>
              <ChevronDown size={14} className="animate-bounce" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Alerts Overlay */}
        <div className="fixed top-20 right-4 z-[100] space-y-2 pointer-events-none">
          <AnimatePresence>
            {alerts.map((alert, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-slate-900/90 backdrop-blur-md text-white px-4 py-3 rounded-2xl shadow-2xl border border-white/10 flex items-center gap-3 max-w-xs pointer-events-auto"
              >
                <div className="w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center shrink-0">
                  <Info size={14} className="text-white" />
                </div>
                <p className="text-[11px] font-bold leading-tight">{alert}</p>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {view === 'manual' ? (
          <ManualQuote catalogProducts={bagTypes.map(t => t.name)} />
        ) : view === 'templates' ? (
          <div className="space-y-8">
            {/* Saved Models Section */}
            {savedModels.length > 0 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-black tracking-tight text-slate-900">Meus Modelos Salvos</h2>
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-widest">
                    {savedModels.length} {savedModels.length === 1 ? 'Modelo' : 'Modelos'}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {savedModels.map((template) => (
                    <motion.div
                      key={template.id}
                      whileHover={{ y: -5 }}
                      className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl transition-all group relative"
                    >
                      <div className="absolute top-4 right-4 z-30 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteModel(template.id);
                          }}
                          className="p-2 bg-white/80 backdrop-blur-sm text-slate-400 hover:text-rose-500 rounded-full transition-all border border-slate-100"
                          title={!!session ? "Remover Modelo" : "Acesso Restrito"}
                        >
                          {!!session ? <Trash2 size={16} /> : <Lock size={16} />}
                        </button>
                      </div>

                      <div 
                        onClick={() => {
                          setPreviewModel(template);
                          setActiveImageIndex(0);
                        }}
                        className="aspect-[16/10] bg-slate-100 relative overflow-hidden flex items-center justify-center cursor-pointer"
                      >
                        {template.customImage ? (
                          <img 
                            src={template.customImage} 
                            alt={template.title} 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <>
                            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent" />
                            <div className="scale-75 opacity-80 group-hover:scale-90 group-hover:opacity-100 transition-all duration-500">
                              <Package size={60} className="text-emerald-600" />
                            </div>
                          </>
                        )}
                        {template.customImages && template.customImages.length > 1 && (
                          <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/50 backdrop-blur-sm text-white text-[8px] font-black rounded-lg z-20">
                            +{template.customImages.length - 1} FOTOS
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10">
                          <span className="px-4 py-2 bg-white text-slate-900 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">
                            Ver Fotos
                          </span>
                        </div>
                      </div>
                      <div className="p-8 space-y-4">
                        <div>
                          <h3 className="text-xl font-black text-slate-900">{template.title}</h3>
                          <p className="text-sm text-slate-500 font-medium mt-1 leading-relaxed">{template.description}</p>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              startEditing(template);
                            }}
                            className="flex-1 py-3 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-600 transition-all flex items-center justify-center gap-2"
                          >
                            <Pencil size={12} /> Editar
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewModel(template);
                              setActiveImageIndex(0);
                            }}
                            className="px-4 py-3 bg-slate-100 text-slate-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all flex items-center justify-center border border-slate-200"
                          >
                            Ver
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
                <div className="h-px bg-slate-100 my-8" />
              </div>
            )}

            <div className="text-center space-y-2 max-w-2xl mx-auto">
              <h2 className="text-3xl font-black tracking-tight text-slate-900">Modelos Prontos do Mercado</h2>
              <p className="text-slate-500 font-medium">Escolha um modelo pré-configurado para agilizar seu orçamento. Você poderá ajustar os detalhes depois.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {marketTemplates.map((template) => (
                <motion.div
                  key={template.id}
                  whileHover={{ y: -5 }}
                  className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl transition-all group"
                >
                  <div className="aspect-[16/10] bg-slate-100 relative overflow-hidden flex items-center justify-center">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent" />
                    {/* Mini Preview based on imageHint */}
                    <div className="scale-75 opacity-80 group-hover:scale-90 group-hover:opacity-100 transition-all duration-500">
                      <svg width="120" height="140" viewBox="0 0 200 240" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path 
                          d={template.imageHint === 'camiseta' ? "M40 50 L40 20 L70 20 L70 50 L150 50 L150 20 L180 20 L180 50 L190 220 L30 220 Z" : "M40 50H180L190 220H30L40 50Z"} 
                          fill={template.imageHint === 'kraft' ? '#D2B48C' : '#FFFFFF'} 
                          stroke="rgba(0,0,0,0.1)"
                        />
                        {template.imageHint === 'vinho' && <rect x="90" y="80" width="20" height="80" rx="4" fill="rgba(0,0,0,0.05)" />}
                        {template.imageHint === 'palhaco' && <rect x="85" y="65" width="30" height="10" rx="5" fill="rgba(0,0,0,0.1)" />}
                      </svg>
                    </div>
                  </div>
                  <div className="p-8 space-y-4">
                    <div>
                      <h3 className="text-xl font-black text-slate-900">{template.title}</h3>
                      <p className="text-sm text-slate-500 font-medium mt-1 leading-relaxed">{template.description}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-1 bg-slate-100 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-500">
                        {template.config.width}x{template.config.height} cm
                      </span>
                      <span className="px-3 py-1 bg-emerald-50 rounded-full text-[10px] font-black uppercase tracking-widest text-emerald-600">
                        {template.config.quantity} un
                      </span>
                    </div>
                    <button 
                      onClick={() => applyMarketTemplate(template)}
                      className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-600 transition-all flex items-center justify-center gap-2"
                    >
                      Usar este Modelo <ChevronRight size={16} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8"> {/* calculator */}
            {/* Configuration Column */}
            <div className="lg:col-span-7 space-y-6">
          <section className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers size={18} className="text-emerald-600" />
                <h2 className="font-bold">Configuração do Produto</h2>
              </div>
              <div className={`px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 ${productInsight.bg} ${productInsight.color} ${productInsight.border}`}>
                {productInsight.icon} {productInsight.label}
              </div>
            </div>
            
            <div className="p-6 space-y-8">
              {/* Bag Type Selection */}
              <div className="space-y-3">
                <label className="text-sm font-bold text-slate-600 flex items-center gap-2 uppercase tracking-wider">
                  1. Tipo e Material <Tooltip text="Escolha o material ideal para sua marca. Papéis transmitem sofisticação e plásticos oferecem praticidade." />
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {bagTypes.map((type) => {
                    return (
                      <button
                        key={type.id}
                        onClick={() => setConfig(prev => ({ ...prev, bagTypeId: type.id }))}
                        className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden group ${
                          config.bagTypeId === type.id 
                          ? 'border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500' 
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{type.category}</span>
                        <span className={`block text-sm font-bold leading-tight ${config.bagTypeId === type.id ? 'text-emerald-700' : 'text-slate-700'}`}>
                          {type.name}
                        </span>
                        {config.bagTypeId === type.id && (
                          <div className="absolute top-2 right-2 text-emerald-500">
                            <Check size={14} />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Material Info Card */}
                <AnimatePresence mode="wait">
                  {bagTypes.find(t => t.id === config.bagTypeId) && (
                    <motion.div
                      key={config.bagTypeId}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2"
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-white rounded-lg border border-slate-200 text-emerald-600">
                          <Info size={16} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800 leading-relaxed">
                            {bagTypes.find(t => t.id === config.bagTypeId)?.description}
                          </p>
                          <p className="text-[11px] font-medium text-slate-500 mt-1 leading-relaxed italic">
                            {bagTypes.find(t => t.id === config.bagTypeId)?.purpose}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Handle Selection */}
              <div className="space-y-3">
                <label className="text-sm font-bold text-slate-600 flex items-center gap-2 uppercase tracking-wider">
                  2. Tipo de Alça <Tooltip text="A alça define o conforto e o estilo da sacola. Cordões são mais premium, enquanto alças de papel são sustentáveis." />
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {handleTypes.map((handle) => {
                    const rules = MATERIAL_COMPATIBILITY[config.bagTypeId];
                    const isPaper = bagTypes.find(t => t.id === config.bagTypeId)?.category === BagCategory.PAPER;
                    const cordaoHandles = ['nylon', 'cotton', 'gorgurao', 'ribbon', 'paper'];
                    
                    let disabledReason = null;
                    if (config.bagTypeId === 'camiseta' && handle.id !== 'none') disabledReason = "Não permitido em camiseta";
                    if (config.bagTypeId === 'palhaco' && handle.id !== 'none') disabledReason = "Não permitido em boca de palhaço";
                    if (config.bagTypeId === 'tnt' && !['none', 'tnt_handle'].includes(handle.id)) disabledReason = "Apenas TNT ou Sem Alça";
                    if (config.bagTypeId === 'algodao' && handle.id !== 'algodao_handle') disabledReason = "Apenas Alça de Algodão";
                    if (config.bagTypeId === 'alca_fita' && handle.id !== 'fita_soldada') disabledReason = "Apenas Alça Fita Soldada";
                    if (!isPaper && cordaoHandles.includes(handle.id)) {
                      disabledReason = "Apenas para papel";
                    }

                    return (
                      <button
                        key={handle.id}
                        disabled={!!disabledReason}
                        title={disabledReason || ''}
                        onClick={() => setConfig(prev => ({ ...prev, handleTypeId: handle.id }))}
                        className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden group ${
                          config.handleTypeId === handle.id 
                          ? 'border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500' 
                          : !!disabledReason 
                            ? 'opacity-40 cursor-not-allowed bg-slate-50 border-slate-100'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <span className={`block text-sm font-bold leading-tight ${config.handleTypeId === handle.id ? 'text-emerald-700' : 'text-slate-700'}`}>
                          {handle.name}
                        </span>
                        {config.handleTypeId === handle.id && (
                          <div className="absolute top-2 right-2 text-emerald-500">
                            <Check size={14} />
                          </div>
                        )}
                        {disabledReason && (
                          <div className="absolute bottom-1 right-2">
                            <Lock size={10} className="text-slate-400" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Bag Color */}
                <div className="space-y-3">
                  <label className="text-sm font-bold text-slate-600 flex items-center gap-2 uppercase tracking-wider">
                    3. Cor da Sacola <Tooltip text="Escolha a cor base do material da sacola." />
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {[
                      { id: 'white', name: 'Branca', color: '#f8fafc' },
                      { id: 'kraft', name: 'Kraft/Pardo', color: '#e5d3b3' },
                      { id: 'black', name: 'Preta', color: '#1a1a1a' },
                      { id: 'cru', name: 'Cru/Natural', color: '#eae6d9' },
                      { id: 'green', name: 'Verde', color: '#059669' },
                      { id: 'color', name: 'Colorida', color: '#3b82f6' },
                    ].map((color) => {
                      const rules = MATERIAL_COMPATIBILITY[config.bagTypeId];
                      const isDisabled = rules && !rules.colors.includes(color.id);
                      
                      return (
                        <button
                          key={color.id}
                          disabled={isDisabled}
                          onClick={() => setConfig(prev => ({ ...prev, bagColor: color.id }))}
                          className={`px-4 py-2 rounded-xl border text-xs font-bold transition-all flex items-center gap-2 ${
                            config.bagColor === color.id 
                            ? 'border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500' 
                            : isDisabled
                              ? 'opacity-40 cursor-not-allowed bg-slate-50 border-slate-100'
                              : 'border-slate-200 bg-white'
                          }`}
                        >
                          <div className="w-4 h-4 rounded-full border border-slate-200" style={{ backgroundColor: color.color }} />
                          {color.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Dimensions */}
                <div className="space-y-4">
                  <label className="text-sm font-bold text-slate-600 flex items-center gap-2 uppercase tracking-wider">
                    3. Tamanhos Padrão <Tooltip text="P, M e G são tamanhos padrão. Você também pode definir medidas personalizadas para seu produto." />
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {bagPresets
                      .filter(p => p.category === bagTypes.find(t => t.id === config.bagTypeId)?.category)
                      .map(preset => (
                        <button
                          key={preset.id}
                          onClick={() => applyPreset(preset)}
                          className={`px-2 py-2 rounded-xl border text-[10px] font-black uppercase transition-all ${
                            selectedPreset === preset.id 
                            ? 'bg-emerald-600 text-white border-emerald-600' 
                            : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          {preset.name}
                        </button>
                      ))}
                    <button
                      onClick={() => setSelectedPreset('custom')}
                      className={`px-2 py-2 rounded-xl border text-[10px] font-black uppercase transition-all ${
                        selectedPreset === 'custom' 
                        ? 'bg-slate-800 text-white border-slate-800' 
                        : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      Personalizado
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-3 pt-2">
                    <div>
                      <span className="text-[10px] font-black text-slate-400 uppercase block mb-1">Largura</span>
                      <input 
                        type="number" 
                        value={config.width}
                        onChange={(e) => {
                          setConfig(prev => ({ ...prev, width: Number(e.target.value) }));
                          setSelectedPreset('custom');
                        }}
                        className="w-full px-3 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm font-bold"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] font-black text-slate-400 uppercase block mb-1">Altura</span>
                      <input 
                        type="number" 
                        value={config.height}
                        onChange={(e) => {
                          setConfig(prev => ({ ...prev, height: Number(e.target.value) }));
                          setSelectedPreset('custom');
                        }}
                        className="w-full px-3 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm font-bold"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] font-black text-slate-400 uppercase block mb-1">Lateral</span>
                      <input 
                        type="number" 
                        value={config.side}
                        onChange={(e) => {
                          setConfig(prev => ({ ...prev, side: Number(e.target.value) }));
                          setSelectedPreset('custom');
                        }}
                        className="w-full px-3 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm font-bold"
                      />
                    </div>
                  </div>
                </div>

                {/* Quantity */}
                <div className="space-y-4">
                  <label className="text-sm font-bold text-slate-600 flex items-center gap-2 uppercase tracking-wider">
                    4. Quantidade <Tooltip text="Quanto maior a quantidade, menor o preço unitário devido à diluição dos custos fixos de produção." />
                  </label>
                  <div className="space-y-3">
                    <div className="grid grid-cols-4 gap-2">
                      {[500, 1000, 2000, 5000].map(q => (
                        <button
                          key={q}
                          onClick={() => {
                            setConfig(prev => ({ ...prev, quantity: q }));
                            setCustomQty('');
                          }}
                          className={`py-2 rounded-xl border text-xs font-black transition-all ${
                            config.quantity === q && !customQty
                            ? 'bg-slate-800 text-white border-slate-800' 
                            : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          {q.toLocaleString()}
                        </button>
                      ))}
                    </div>
                    <div className="relative">
                      <input 
                        type="number" 
                        placeholder="Outra quantidade..."
                        value={customQty}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCustomQty(val);
                          if (val) setConfig(prev => ({ ...prev, quantity: Number(val) }));
                        }}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm font-bold pl-10"
                      />
                      <Calculator size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Colors */}
                <div className="space-y-4">
                  <label className="text-sm font-bold text-slate-600 flex items-center gap-2 uppercase tracking-wider">
                    5. Cores <Tooltip text={TOOLTIPS.print_pantone} />
                  </label>
                  <div className="space-y-3">
                    <select 
                      value={config.colors}
                      onChange={(e) => setConfig(prev => ({ ...prev, colors: e.target.value as any }))}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm font-bold appearance-none bg-white"
                    >
                      <option value="black">Preto (Monocromático) -10%</option>
                      <option value="1">1 Cor (Padrão)</option>
                      {MATERIAL_COMPATIBILITY[config.bagTypeId]?.printColors.includes('2') && <option value="2">2 Cores +8%</option>}
                      {MATERIAL_COMPATIBILITY[config.bagTypeId]?.printColors.includes('3') && <option value="3">3 Cores +12%</option>}
                      {MATERIAL_COMPATIBILITY[config.bagTypeId]?.printColors.includes('4') && <option value="4">4 Cores (Colorido) +15%</option>}
                      {MATERIAL_COMPATIBILITY[config.bagTypeId]?.printColors.includes('pantone1') && <option value="pantone1">Pantone 1 Cor (Especial) +25%</option>}
                      {MATERIAL_COMPATIBILITY[config.bagTypeId]?.printColors.includes('pantone2') && <option value="pantone2">Pantone 2 Cores (Especial) +35%</option>}
                    </select>

                    {config.colors.startsWith('pantone') && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-2"
                      >
                        <span className="text-[10px] font-black text-slate-400 uppercase block mb-1">Código Pantone (ex: PMS 186C)</span>
                        <input 
                          type="text"
                          placeholder="Insira o código Pantone..."
                          value={config.pantoneCode || ''}
                          onChange={(e) => setConfig(prev => ({ ...prev, pantoneCode: e.target.value }))}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm font-bold"
                        />
                      </motion.div>
                    )}
                  </div>
                </div>

                {/* Lamination */}
                {bagTypes.find(t => t.id === config.bagTypeId)?.category === BagCategory.PAPER && (
                  <div className="space-y-4">
                    <label className="text-sm font-bold text-slate-600 flex items-center gap-2 uppercase tracking-wider">
                      6. Acabamento <Tooltip text="Acabamentos protegem a sacola e aumentam o brilho ou dão um toque aveludado fosco." />
                    </label>
                    <select 
                      value={config.lamination}
                      onChange={(e) => setConfig(prev => ({ ...prev, lamination: e.target.value as any }))}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm font-bold appearance-none bg-white"
                    >
                      <option value="none">Nenhum</option>
                      <option value="gloss">Brilho +6%</option>
                      <option value="matte">Fosca +8%</option>
                      <option value="uv">UV Localizado +12%</option>
                    </select>
                  </div>
                )}
              </div>

              {/* 7. Extras e Reforços */}
              <div className="space-y-6 pt-4 border-t border-slate-100">
                <label className="text-sm font-bold text-slate-600 flex items-center gap-2 uppercase tracking-wider">
                  7. Extras e Reforços <Tooltip text="Reforços aumentam a durabilidade e o ilhós dá um toque de luxo às alças de cordão." />
                </label>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <button
                    disabled={!MATERIAL_COMPATIBILITY[config.bagTypeId]?.extras.includes('eyelet')}
                    onClick={() => setConfig(prev => ({ ...prev, hasEyelet: !prev.hasEyelet }))}
                    className={`p-4 rounded-2xl border text-left transition-all relative ${
                      config.hasEyelet ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 bg-white'
                    } ${!MATERIAL_COMPATIBILITY[config.bagTypeId]?.extras.includes('eyelet') ? 'opacity-40 cursor-not-allowed' : ''}`}
                  >
                    <span className="block text-[10px] font-black text-slate-400 uppercase mb-1">Ilhós</span>
                    <span className="text-xs font-bold">{config.hasEyelet ? 'Sim' : 'Não'}</span>
                    {!MATERIAL_COMPATIBILITY[config.bagTypeId]?.extras.includes('eyelet') && <Lock size={10} className="absolute bottom-2 right-2 text-slate-400" />}
                  </button>

                  <button
                    disabled={!MATERIAL_COMPATIBILITY[config.bagTypeId]?.extras.includes('bottom')}
                    onClick={() => setConfig(prev => ({ ...prev, hasBottomReinforcement: !prev.hasBottomReinforcement }))}
                    className={`p-4 rounded-2xl border text-left transition-all relative ${
                      config.hasBottomReinforcement ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 bg-white'
                    } ${!MATERIAL_COMPATIBILITY[config.bagTypeId]?.extras.includes('bottom') ? 'opacity-40 cursor-not-allowed' : ''}`}
                  >
                    <span className="block text-[10px] font-black text-slate-400 uppercase mb-1">Ref. Fundo</span>
                    <span className="text-xs font-bold">{config.hasBottomReinforcement ? 'Sim' : 'Não'}</span>
                    {!MATERIAL_COMPATIBILITY[config.bagTypeId]?.extras.includes('bottom') && <Lock size={10} className="absolute bottom-2 right-2 text-slate-400" />}
                  </button>

                  <button
                    disabled={!MATERIAL_COMPATIBILITY[config.bagTypeId]?.extras.includes('mouth')}
                    onClick={() => setConfig(prev => ({ ...prev, hasMouthReinforcement: !prev.hasMouthReinforcement }))}
                    className={`p-4 rounded-2xl border text-left transition-all relative ${
                      config.hasMouthReinforcement ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 bg-white'
                    } ${!MATERIAL_COMPATIBILITY[config.bagTypeId]?.extras.includes('mouth') ? 'opacity-40 cursor-not-allowed' : ''}`}
                  >
                    <span className="block text-[10px] font-black text-slate-400 uppercase mb-1">Ref. Boca</span>
                    <span className="text-xs font-bold">{config.hasMouthReinforcement ? 'Sim' : 'Não'}</span>
                    {!MATERIAL_COMPATIBILITY[config.bagTypeId]?.extras.includes('mouth') && <Lock size={10} className="absolute bottom-2 right-2 text-slate-400" />}
                  </button>

                  <button
                    disabled={!MATERIAL_COMPATIBILITY[config.bagTypeId]?.extras.includes('diecut')}
                    onClick={() => setConfig(prev => ({ ...prev, isExclusiveDieCut: !prev.isExclusiveDieCut }))}
                    className={`p-4 rounded-2xl border text-left transition-all relative ${
                      config.isExclusiveDieCut ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 bg-white'
                    } ${!MATERIAL_COMPATIBILITY[config.bagTypeId]?.extras.includes('diecut') ? 'opacity-40 cursor-not-allowed' : ''}`}
                  >
                    <span className="block text-[10px] font-black text-slate-400 uppercase mb-1">Faca Excl.</span>
                    <span className="text-xs font-bold">{config.isExclusiveDieCut ? 'Sim' : 'Não'}</span>
                    {!MATERIAL_COMPATIBILITY[config.bagTypeId]?.extras.includes('diecut') && <Lock size={10} className="absolute bottom-2 right-2 text-slate-400" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-slate-100">
                {/* 8. Tipo de Impressão */}
                <div className="space-y-4">
                  <label className="text-sm font-bold text-slate-600 flex items-center gap-2 uppercase tracking-wider">
                    8. Tipo de Impressão <Tooltip text="Escolha se deseja imprimir apenas na frente ou em ambos os lados para maior visibilidade." />
                  </label>
                  <select 
                    value={config.printingSides}
                    onChange={(e) => setConfig(prev => ({ ...prev, printingSides: e.target.value as any }))}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm font-bold appearance-none bg-white"
                  >
                    <option value="front">Apenas Frente</option>
                    {(() => {
                      const isPaper = bagTypes.find(t => t.id === config.bagTypeId)?.category === BagCategory.PAPER;
                      const isEcologica = config.bagTypeId === 'ecologica';
                      if (isPaper || isEcologica) {
                        return <option value="both">Frente e Verso (1.6x)</option>;
                      }
                      return null;
                    })()}
                  </select>
                </div>
              </div>
            </div>
          </section>

          {/* Recommendations */}
          <AnimatePresence>
            {recommendations.length > 0 && (
              <motion.section 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-emerald-50 rounded-3xl border border-emerald-100 p-6 space-y-4"
              >
                <div className="flex items-center gap-2 text-emerald-800 font-black uppercase text-[10px] tracking-widest">
                  <TrendingDown size={14} />
                  Dicas de Economia
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {recommendations.map((rec, idx) => (
                    <button
                      key={idx}
                      onClick={() => setConfig(rec.config)}
                      className="bg-white p-4 rounded-2xl border border-emerald-200 hover:border-emerald-400 transition-all text-left group shadow-sm"
                    >
                      <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{rec.label}</span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-lg font-black text-emerald-700">R$ {rec.price.toFixed(2)}</span>
                        <span className="text-[10px] text-slate-400 font-bold">/un</span>
                      </div>
                      <div className="mt-2 flex items-center text-[10px] font-black text-emerald-600 uppercase tracking-tight">
                        Economize R$ {rec.diff.toFixed(2)} <ChevronRight size={10} className="ml-1 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </button>
                  ))}
                </div>
              </motion.section>
            )}
          </AnimatePresence>
        </div>

        {/* Result Column */}
        <div className="lg:col-span-5 space-y-6" ref={summaryRef}>
          <section className="bg-slate-900 rounded-[2.5rem] shadow-2xl p-8 text-white sticky top-24 border border-white/5">
            <div className="space-y-8">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-slate-500 font-black uppercase text-[10px] tracking-widest mb-2">Preço Unitário</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-black tracking-tighter">R$ {currentResult.unitPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    <span className="text-slate-600 font-bold text-sm">/un</span>
                  </div>
                </div>
                <div className="text-right">
                  <h3 className="text-slate-500 font-black uppercase text-[10px] tracking-widest mb-2">Total do Lote</h3>
                  <div className="text-2xl font-black text-emerald-400 tracking-tight">R$ {currentResult.totalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                </div>
              </div>

              <div className="h-px bg-white/5" />

              {/* Bag Preview */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Visualização Prévia</h4>
                </div>

                <MockupPreview 
                  result={currentResult} 
                  images={loadedModelImages}
                  onClearImages={() => setLoadedModelImages(null)}
                />
              </div>

              <div className="h-px bg-white/5" />

              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Detalhamento Técnico</h4>
                <div className="grid grid-cols-2 gap-y-4 text-sm">
                  <div className="text-slate-500 font-medium">Material</div>
                  <div className="text-right font-bold">{currentResult.bagType.name}</div>
                  
                  <div className="text-slate-500 font-medium">Alça</div>
                  <div className="text-right font-bold">{currentResult.handleType.name}</div>
                  
                  <div className="text-slate-500 font-medium">Medida</div>
                  <div className="text-right font-bold">{config.width}x{config.height}x{config.side} cm</div>
                  
                  <div className="text-slate-500 font-medium">Cores</div>
                  <div className="text-right font-bold">{config.colors === 'black' ? 'Preto' : config.colors + ' cor(es)'}</div>
                  
                  <div className="text-slate-500 font-medium">Acabamento</div>
                  <div className="text-right font-bold capitalize">{config.lamination === 'none' ? 'Nenhum' : config.lamination}</div>

                  <div className="text-slate-500 font-medium">Impressão</div>
                  <div className="text-right font-bold">{config.printingSides === 'both' ? 'Frente e Verso' : 'Frente'}</div>

                  <div className="text-slate-500 font-medium">Extras</div>
                  <div className="text-right font-bold text-[10px]">
                    {[
                      config.hasEyelet ? 'Ilhós' : null,
                      config.hasBottomReinforcement ? 'Ref. Fundo' : null,
                      config.hasMouthReinforcement ? 'Ref. Boca' : null,
                      config.isExclusiveDieCut ? 'Faca Excl.' : null
                    ].filter(Boolean).join(', ') || 'Nenhum'}
                  </div>
                  
                  <div className="text-slate-500 font-medium">Quantidade</div>
                  <div className="text-right font-bold">{config.quantity.toLocaleString()} un</div>
                </div>
              </div>

              <div className="bg-white/5 rounded-3xl p-5 flex items-start gap-3 border border-white/5">
                <Info size={18} className="text-emerald-400 mt-0.5 shrink-0" />
                <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                  Valores calculados com margem de lucro de {(profitMargin * 100 - 100).toFixed(0)}%. Prazo de entrega sujeito a alteração conforme demanda da fábrica.
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <button 
                  onClick={handleCopy}
                  className={`w-full py-5 rounded-3xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 transition-all active:scale-[0.98] ${
                    copied 
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                    : 'bg-white text-slate-900 hover:bg-slate-100 shadow-xl shadow-white/5'
                  }`}
                >
                  {copied ? (
                    <>
                      <Check size={20} /> Copiado!
                    </>
                  ) : (
                    <>
                      <Copy size={20} /> Copiar Orçamento
                    </>
                  )}
                </button>
                <button 
                  onClick={generatePDF}
                  className="w-full py-5 bg-slate-900 text-white rounded-3xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 transition-all hover:bg-emerald-600 shadow-xl shadow-slate-900/10"
                >
                  <FileText size={20} /> Gerar PDF
                </button>
                <button 
                  onClick={() => {
                    setIsSavingModel(true);
                    setEditingConfig({ ...config });
                  }}
                  className="w-full py-5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-3xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 transition-all hover:bg-emerald-100 shadow-xl shadow-emerald-500/5"
                >
                  <Save size={20} /> Salvar Modelo
                </button>
              </div>
            </div>
          </section>

          <div className="bg-white rounded-3xl p-6 border border-slate-200 text-center shadow-sm">
            <p className="text-xs text-slate-500 font-medium">
              Precisa de ajuda com o design? <br />
              <button className="text-emerald-600 font-black uppercase text-[10px] tracking-widest hover:underline mt-2">Solicitar Arte Grátis</button>
            </p>
          </div>
        </div>
      </div>
    )}{/* end views */}
  </main>

      <footer className="max-w-7xl mx-auto px-4 py-12 border-t border-slate-200 mt-12">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 opacity-30">
            <Package size={16} />
            <span className="text-xs font-black tracking-tighter uppercase">SacolaPro v1.1</span>
          </div>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">© 2026 SacolaPro - Tecnologia para Embalagens</p>
        </div>
      </footer>
    </div>
  );
}
