import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ShoppingBag, ChevronRight, Phone, MessageCircle, MapPin, Truck, RefreshCcw, CheckCircle2 } from 'lucide-react';

export default function PublicStore() {
  const { subdomain } = useParams();
  const [shop, setShop] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/public/shop/${subdomain}`)
      .then(res => {
        if (!res.ok) throw new Error("Boutique introuvable");
        return res.json();
      })
      .then(data => {
        setShop(data);
        setProducts(data.products || []);
      })
      .catch(err => {
        console.error(err);
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, [subdomain]);

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
       <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Chargement de la boutique...</p>
       </div>
    </div>
  );

  if (error || !shop || !shop.settings) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
       <div className="max-w-md w-full bg-white rounded-[2.5rem] p-10 text-center shadow-2xl shadow-slate-200 border border-slate-100">
          <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center mx-auto mb-6 transform -rotate-6">
             <ShoppingBag className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-2 font-arabic italic">عذراً، الرابط غير صحيح</h2>
          <p className="text-sm text-slate-400 font-medium mb-8">Cette boutique n'existe pas ou a été désactivée.</p>
          <a href="/" className="inline-block bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-slate-100 hover:scale-105 transition-all">Retour à l'accueil</a>
       </div>
    </div>
  );

  const settings = shop.settings;
  const themeColor = settings.primaryColor || '#38bdf8';
  const templateId = shop.templateId || 'basic';

  // Template-specific flags
  const isDark = templateId === 'dark';
  const isLuxury = templateId === 'luxury';
  const isMinimal = templateId === 'minimal';
  const isInsta = templateId === 'instagram';
  const isTikTok = templateId === 'tiktok';
  const isFuture = templateId === 'future';
  const isVintage = templateId === 'vintage';
  const isMega = templateId === 'mega';
  const isVSL = templateId === 'vsl';
  const isModern = templateId === 'modern';
  const isClean = templateId === 'clean';
  
  const getContainerClass = () => {
    if (isDark) return 'bg-slate-950 text-white';
    if (isFuture) return 'bg-black text-emerald-400 font-mono';
    if (isVintage) return 'bg-[#fdf6e3] text-stone-900 serif';
    if (isLuxury) return 'bg-white text-slate-900 font-serif';
    if (isVSL) return 'bg-slate-900 text-white';
    if (isClean) return 'bg-white text-slate-900';
    return 'bg-slate-50 text-slate-900';
  };

  const getProductCardClass = () => {
    const base = 'group overflow-hidden transition-all duration-500 relative flex flex-col h-full ';
    if (isLuxury) return base + 'rounded-none border-b border-slate-200 bg-white hover:bg-slate-50';
    if (isInsta) return base + 'rounded-sm border border-slate-100 bg-white';
    if (isTikTok) return base + 'rounded-[2.5rem] border-none bg-white/5 backdrop-blur-md shadow-xl';
    if (isFuture) return base + 'rounded-none border border-emerald-500/30 bg-black hover:border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)]';
    if (isVintage) return base + 'rounded-xl border-2 border-stone-800 bg-white shadow-[4px_4px_0px_#292524] hover:shadow-[8px_8px_0px_#292524]';
    if (isMinimal) return base + 'border-none bg-transparent hover:scale-105';
    if (isDark || isVSL) return base + 'bg-slate-900 border-slate-800 rounded-[2.5rem]';
    if (isModern) return base + 'bg-white border-2 border-black rounded-none hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[8px_8px_0px_black]';
    if (isClean) return base + 'bg-white rounded-3xl border border-slate-50 shadow-sm hover:shadow-xl';
    return base + 'bg-white border-slate-100 rounded-[2.5rem] shadow-sm hover:shadow-2xl hover:-translate-y-2';
  };

  const getButtonClass = (isProduct = false) => {
    const common = "transition-all flex items-center justify-center ";
    if (isFuture) return common + "bg-emerald-500 text-black font-black uppercase tracking-widest px-6 py-4 rounded-none h-auto";
    if (isLuxury) return common + "bg-transparent border-b-2 border-slate-900 text-slate-900 px-2 py-1 font-serif h-auto";
    if (isVintage) return common + "bg-stone-800 text-white rounded-xl h-14 w-14";
    if (isModern) return common + "bg-black text-white px-6 py-4 rounded-none h-auto font-black uppercase";
    if (isDark || isVSL) return common + "bg-white text-slate-900 rounded-2xl h-14 w-14";
    if (isClean) return common + "bg-brand-primary text-white px-8 py-3 rounded-full h-auto font-bold";
    return common + "bg-slate-900 text-white rounded-2xl h-14 w-14 shadow-xl";
  };

  return (
    <div className={`min-h-screen pb-20 overflow-x-hidden transition-colors duration-700 ${getContainerClass()}`} style={{ fontFamily: settings.arabicFont || 'Tajawal, sans-serif' }}>
      {/* Header */}
      <header className={`border-b sticky top-0 z-40 shadow-sm transition-colors ${
        isFuture ? 'bg-black/90 border-emerald-500/50' : 
        (isDark || isVSL) ? 'bg-slate-900/80 backdrop-blur-md border-slate-800' : 
        isVintage ? 'bg-[#fdf6e3] border-stone-800' : 
        isModern ? 'bg-white border-b-4 border-black' :
        'bg-white/80 backdrop-blur-md border-slate-100'
      }`}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
             {settings.logo ? (
               <img src={settings.logo} alt={settings.storeName} className="h-10 object-contain" />
             ) : (
               <span className={`text-xl font-black italic tracking-tighter ${isFuture ? 'text-emerald-400' : isModern ? 'uppercase' : ''}`} style={(!isFuture && !isModern) ? { color: themeColor } : {}}>
                 {settings.storeName}
               </span>
             )}
          </div>
          <div className="flex items-center gap-4">
             <a href={`tel:${settings.whatsappNumber || ''}`} className={`p-3 rounded-2xl transition-colors ${
               isFuture ? 'text-emerald-500 border border-emerald-500/30' :
               (isDark || isVSL) ? 'bg-slate-800 text-slate-500 hover:text-emerald-400' : 
               isVintage ? 'border-2 border-stone-800 bg-white' : 
               isModern ? 'border-2 border-black text-black' :
               'bg-slate-50 text-slate-400 hover:text-emerald-500'
             }`}>
                <Phone className="w-5 h-5" />
             </a>
             <button className={`p-3 rounded-2xl flex items-center justify-center shadow-lg transition-all ${
               isFuture ? 'bg-emerald-500 text-black' :
               (isDark || isVSL) ? 'bg-white text-slate-900 shadow-white/5' : 
               isModern ? 'bg-black text-white rounded-none' :
               'bg-slate-900 text-white shadow-slate-200'
             }`}>
                <ShoppingBag className="w-5 h-5" />
             </button>
          </div>
        </div>
      </header>

      {/* Hero / Banner Section */}
      {(!isMinimal && !isInsta && !isTikTok) && (
        <section className={`${isModern || isLuxury ? 'max-w-full px-0 mt-0' : 'max-w-7xl mx-auto px-4 mt-6'}`}>
           <div className={`relative overflow-hidden transition-all duration-700 ${
             isLuxury ? 'h-[700px] bg-slate-950 shadow-none' : 
             isFuture ? 'h-[500px] rounded-none border-y border-emerald-500/50' :
             isVintage ? 'h-96 rounded-none border-b-4 border-stone-800' :
             isModern ? 'h-[80vh] bg-black text-white' :
             isVSL ? 'h-screen flex items-center justify-center bg-slate-900 shadow-none' :
             'h-48 md:h-[500px] rounded-[3rem] shadow-2xl'
           }`}>
              {settings.banner ? (
                <img src={settings.banner} className={`w-full h-full object-cover ${isLuxury ? 'opacity-60' : isVSL ? 'opacity-40' : ''}`} alt="Banner" />
              ) : (
                <div className={`w-full h-full ${isFuture || isDark || isVSL ? 'bg-slate-900' : 'bg-slate-200'} animate-pulse`} />
              )}
              
              <div className={`absolute inset-0 flex items-center justify-center p-10 bg-gradient-to-t ${
                isFuture ? 'from-black via-black/40' : 
                isModern ? 'from-black/80' :
                isVSL ? 'from-slate-950/90' :
                'from-black/60 via-transparent'
              } to-transparent`}>
                 <div className={`max-w-4xl text-center ${isModern ? 'text-left w-full' : ''}`}>
                    <motion.h1 
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={`font-black tracking-tight leading-none ${
                        isLuxury ? 'text-7xl md:text-9xl text-white font-serif mb-6' : 
                        isFuture ? 'text-5xl md:text-8xl font-mono uppercase tracking-[0.3em] text-emerald-400 mb-4' :
                        isModern ? 'text-6xl md:text-[12rem] uppercase leading-[0.8] mb-8' :
                        isVSL ? 'text-4xl md:text-7xl text-white mb-8' :
                        'text-4xl md:text-7xl text-white'
                      }`}
                    >
                      {settings.storeName}
                    </motion.h1>
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className={`flex flex-col items-center gap-6`}
                    >
                      <p className={`font-bold font-arabic text-xl md:text-3xl italic ${
                        isFuture ? 'text-emerald-500/70 border-l-4 border-emerald-500 pl-4' : 
                        isModern ? 'text-brand-primary' :
                        'text-white/90'
                      }`}>
                        {isVSL ? "شاهد العرض الحصري اليوم" : "مرحباً بكم في متجرنا الرسمي"}
                      </p>
                      
                      {isVSL && (
                        <div className="w-full max-w-2xl aspect-video bg-black rounded-3xl shadow-2xl overflow-hidden border-4 border-white/10 ring-1 ring-white/5">
                           <div className="w-full h-full flex items-center justify-center">
                              <ShoppingBag className="w-16 h-16 text-white/20 animate-pulse" />
                           </div>
                        </div>
                      )}

                      {(isModern || isLuxury || isVSL) && (
                        <button className={`mt-8 px-12 py-5 font-black uppercase tracking-widest transition-all ${
                          isModern ? 'bg-white text-black hover:bg-brand-primary' :
                          isLuxury ? 'bg-transparent border-2 border-white text-white hover:bg-white hover:text-black' :
                          isVSL ? 'bg-brand-primary text-white scale-110 shadow-2xl shadow-indigo-500/50' :
                          'bg-white text-black'
                        }`}>
                          Explorer la Collection
                        </button>
                      )}
                    </motion.div>
                 </div>
              </div>
           </div>
        </section>
      )}

      {/* Trust Bar */}
      {!isInsta && !isTikTok && !isMinimal && (
        <section className={`max-w-6xl mx-auto px-6 grid grid-cols-2 lg:grid-cols-4 gap-6 ${isModern ? 'mt-0 bg-black py-12 max-w-full' : 'mt-12'}`}>
           {[
             { icon: Truck, title: 'توصيل سريع', desc: 'إلى 24 ولاية', color: 'orange' },
             { icon: RefreshCcw, title: 'تبديل سهل', desc: 'في حالة العطب', color: 'indigo' },
             { icon: CheckCircle2, title: 'دفع عند الاستلام', desc: 'تسوّق بأمان', color: 'emerald' },
             { icon: MessageCircle, title: 'دعم فني', desc: 'متاح 24/7', color: 'blue' }
           ].map((t, i) => (
             <div key={i} className={`p-6 flex flex-col items-center text-center group transition-all ${
               isFuture ? 'border border-emerald-500/20 bg-black/40 box-glow' :
               isVintage ? 'border-2 border-stone-800 bg-white shadow-[2px_2px_0px_#292524]' :
               isModern ? 'border border-white/10 text-white hover:bg-white/5' :
               isDark || isVSL ? 'bg-slate-900/50 border-slate-800 rounded-3xl' : 'bg-white border-slate-100 rounded-3xl shadow-sm'
             }`}>
                <div className={`w-12 h-12 rounded-2xl mb-4 flex items-center justify-center transition-colors ${
                  isFuture ? 'text-emerald-400' :
                  isModern ? 'text-brand-primary' :
                  isDark || isVSL ? 'bg-slate-800 text-white' : `bg-${t.color}-50 text-${t.color}-500`
                }`}>
                   <t.icon className="w-6 h-6" />
                </div>
                <h4 className={`text-sm font-black font-arabic ${isFuture || isModern ? 'text-white' : ''}`}>{t.title}</h4>
                <p className="text-[0.6rem] text-slate-400 font-bold uppercase tracking-tight mt-1">{t.desc}</p>
             </div>
           ))}
        </section>
      )}

      {/* Products Grid */}
      <section className={`max-w-7xl mx-auto px-6 ${isInsta || isTikTok ? 'mt-10' : 'mt-24'}`}>
         {(!isInsta && !isTikTok) && (
           <div className="flex items-center justify-between mb-16">
              <div className={`h-px flex-1 ${isFuture ? 'bg-emerald-500/30' : isDark ? 'bg-slate-800' : 'bg-slate-200'}`} />
              <h2 className={`px-8 text-3xl font-black font-arabic italic ${isFuture ? 'text-emerald-400 tracking-[0.5em]' : ''}`}>
                {isFuture ? 'CATALOGUE_SYSTEM' : 'منتجاتنا المختارة'}
              </h2>
              <div className={`h-px flex-1 ${isFuture ? 'bg-emerald-500/30' : isDark ? 'bg-slate-800' : 'bg-slate-200'}`} />
           </div>
         )}

         <div className={`grid gap-x-6 gap-y-12 ${
           isInsta ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1 md:gap-4 px-0 md:px-6' : 
           isMega ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5' :
           isMinimal ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-20' :
           'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
         }`}>
            {products.length === 0 ? (
              <div className="col-span-full py-20 text-center font-bold text-slate-400 uppercase tracking-widest text-xs italic">Auncun produit disponible pour le moment</div>
            ) : products.map(product => (
              <Link 
                key={product.id} 
                to={`/s/${product.landingPages && product.landingPages[0]?.slug ? product.landingPages[0].slug : ''}`}
                className="group no-underline"
              >
                <div className={getProductCardClass()}>
                   {/* Promo Badge */}
                   {product.comparePrice > product.price && (
                     <div className={`absolute top-6 right-6 z-10 px-4 py-1.5 rounded-full text-[0.6rem] font-black uppercase tracking-widest shadow-lg ${
                       isFuture ? 'bg-emerald-500 text-black shadow-emerald-500/50' :
                       isLuxury ? 'bg-slate-900 text-white' :
                       isVintage ? 'bg-stone-800 text-[#fdf6e3] border-none' :
                       isDark ? 'bg-white text-slate-950' : 'bg-orange-500 text-white animate-bounce'
                     }`}>
                        -{(((product.comparePrice - product.price) / product.comparePrice) * 100).toFixed(0)}%
                     </div>
                   )}
                   
                   <div className={`aspect-square relative overflow-hidden ${
                     isFuture ? 'bg-slate-900 border-b border-emerald-500/30' :
                     isDark ? 'bg-slate-800' : 'bg-slate-100'
                   } ${isInsta ? 'aspect-square' : isTikTok ? 'aspect-[2/3]' : ''}`}>
                      <img src={product.image} className={`w-full h-full object-cover transition-transform duration-1000 ${
                        isMinimal ? 'scale-95 group-hover:scale-100' : 'group-hover:scale-110'
                      }`} alt={product.name} />
                      
                      {isInsta && (
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                           <ShoppingBag className="text-white w-8 h-8" />
                        </div>
                      )}
                   </div>

                   {(!isInsta && !isTikTok) && (
                     <div className={`p-8 flex flex-col flex-1 ${isMinimal ? 'items-center text-center' : ''}`}>
                        <h3 className={`text-xl font-black group-hover:text-brand-primary transition-colors font-arabic mb-4 leading-relaxed ${
                          isFuture ? 'text-emerald-400 font-mono tracking-tighter' :
                          isLuxury ? 'font-serif text-2xl' :
                          isModern ? 'text-sm uppercase tracking-widest' :
                          (isDark || isVSL) ? 'text-white' : 'text-slate-900'
                        }`}>{product.name}</h3>
                        
                        <div className={`mt-auto flex ${isMinimal ? 'flex-col items-center gap-4' : 'items-end justify-between'}`}>
                           <div className="flex flex-col">
                              {!isMinimal && <span className="text-[0.65rem] font-black text-slate-400 uppercase tracking-widest opacity-60">Price_DT</span>}
                              <div className={`flex items-center gap-3 ${isMinimal ? 'justify-center' : ''}`}>
                                 <span className={`text-2xl font-black italic tracking-tighter ${isFuture ? 'text-emerald-400' : isModern ? 'text-black' : ''}`} style={(!isFuture && !isModern) ? { color: themeColor } : {}}>
                                   {product.price.toFixed(3)}
                                 </span>
                                 {(product.comparePrice > product.price && !isMinimal) && (
                                   <span className={`text-sm font-bold line-through tracking-tighter ${isDark || isVSL || isFuture ? 'text-slate-600' : 'text-slate-300'}`}>{product.comparePrice.toFixed(3)}</span>
                                 )}
                              </div>
                           </div>
                           <button className={getButtonClass(true)}>
                              {isFuture ? 'BUY' : isLuxury ? 'Selection' : isModern ? 'Add' : <ChevronRight className="w-6 h-6" />}
                           </button>
                        </div>
                     </div>
                   )}
                </div>
              </Link>
            ))}
         </div>
      </section>

      {/* Footer Branding */}
      <footer className={`mt-32 text-center py-20 border-t transition-colors ${
        isFuture ? 'bg-black border-emerald-500/20' :
        isDark ? 'bg-slate-900 border-slate-800' : 
        isVintage ? 'bg-[#fdf6e3] border-stone-800' :
        'bg-white border-slate-100'
      }`}>
         <div className="flex flex-col items-center gap-4">
            <div className={`px-6 py-2 rounded-full inline-flex items-center gap-2 ${
              isFuture ? 'border border-emerald-500/30' :
              isDark ? 'bg-white/5' : 'bg-slate-900/5'
            }`}>
               <span className="text-[0.6rem] font-bold text-slate-400 uppercase tracking-widest">Powered by</span>
               <span className={`text-[0.7rem] font-black uppercase tracking-widest ${isFuture ? 'text-emerald-400' : ''}`}>ConvertyFlow</span>
            </div>
            <p className="text-[0.65rem] text-slate-400 font-bold uppercase tracking-tight italic">Commerce sans limites • 2026</p>
         </div>
      </footer>
    </div>
  );
}
