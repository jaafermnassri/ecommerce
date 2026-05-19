import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  UserPlus, 
  ShoppingBag, 
  ChevronRight, 
  ChevronLeft, 
  Zap, 
  Layout, 
  Globe, 
  Palette,
  Loader2,
  CheckCircle2,
  Rocket
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function RegisterPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Step 1 fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [shopName, setShopName] = useState('');

  // Step 2 fields
  const [subdomain, setSubdomain] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#6366f1');
  const [checkingSub, setCheckingSub] = useState(false);
  const [subAvailable, setSubAvailable] = useState<boolean | null>(null);

  const navigate = useNavigate();

  const checkSubdomainAvailability = async (val: string) => {
    if (!val) {
      setSubAvailable(null);
      return;
    }
    setCheckingSub(true);
    try {
      const res = await fetch(`/api/auth/check-subdomain/${val.toLowerCase()}`);
      const data = await res.json();
      setSubAvailable(data.available);
    } catch (err) {
      setSubAvailable(null);
    } finally {
      setCheckingSub(false);
    }
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      // Small automated subdomain suggestion
      if (!subdomain) {
        setSubdomain(shopName.toLowerCase().replace(/[^a-z0-9]/g, ''));
      }
      setStep(2);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (subAvailable === false) return;
    
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          password, 
          shopName, 
          subdomain: subdomain.toLowerCase(), 
          primaryColor 
        })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        navigate('/login?registered=true');
      } else {
        setError(data.error || 'Erreur lors de l’inscription');
      }
    } catch (err) {
      setError('Erreur de connexion serveur');
    } finally {
      setLoading(false);
    }
  };

  const colorOptions = [
    '#6366f1', // Indigo
    '#0ea5e9', // Sky
    '#10b981', // Emerald
    '#f59e0b', // Amber
    '#ef4444', // Red
    '#8b5cf6', // Violet
    '#000000', // Black
  ];

  return (
    <div className="min-h-screen bg-[#fafbff] flex items-center justify-center p-6 selection:bg-brand-primary/10">
      <div className="max-w-xl w-full">
        {/* Progress Bar */}
        <div className="flex items-center justify-center gap-4 mb-10">
           <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm transition-all shadow-sm ${step >= 1 ? 'bg-brand-primary text-white shadow-indigo-100' : 'bg-slate-100 text-slate-400'}`}>1</div>
           <div className={`h-1 w-20 rounded-full transition-all ${step >= 2 ? 'bg-brand-primary' : 'bg-slate-100'}`}></div>
           <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm transition-all shadow-sm ${step >= 2 ? 'bg-brand-primary text-white shadow-indigo-100' : 'bg-slate-100 text-slate-400'}`}>2</div>
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-indigo-100/50 p-10 md:p-12 border border-slate-50 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-slate-50">
            <motion.div 
              className="h-full bg-brand-primary"
              initial={{ width: '0%' }}
              animate={{ width: step === 1 ? '50%' : '100%' }}
            />
          </div>

          <div className="text-center mb-10">
             <Link to="/" className="inline-flex items-center gap-2 mb-4 group transition-all hover:scale-105">
                <div className="w-10 h-10 bg-brand-primary rounded-xl flex items-center justify-center shadow-lg shadow-indigo-100 text-white">
                  <Zap className="w-6 h-6" />
                </div>
                <span className="text-xl font-bold text-slate-900 tracking-tighter" style={{ fontFamily: 'var(--font-title)' }}>ConvertyFlow</span>
             </Link>
             <h1 className="text-2xl font-bold text-slate-900 mb-2" style={{ fontFamily: 'var(--font-title)' }}>
               {step === 1 ? 'Commençons par les bases' : 'Configurez votre shop'}
             </h1>
             <p className="text-slate-400 text-sm font-medium italic">Rejoignez des centaines d'entrepreneurs tunisiens.</p>
          </div>

          {error && <div className="bg-rose-50 text-rose-600 p-4 rounded-2xl text-xs font-bold mb-8 border border-rose-100 animate-in shake">{error}</div>}

          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.form 
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleNext} 
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-[0.7rem] font-bold text-slate-400 uppercase tracking-widest mb-2 block ml-2">Nom de la Boutique</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Ex: Mon Shop TN"
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 outline-none focus:border-brand-primary font-bold text-slate-700 transition-all"
                      value={shopName}
                      onChange={(e) => setShopName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-[0.7rem] font-bold text-slate-400 uppercase tracking-widest mb-2 block ml-2">Propriétaire</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Votre nom"
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 outline-none focus:border-brand-primary font-bold text-slate-700 transition-all font-sans"
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[0.7rem] font-bold text-slate-400 uppercase tracking-widest mb-2 block ml-2">Email Professionnel</label>
                  <input 
                    type="email" 
                    required
                    placeholder="email@votreshop.com"
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 outline-none focus:border-brand-primary font-bold text-slate-700 transition-all"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-[0.7rem] font-bold text-slate-400 uppercase tracking-widest mb-2 block ml-2">Mot de passe</label>
                  <input 
                    type="password" 
                    required
                    placeholder="••••••••"
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 outline-none focus:border-brand-primary font-bold text-slate-700 transition-all"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full bg-brand-primary text-white font-bold py-5 rounded-2xl shadow-2xl shadow-indigo-100 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 group"
                >
                  Continuer <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </motion.form>
            ) : (
              <motion.form 
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleRegister} 
                className="space-y-8"
              >
                <div>
                  <label className="text-[0.7rem] font-bold text-slate-400 uppercase tracking-widest mb-2 block ml-2">Votre Adresse (Sous-domaine)</label>
                  <div className="relative group">
                    <input 
                      type="text" 
                      required
                      placeholder="mon-shop"
                      className={`w-full bg-slate-50 border rounded-2xl px-5 py-4 outline-none font-bold transition-all pr-44 ${subAvailable === true ? 'border-emerald-200 focus:border-emerald-500' : subAvailable === false ? 'border-rose-200 focus:border-rose-500' : 'border-slate-100 focus:border-brand-primary'}`}
                      value={subdomain}
                      onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                      onBlur={(e) => checkSubdomainAvailability(e.target.value)}
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 text-slate-400 font-bold text-xs pointer-events-none">
                      .convertyflow.com
                      {checkingSub && <Loader2 className="w-4 h-4 animate-spin text-brand-primary" />}
                      {subAvailable === true && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                      {subAvailable === false && <span className="text-[0.6rem] text-rose-500 uppercase">Indisponible</span>}
                    </div>
                  </div>
                  <p className="text-[0.65rem] text-slate-400 mt-2 ml-2 italic">C'est l'adresse que vos clients utiliseront pour commander.</p>
                </div>

                <div>
                   <label className="text-[0.7rem] font-bold text-slate-400 uppercase tracking-widest mb-4 block ml-2">Couleur de Marque</label>
                   <div className="flex flex-wrap gap-4">
                     {colorOptions.map(color => (
                       <button
                         key={color}
                         type="button"
                         onClick={() => setPrimaryColor(color)}
                         className={`w-12 h-12 rounded-2xl border-4 transition-all hover:scale-110 shadow-sm ${primaryColor === color ? 'border-white ring-2 ring-brand-primary shadow-lg ring-offset-2' : 'border-transparent'}`}
                         style={{ backgroundColor: color }}
                       />
                     ))}
                   </div>
                </div>

                <div className="flex gap-4">
                  <button 
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-shrink-0 w-16 h-[68px] bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center hover:bg-slate-100 transition-colors"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button 
                    type="submit"
                    disabled={loading || subAvailable === false}
                    className="flex-1 bg-brand-primary text-white font-bold py-5 rounded-2xl shadow-2xl shadow-indigo-100 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                      <>
                        <Rocket className="w-5 h-5" />
                        Lancer ma Boutique
                      </>
                    )}
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        <p className="text-center mt-10 text-slate-400 text-sm font-medium">
          Vous avez déjà un compte ? <Link to="/login" className="text-brand-primary font-bold hover:underline">Se connecter</Link>
        </p>
      </div>
    </div>
  );
}
