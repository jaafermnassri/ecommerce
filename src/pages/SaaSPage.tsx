import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Rocket, 
  Target, 
  TrendingUp, 
  MapPin, 
  Zap, 
  ShieldCheck, 
  Layout, 
  CheckCircle2, 
  ArrowRight,
  MousePointer2,
  Users,
  Smartphone
} from 'lucide-react';
import { motion } from 'motion/react';

export default function SaaSPage() {
  return (
    <div className="min-h-screen bg-[#fafbff] font-sans selection:bg-brand-primary/10">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100 h-20 flex items-center px-6 md:px-12">
        <div className="max-w-7xl mx-auto w-full flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-primary rounded-xl flex items-center justify-center shadow-lg shadow-indigo-100">
               <Zap className="text-white w-6 h-6" />
            </div>
            <span className="text-2xl font-bold text-slate-900 tracking-tighter" style={{ fontFamily: 'var(--font-title)' }}>ConvertyFlow</span>
          </div>
          
          <div className="hidden md:flex items-center gap-10">
            <a href="#features" className="text-sm font-bold text-slate-500 hover:text-brand-primary transition-colors">Features</a>
            <a href="#leads" className="text-sm font-bold text-slate-500 hover:text-brand-primary transition-colors">Lead Recovery</a>
            <a href="#delivery" className="text-sm font-bold text-slate-500 hover:text-brand-primary transition-colors">Quick Delivery</a>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/login" className="text-sm font-bold text-slate-600 hover:text-brand-primary transition-colors px-4 py-2">Connexion</Link>
            <Link to="/register" className="bg-brand-primary text-white px-6 py-3 rounded-2xl font-bold text-sm shadow-xl shadow-indigo-100 hover:scale-105 active:scale-95 transition-all">
              Démarrer Gratuitement
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-44 pb-32 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="bg-indigo-50 text-brand-primary px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-8 inline-block border border-indigo-100">
              La Solution No-Code pour le E-commerce Tunisien
            </span>
            <h1 className="text-5xl md:text-7xl font-bold text-slate-900 tracking-tight leading-[1.05] mb-8 max-w-4xl mx-auto" style={{ fontFamily: 'var(--font-title)' }}>
              Transformez vos prospects en <span className="text-brand-primary italic">clients</span> aujourd'hui.
            </h1>
            <p className="text-xl text-slate-500 max-w-2xl mx-auto mb-12 font-medium">
              Vendez vos produits en un clic avec des landing pages haute conversion adaptées au marché tunisien.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
               <Link to="/register" className="w-full sm:w-auto bg-brand-primary text-white px-10 py-5 rounded-2xl font-bold text-lg shadow-2xl shadow-indigo-200 hover:scale-105 transition-all flex items-center justify-center gap-2">
                 Créer mon shop <ArrowRight className="w-5 h-5" />
               </Link>
               <Link to="/login" className="w-full sm:w-auto bg-white border border-slate-200 text-slate-600 px-10 py-5 rounded-2xl font-bold text-lg hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
                 Voir Démo
               </Link>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="mt-24 relative"
          >
             <div className="absolute -inset-4 bg-gradient-to-tr from-indigo-500/10 to-teal-500/10 blur-3xl opacity-50"></div>
             <img 
              src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=2426&ixlib=rb-4.0.3" 
              alt="Dashboard Preview" 
              className="rounded-[2.5rem] shadow-2xl border border-white/20 relative z-10 mx-auto max-w-5xl h-[600px] object-cover"
             />
             
             {/* Floating Stats Card Placeholder */}
             <div className="absolute -bottom-10 -right-5 md:right-10 z-20 bg-white p-6 rounded-3xl shadow-2xl border border-slate-100 hidden md:block animate-bounce-slow">
               <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center">
                   <TrendingUp className="w-6 h-6" />
                 </div>
                 <div>
                   <p className="text-[0.65rem] font-bold text-slate-400 uppercase tracking-widest">Revenue Today</p>
                   <p className="text-xl font-black text-slate-900 tracking-tighter">1,450.000 DT</p>
                 </div>
               </div>
             </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-32 bg-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center mb-24">
            <h2 className="text-4xl font-bold text-slate-900 mb-6" style={{ fontFamily: 'var(--font-title)' }}>Tout ce qu'il vous faut pour exploser vos ventes</h2>
            <p className="text-slate-500 max-w-2xl mx-auto font-medium text-lg">Plus qu'un simple builder, un système complet de conversion des ventes conçu pour la Tunisie.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
             <div className="p-10 bg-[#fafbff] rounded-[2.5rem] border border-slate-50 group hover:border-brand-primary/20 transition-all hover:translate-y-[-8px]">
               <div className="w-16 h-16 bg-white rounded-2xl shadow-xl flex items-center justify-center mb-10 group-hover:scale-110 transition-transform">
                 <Zap className="w-8 h-8 text-brand-primary" />
               </div>
               <h3 className="text-2xl font-bold text-slate-900 mb-4" style={{ fontFamily: 'var(--font-title)' }}>Lead Recovery</h3>
               <p className="text-slate-500 leading-relaxed font-medium">Capturez les clients qui abandonnent leur panier instantanément et relancez-les via WhatsApp en un clic.</p>
             </div>

             <div className="p-10 bg-[#fafbff] rounded-[2.5rem] border border-slate-50 group hover:border-indigo-100 transition-all hover:translate-y-[-8px]">
               <div className="w-16 h-16 bg-white rounded-2xl shadow-xl flex items-center justify-center mb-10 group-hover:scale-110 transition-transform">
                 <Smartphone className="w-8 h-8 text-indigo-500" />
               </div>
               <h3 className="text-2xl font-bold text-slate-900 mb-4" style={{ fontFamily: 'var(--font-title)' }}>Paiement Livraison</h3>
               <p className="text-slate-500 leading-relaxed font-medium">Formulaires optimisés pour le Cash on Delivery (COD), maximisant le taux de complétion des commandes.</p>
             </div>

             <div className="p-10 bg-[#fafbff] rounded-[2.5rem] border border-slate-50 group hover:border-indigo-100 transition-all hover:translate-y-[-8px]">
               <div className="w-16 h-16 bg-white rounded-2xl shadow-xl flex items-center justify-center mb-10 group-hover:scale-110 transition-transform">
                 <MapPin className="w-8 h-8 text-rose-500" />
               </div>
               <h3 className="text-2xl font-bold text-slate-900 mb-4" style={{ fontFamily: 'var(--font-title)' }}>Logique 7DT Tunisie</h3>
               <p className="text-slate-500 leading-relaxed font-medium">Calcul automatique des frais de livraison standard et gestion des paliers de livraison gratuite automatiques.</p>
             </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-24 bg-brand-primary text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-white opacity-5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div className="max-w-7xl mx-auto px-6 text-center">
           <p className="text-[0.7rem] font-black uppercase tracking-[0.3em] opacity-60 mb-12">Propulsant +200 boutiques actives en Tunisie</p>
           <div className="flex flex-wrap items-center justify-center gap-12 md:gap-24 opacity-60 grayscale brightness-200">
             <span className="text-2xl font-bold italic tracking-tighter">ShopFlow</span>
             <span className="text-2xl font-bold tracking-widest uppercase">QuickCart</span>
             <span className="text-2xl font-extrabold tracking-tight">ExpressTN</span>
             <span className="text-2xl font-black italic">SalesBoost</span>
           </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-32 px-6">
         <div className="max-w-5xl mx-auto bg-slate-900 rounded-[3rem] p-12 md:p-24 text-center relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-brand-primary/20 to-transparent"></div>
            <div className="relative z-10">
               <h2 className="text-4xl md:text-5xl font-bold text-white mb-8" style={{ fontFamily: 'var(--font-title)' }}>Prêts à scaler votre business ?</h2>
               <p className="text-slate-400 text-lg mb-12 max-w-xl mx-auto">Rejoignez l'élite du e-commerce tunisien et commencez à vendre dès aujourd'hui sans aucune compétence technique.</p>
               <Link to="/register" className="bg-brand-primary text-white px-12 py-5 rounded-2xl font-bold text-lg hover:scale-105 transition-all inline-block shadow-2xl shadow-indigo-500/30">
                 Démarrer mon essai gratuit
               </Link>
               <p className="text-slate-500 text-xs mt-6 font-bold uppercase tracking-widest">Pas de carte bancaire requise</p>
            </div>
         </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-100 text-center">
         <p className="text-slate-400 text-sm font-medium">© 2026 ConvertyFlow. Conçu avec passion pour les entrepreneurs Tunisiens.</p>
      </footer>
    </div>
  );
}
