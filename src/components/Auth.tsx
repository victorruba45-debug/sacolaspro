import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Lock, 
  Mail, 
  Loader2, 
  ChevronRight, 
  UserPlus, 
  LogIn,
  AlertCircle,
  Package,
  ArrowLeft,
  CheckCircle
} from 'lucide-react';

export const Auth = () => {
  const [loading, setLoading] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'forgot-password' | 'update-password'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  React.useEffect(() => {
    // Detect password recovery link
    const handleRecovery = () => {
      const hash = window.location.hash;
      if (hash && (hash.includes('type=recovery') || hash.includes('access_token='))) {
        setAuthMode('update-password');
      }
    };
    handleRecovery();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setAuthMode('update-password');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (authMode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        setMessage('Verifique seu e-mail para confirmar o cadastro!');
      } else if (authMode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      } else if (authMode === 'forgot-password') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/`,
        });
        if (error) throw error;
        setMessage('Link de recuperação enviado! Verifique seu e-mail.');
      } else if (authMode === 'update-password') {
        const { error } = await supabase.auth.updateUser({
          password: newPassword,
        });
        if (error) throw error;
        setMessage('Senha atualizada com sucesso! Você já pode entrar.');
        setTimeout(() => setAuthMode('login'), 2000);
      }
    } catch (err: any) {
      console.error("Error authenticating:", err);
      let errorMsg = err.message || 'Ocorreu um erro na autenticação.';
      if (errorMsg === '{}' || (typeof err === 'object' && Object.keys(err).length === 0)) {
        errorMsg = 'Serviços do Supabase em inicialização (Erro 503). Por favor, aguarde de 2 a 5 minutos para que o banco de dados termine de carregar e tente novamente.';
      }
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black flex items-center justify-center p-4">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 md:p-12 shadow-2xl relative overflow-hidden">
          {/* Logo / Header */}
          <div className="flex flex-col items-center mb-10 text-center">
            <div className="w-16 h-16 bg-gradient-to-tr from-emerald-600 to-emerald-400 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20 mb-6 motion-safe:animate-pulse">
              <Package className="text-white" size={32} />
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight mb-2">
              Sacola<span className="text-emerald-500 text-4xl">.</span>Pro
            </h1>
            <p className="text-slate-400 text-sm font-medium">
              {authMode === 'signup' && 'Crie sua conta para começar'}
              {authMode === 'login' && 'Bem-vindo de volta ao futuro das sacolas'}
              {authMode === 'forgot-password' && 'Recupere seu acesso com facilidade'}
              {authMode === 'update-password' && 'Defina sua nova senha ultra-segura'}
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-5">
            {authMode !== 'update-password' && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">E-mail</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-emerald-500 transition-colors">
                    <Mail size={18} />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-800/50 border border-white/5 focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-slate-600 outline-none transition-all"
                    placeholder="exemplo@email.com"
                  />
                </div>
              </div>
            )}

            {(authMode === 'login' || authMode === 'signup') && (
              <div className="space-y-1">
                <div className="flex justify-between items-center pr-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Senha</label>
                  {authMode === 'login' && (
                    <button 
                      type="button"
                      onClick={() => setAuthMode('forgot-password')}
                      className="text-[10px] font-black text-emerald-500 uppercase tracking-widest hover:text-emerald-400 transition-colors"
                    >
                      Esqueceu a senha?
                    </button>
                  )}
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-emerald-500 transition-colors">
                    <Lock size={18} />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-800/50 border border-white/5 focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-slate-600 outline-none transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            )}

            {authMode === 'update-password' && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Nova Senha</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-emerald-500 transition-colors">
                    <Lock size={18} />
                  </div>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-slate-800/50 border border-white/5 focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-slate-600 outline-none transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            )}

            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-2xl flex items-start gap-3"
                >
                  <AlertCircle size={18} className="mt-0.5 shrink-0" />
                  <p className="text-xs font-medium leading-relaxed">{error}</p>
                </motion.div>
              )}
              {message && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-2xl flex items-start gap-3"
                >
                  <AlertCircle size={18} className="mt-0.5 shrink-0" />
                  <p className="text-xs font-medium leading-relaxed">{message}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 disabled:from-slate-700 disabled:to-slate-800 text-white font-bold py-4 rounded-2xl shadow-xl shadow-emerald-900/20 transition-all flex items-center justify-center gap-2 group relative overflow-hidden"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  <span className="relative z-10">
                    {authMode === 'signup' && 'Criar Conta Premium'}
                    {authMode === 'login' && 'Entrar no Sistema'}
                    {authMode === 'forgot-password' && 'Enviar Link de Resgate'}
                    {authMode === 'update-password' && 'Confirmar Nova Senha'}
                  </span>
                  <ChevronRight size={18} className="relative z-10 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-10 pt-8 border-t border-white/5 text-center">
            {authMode === 'forgot-password' || authMode === 'update-password' ? (
              <button
                onClick={() => setAuthMode('login')}
                className="text-slate-400 hover:text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2 mx-auto"
              >
                <ArrowLeft size={16} /> Voltar para o Login
              </button>
            ) : (
              <button
                onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
                className="text-slate-400 hover:text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2 mx-auto"
              >
                {authMode === 'signup' ? (
                  <>
                    <LogIn size={16} />
                    Já tem uma conta? <span className="text-emerald-500">Entrar</span>
                  </>
                ) : (
                  <>
                    <UserPlus size={16} />
                    Não tem conta? <span className="text-emerald-500">Crie agora</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
        
        <p className="mt-8 text-center text-slate-600 text-[10px] uppercase tracking-[0.2em] font-black">
          © 2026 SacolaPro • Orçamentos Inteligentes
        </p>
      </motion.div>
    </div>
  );
};
