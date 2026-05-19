import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingCart, Phone, MapPin, User, ChevronRight, CheckCircle, RefreshCcw, Smartphone, Play, Timer, Instagram as InstagramIcon } from 'lucide-react';
import { useForm } from 'react-hook-form';

// --- Countdown Timer Component ---
interface CountdownProps {
  enabled?: boolean;
  title?: string;
  durationHours?: number;
}

function CountdownTimer({ enabled, title, durationHours = 24 }: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState((durationHours * 3600));

  useEffect(() => {
    if (!enabled) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => prev > 0 ? prev - 1 : 0);
    }, 1000);
    return () => clearInterval(timer);
  }, [enabled, durationHours]);

  if (!enabled) return null;

  const h = Math.floor(timeLeft / 3600);
  const m = Math.floor((timeLeft % 3600) / 60);
  const s = timeLeft % 60;

  return (
    <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-center justify-between font-arabic mb-6 overflow-hidden relative">
      <div className="bg-red-500 text-white px-3 py-1 rounded-full text-[0.6rem] font-black uppercase tracking-widest animate-pulse flex items-center gap-1 z-10">
        <Timer className="w-3 h-3" />
        {title || "عرض محدود ينتهي في:"}
      </div>
      <div className="flex gap-2 items-center z-10">
        {[h, m, s].map((val, i) => (
          <div key={i} className="flex flex-col items-center">
            <span className="text-xl font-black text-red-600 bg-white min-w-[2.5rem] h-10 flex items-center justify-center rounded-xl border border-red-100 shadow-sm px-1">
              {val.toString().padStart(2, '0')}
            </span>
            <span className="text-[0.5rem] font-bold text-red-400 mt-1">
              {['ساعة', 'دقيقة', 'ثانية'][i]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function LandingPageRenderer() {
  const { slug } = useParams();
  const [page, setPage] = useState<any>(null);
  const [shop, setShop] = useState<any>(null);
  const [product, setProduct] = useState<any>(null);
  const [selectedOffer, setSelectedOffer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orderComplete, setOrderComplete] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [leadId, setLeadId] = useState<string | null>(null);

  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  
  const customerName = watch("customerName");
  const customerPhone = watch("customerPhone");
  const customerAddress = watch("customerAddress");
  const customerCity = watch("customerCity");

  useEffect(() => {
    const timer = setTimeout(() => {
      // Relaxed condition: at least 2 chars for name and phone
      if (!orderComplete && customerName && customerName.length >= 2 && customerPhone && customerPhone.length >= 4 && page) {
         fetch('/api/public/capture-lead', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ 
             customerName, 
             customerPhone, 
             customerAddress,
             customerCity,
             userId: page.userId,
             leadId: leadId || undefined,
             productName: page.product?.name || page.title
           })
         })
         .then(res => {
           if (!res.ok) throw new Error("Server error");
           return res.json();
         })
         .then(data => {
           if (data.id && !leadId) {
             setLeadId(data.id);
           }
         })
         .catch(err => console.error("Lead capture failed:", err));
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [customerName, customerPhone, customerAddress, customerCity, leadId, page, orderComplete]);

  useEffect(() => {
    fetch(`/api/public/landing-page/${slug}`)
      .then(res => {
        if (res.status === 503) {
          setError("Platforme en maintenance. Revenez plus tard.");
          return null;
        }
        return res.json();
      })
      .then(data => {
        if (data && !data.error) {
          setPage(data);
          setShop(data.user.settings);
          setProduct(data.product);
          // Auto-select first offer if available
          if (data.product?.offers?.length > 0) {
            setSelectedOffer(data.product.offers[0]);
          }
        } else if (data && data.error) {
          setError(data.error);
        }
      })
      .catch(err => {
        console.error(err);
        setError("Erreur de chargement.");
      })
      .finally(() => setLoading(false));
  }, [slug]);

  const onSubmit = async (data: any) => {
    if (submitting) return;
    setSubmitting(true);
    const unitPrice = selectedOffer ? selectedOffer.price : product.price;
    const subtotal = unitPrice * quantity;
    const isFreeShipping = product.freeShipping || subtotal >= shop.freeShippingMin;
    const deliveryFee = isFreeShipping ? 0 : shop.fixedDelivery;
    
    try {
      const res = await fetch('/api/public/complete-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          total: subtotal + deliveryFee,
          deliveryFee,
          userId: page.userId,
          leadId,
          productName: product.name,
          items: [{ 
            name: product.name, 
            price: unitPrice,
            quantity,
            offer: selectedOffer?.text 
          }]
        })
      });

      if (res.ok) setOrderComplete(true);
    } catch (err) {
      console.error("Order completion failed:", err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-20 text-center font-bold">Chargement...</div>;
  if (error) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center">
       <div className="bg-white p-10 rounded-[3rem] shadow-2xl shadow-slate-200 max-w-sm w-full border border-slate-100">
          <div className="w-20 h-20 bg-amber-50 text-amber-500 rounded-3xl flex items-center justify-center mx-auto mb-6 transform rotate-3">
             <RefreshCcw className="w-10 h-10 animate-spin" />
          </div>
          <h2 className="text-xl font-black text-slate-900 mb-2 font-arabic">عذراً، المتجر في صيانة</h2>
          <p className="text-sm font-medium text-slate-400 font-arabic leading-relaxed">{error}</p>
       </div>
    </div>
  );
  if (!page) return <div className="p-20 text-center font-bold">Page introuvable.</div>;

  const currentPrice = selectedOffer ? selectedOffer.price : product.price;
  const shipping = (product.freeShipping || currentPrice >= shop.freeShippingMin) ? 0 : shop.fixedDelivery;

  const renderOrderForm = (sectionTitle?: string) => {
    if (orderComplete) {
      return (
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center bg-white p-10 rounded-2xl shadow-xl"
        >
          <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
          <h2 className="text-3xl font-black mb-2">شكراً لطلبك!</h2>
          <p className="text-gray-500">تم تسجيل طلبك بنجاح. سنتصل بك قريباً لتأكيد التوصيل.</p>
        </motion.div>
      );
    }

    const unitPrice = selectedOffer ? selectedOffer.price : product.price;
    const subtotal = unitPrice * quantity;
    const isFreeShipping = product.freeShipping || subtotal >= shop.freeShippingMin;
    const shipping = isFreeShipping ? 0 : shop.fixedDelivery;

    return (
      <section id="order-form" className="bg-white rounded-2xl shadow-xl p-6 border-2 border-dashed border-gray-200">
        <h3 className="text-xl font-bold mb-6 flex items-center justify-center gap-2 text-slate-800 font-arabic text-center leading-relaxed">
          <CheckCircle className="w-6 h-6 text-green-600" />
          {sectionTitle || "قم بإدخال معلوماتك الصحيحة للطلب"}
        </h3>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {!orderComplete && product && (
            <div className="space-y-3 mb-6">
               <label className="block font-black text-right mb-2">إختر عرضك المفضل:</label>
               <div className="space-y-3">
                  {/* Default Price */}
                  <div 
                    onClick={() => setSelectedOffer(null)}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex justify-between items-center ${!selectedOffer ? 'border-brand-primary bg-indigo-50/50' : 'border-slate-100 bg-slate-50/50'}`}
                  >
                    <div className="text-right">
                       <p className="font-bold text-sm">قطعة واحدة</p>
                       {product.comparePrice && product.comparePrice > product.price && (
                         <span className="text-[0.7rem] text-slate-300 font-bold line-through ml-2">{product.comparePrice.toFixed(3)} DT</span>
                       )}
                       <p className="text-[0.65rem] text-slate-400 font-bold">Sûr et rapide</p>
                    </div>
                    <div className="text-lg font-black text-slate-900">{product.price.toFixed(3)} DT</div>
                  </div>

                  {/* Special Offers */}
                  {product.offers?.map((offer: any, idx: number) => (
                    <div 
                      key={idx}
                      onClick={() => setSelectedOffer(offer)}
                      className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex justify-between items-center ${selectedOffer?.text === offer.text ? 'border-brand-primary bg-indigo-50/50' : 'border-slate-100 bg-slate-50/50'}`}
                    >
                      <div className="text-right">
                         <p className="font-black text-sm text-slate-900">{offer.text}</p>
                         <p className="text-[0.6rem] bg-orange-500 text-white px-3 py-1 rounded-full inline-block font-black uppercase tracking-widest mt-1">Promotion</p>
                      </div>
                      <div className="text-lg font-black text-slate-900">{offer.price.toFixed(3)} DT</div>
                    </div>
                  ))}
               </div>

               {/* Quantity Counter */}
               <div className="mt-8 pt-6 border-t border-slate-100">
                  <label className="block font-black text-right mb-3 font-arabic">الكمية المطلوبة:</label>
                  <div className="flex items-center justify-center gap-6">
                     <button 
                       type="button" 
                       onClick={() => setQuantity(Math.max(1, quantity - 1))}
                       className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center font-black text-xl hover:bg-slate-200 transition-colors"
                     >-</button>
                     <span className="text-2xl font-black">{quantity}</span>
                     <button 
                       type="button"
                       onClick={() => setQuantity(quantity + 1)}
                       className="w-12 h-12 rounded-2xl bg-brand-primary text-white flex items-center justify-center font-black text-xl hover:opacity-90 transition-opacity"
                       style={{ backgroundColor: shop.primaryColor }}
                     >+</button>
                  </div>
               </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="block font-bold text-right font-arabic">الاسم واللقب</label>
            <div className="relative">
              <User className="absolute right-3 top-3 w-5 h-5 text-gray-400" />
              <input 
                {...register("customerName", { required: true })}
                className="w-full bg-slate-50 border-2 border-gray-100 rounded-xl py-3 pr-10 focus:border-brand-primary outline-none transition-all text-right font-arabic" 
                placeholder="مثال: أحمد بن علي"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block font-bold text-right font-arabic">رقم الهاتف</label>
            <div className="relative">
              <Phone className="absolute right-3 top-3 w-5 h-5 text-gray-400" />
              <input 
                {...register("customerPhone", { required: true })}
                className="w-full bg-slate-50 border-2 border-gray-100 rounded-xl py-3 pr-10 focus:border-brand-primary outline-none transition-all text-right font-arabic" 
                placeholder="2xxxxxxx"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block font-bold text-right font-arabic">الولاية (Gouvernorat)</label>
            <div className="relative">
              <MapPin className="absolute right-3 top-3 w-5 h-5 text-gray-400" />
              <select 
                {...register("customerCity", { required: true })}
                className="w-full bg-slate-50 border-2 border-gray-100 rounded-xl py-3 pr-10 focus:border-brand-primary outline-none transition-all text-right font-arabic appearance-none"
              >
                <option value="">إختر الولاية...</option>
                {["Ariana", "Béja", "Ben Arous", "Bizerte", "Gabès", "Gafsa", "Jendouba", "Kairouan", "Kasserine", "Kebili", "Kef", "Mahdia", "Manouba", "Medenine", "Monastir", "Nabeul", "Sfax", "Sidi Bouzid", "Siliana", "Sousse", "Tataouine", "Tozeur", "Tunis", "Zaghouan"].map(gov => (
                  <option key={gov} value={gov}>{gov}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="block font-bold text-right font-arabic">العنوان الكامل</label>
            <div className="relative">
              <MapPin className="absolute right-3 top-3 w-5 h-5 text-gray-400" />
              <input 
                {...register("customerAddress", { required: true })}
                className="w-full bg-slate-50 border-2 border-gray-100 rounded-xl py-3 pr-10 focus:border-brand-primary outline-none transition-all text-right font-arabic" 
                placeholder="نهج، رقم المنزل، الترقيم البريدي"
              />
            </div>
          </div>

          <div className="bg-slate-900 p-6 rounded-2xl space-y-3 text-sm text-white shadow-xl shadow-slate-100">
            <div className="flex justify-between items-center text-slate-400">
              <span className="font-bold font-arabic">سعر الوحدة:</span>
              <span className="font-black">{unitPrice.toFixed(3)} DT</span>
            </div>
            <div className="flex justify-between items-center text-slate-400">
              <span className="font-bold font-arabic">المجموع الفرعي ({quantity} ×):</span>
              <span className="font-black">{subtotal.toFixed(3)} DT</span>
            </div>
            <div className="flex justify-between items-center text-slate-400">
              <span className="font-bold font-arabic">سعر التوصيل:</span>
              <span className={shipping === 0 ? "text-emerald-400 font-black font-arabic" : "font-black font-arabic"}>
                {shipping === 0 ? "مجاني" : `+ ${shipping.toFixed(3)} DT`}
              </span>
            </div>
            <div className="border-t border-slate-800 pt-3 flex justify-between items-center text-xl font-black">
              <span className="font-arabic">المجموع الإجمالي:</span>
              <span className="text-brand-primary" style={{ color: shop.primaryColor }}>{(subtotal + shipping).toFixed(3)} DT</span>
            </div>
          </div>

          <button 
            type="submit"
            disabled={submitting}
            className={`w-full py-4 rounded-2xl text-white text-xl font-black shadow-lg shadow-orange-200 transition-all active:scale-95 flex items-center justify-center gap-2 font-arabic ${submitting ? 'opacity-70 cursor-not-allowed grayscale' : ''}`}
            style={{ backgroundColor: shop.primaryColor }}
          >
            {submitting ? '...جاري التحميل' : 'أطلب الآن - الدفع عند الاستلام'}
            <ChevronRight className="w-6 h-6" />
          </button>
        </form>
      </section>
    );
  };

  const templateId = page.user?.templateId || 'basic';
  
  // Template-specific logic matches PublicStore
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

  const hasFormSection = (page.content.sections || []).some((s: any) => s.type === 'form');

  const getContainerClass = () => {
    if (isDark) return 'bg-slate-950 text-white';
    if (isFuture) return 'bg-black text-emerald-400 font-mono';
    if (isVintage) return 'bg-[#fdf6e3] text-stone-900 serif';
    if (isLuxury) return 'bg-white text-slate-900 font-serif';
    if (isVSL) return 'bg-slate-900 text-white';
    if (isClean) return 'bg-white text-slate-900';
    if (isModern) return 'bg-white text-slate-900 font-sans uppercase-titles';
    return 'bg-slate-50 text-slate-900';
  };

  const getSectionClass = () => {
    if (isFuture) return 'bg-black/40 border border-emerald-500/30 rounded-none shadow-[0_0_15px_rgba(16,185,129,0.1)]';
    if (isVintage) return 'bg-white border-2 border-stone-800 rounded-xl shadow-[4px_4px_0px_#292524]';
    if (isLuxury) return 'bg-white border-b border-slate-200 rounded-none shadow-none';
    if (isModern) return 'bg-white border-4 border-black rounded-none shadow-none';
    if (isDark || isVSL) return 'bg-slate-900 border border-slate-800 rounded-[2.5rem]';
    if (isClean) return 'bg-white rounded-3xl border border-slate-50 shadow-sm';
    return 'bg-white border border-slate-100 rounded-[2.5rem] shadow-sm';
  };

  const getButtonClass = () => {
    if (isFuture) return 'bg-emerald-500 text-black rounded-none font-black uppercase tracking-widest';
    if (isVintage) return 'bg-stone-800 text-white rounded-xl';
    if (isLuxury) return 'bg-slate-900 text-white rounded-none font-serif';
    if (isModern) return 'bg-black text-white rounded-none font-black uppercase';
    return 'bg-brand-primary text-white rounded-2xl';
  };

  return (
    <div 
      className={`rtl min-h-screen pb-24 transition-colors duration-700 font-arabic ${getContainerClass()}`} 
      style={{ fontFamily: shop.arabicFont || 'Tajawal, sans-serif' }}
    >
      {/* Dynamic Header */}
      <header className={`p-4 text-center border-b ${
        isFuture ? 'bg-black border-emerald-500/50' : 
        isVintage ? 'bg-[#fdf6e3] border-b-2 border-stone-800' :
        isModern ? 'bg-white border-b-4 border-black' :
        (isDark || isVSL) ? 'bg-slate-900 border-slate-800' : 'bg-white shadow-sm border-slate-100'
      }`}>
        {shop.logo ? (
          <img src={shop.logo} alt={shop.name} className="h-10 mx-auto" />
        ) : (
          <h1 className={`text-xl font-extrabold ${isFuture ? 'text-emerald-400 tracking-tighter italic' : isModern ? 'uppercase font-black' : ''}`} style={(!isFuture && !isModern) ? { color: shop.primaryColor } : {}}>
            {shop.storeName || page.user.shopName}
          </h1>
        )}
      </header>

      <main className="max-w-md mx-auto p-4 space-y-6">
        {/* Countdown Timer Block */}
        <div className={isFuture ? 'p-1 bg-emerald-500' : ''}>
           <CountdownTimer 
            enabled={page.content.countdown?.enabled} 
            title={page.content.countdown?.title} 
            durationHours={page.content.countdown?.durationHours} 
          />
        </div>

        {/* Trust Badges */}
        {!isMinimal && (
          <section className={`p-6 flex justify-around items-center text-center border ${getSectionClass()}`}>
            {[
              { icon: CheckCircle, color: 'emerald', text: 'دفع عند الاستلام' },
              { icon: RefreshCcw, color: 'blue', text: 'تبديل سهل' },
              { icon: Smartphone, color: 'orange', text: 'توصيل سريــع' }
            ].map((b, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  isFuture ? 'text-emerald-400 border border-emerald-500/30' :
                  isDark ? 'bg-slate-800 text-slate-300' : `bg-${b.color}-50 text-${b.color}-600`
                }`}>
                  <b.icon className="w-6 h-6" />
                </div>
                <span className={`text-[0.65rem] font-bold ${isDark ? 'text-slate-400' : 'text-slate-800'}`}>{b.text}</span>
              </div>
            ))}
          </section>
        )}

        {/* Hero Section */}
        <section className={`overflow-hidden ${getSectionClass()}`}>
          {page.content.hero.image && (
             <div className="relative w-full h-auto">
                {page.content.hero.image.match(/\.(mp4|webm|ogg|mov)$/i) || page.content.hero.image.includes('video') ? (
                  <video 
                    src={page.content.hero.image} 
                    className="w-full h-auto block" 
                    controls 
                    autoPlay 
                    muted 
                    loop 
                    playsInline
                  />
                ) : (
                  <img src={page.content.hero.image} className="w-full h-auto block" />
                )}
             </div>
          )}
          <div className="p-8 text-center">
            <h2 className={`text-2xl font-black mb-2 ${isFuture ? 'text-emerald-400' : ''}`}>{page.content.hero.title}</h2>
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{page.content.hero.subtitle}</p>
          </div>
        </section>

        {/* Dynamic Builder Sections */}
        {(page.content.sections || []).map((section: any) => (
          <div key={section.id} className="space-y-6">
             {section.type === 'text' && (
               <section className={`p-8 text-right ${getSectionClass()}`}>
                  <p className={`whitespace-pre-wrap font-bold leading-relaxed ${
                    isFuture ? 'text-emerald-300 font-mono text-xs' : 
                    isDark ? 'text-slate-300' : 'text-slate-700'
                  }`}>{section.content.text}</p>
               </section>
             )}

             {section.type === 'gallery' && (
                <section className={`flex flex-col gap-6 overflow-hidden ${isInsta || isTikTok ? 'px-0' : ''}`}>
                   {(section.content.images || []).map((img: string, i: number) => (
                     <div key={i} className={`w-full overflow-hidden ${getSectionClass()} !p-0`}>
                        {img.match(/\.(mp4|webm|ogg|mov)$/i) || img.includes('video') ? (
                          <video 
                            src={img} 
                            className="w-full h-auto block" 
                            controls={false}
                            autoPlay
                            muted
                            loop
                            playsInline
                          />
                        ) : (
                          <img src={img} className="w-full h-auto block" alt="" />
                        )}
                     </div>
                   ))}
                </section>
             )}

             {section.type === 'features' && (
               <section className={`p-8 text-right ${getSectionClass()}`}>
                 <ul className="space-y-4">
                    {(section.content.items || []).map((item: string, i: number) => (
                      <li key={i} className="flex items-center justify-end gap-3 font-bold">
                        <span className={isDark ? 'text-slate-200' : 'text-slate-800'}>{item}</span>
                        <div className={`p-1 rounded-full ${isFuture ? 'bg-emerald-500/20' : 'bg-emerald-50'}`}>
                           <CheckCircle className={`w-4 h-4 ${isFuture ? 'text-emerald-400' : 'text-emerald-500'} shrink-0`} />
                        </div>
                      </li>
                    ))}
                 </ul>
               </section>
             )}

             {section.type === 'form' && renderOrderForm(section.content.title)}
          </div>
        ))}

        {/* Fallback Form at bottom if no form section was added */}
        {!hasFormSection && renderOrderForm()}

        {/* Branding */}
        {(!page.user?.isPremium) && (
          <footer className="pt-16 pb-8 text-center">
             <div className={`px-6 py-3 rounded-full inline-flex items-center gap-2 group transition-all ${
               isFuture ? 'border border-emerald-500/20 text-emerald-500' :
               isDark ? 'bg-white/5 text-slate-400' : 'bg-slate-900 text-white'
             }`}>
                <span className="text-[0.6rem] font-bold uppercase tracking-widest opacity-60">Powered by</span>
                <span className="text-[0.7rem] font-black uppercase tracking-widest">ConvertyFlow</span>
             </div>
          </footer>
        )}
      </main>

      {/* Floating CTA Button (Mobile Only) */}
      <AnimatePresence>
        {!orderComplete && (
          <motion.div 
            initial={{ y: 200, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 200, opacity: 0 }}
            className={`fixed bottom-0 left-0 right-0 p-4 z-50 md:hidden flex items-center gap-4 border-t ${
              isFuture ? 'bg-black/90 border-emerald-500/30' :
              isDark ? 'bg-slate-900/90 backdrop-blur-md border-slate-800' : 'bg-white/90 backdrop-blur-md border-slate-100 shadow-2xl'
            }`}
          >
           <div className="flex-1">
             <p className="text-[0.6rem] font-bold text-slate-400 text-right mb-0.5">الدفع عند الاستلام</p>
             <p className={`text-xl font-black text-right leading-none ${isFuture ? 'text-emerald-400' : 'text-slate-900'}`}>
               {(currentPrice + shipping).toFixed(3)} <span className="text-[0.6rem] opacity-50">DT</span>
             </p>
           </div>
           <button 
              onClick={() => {
                const form = document.getElementById('order-form');
                if (form) form.scrollIntoView({ behavior: 'smooth' });
              }}
              className={`flex-[2] py-4 font-black text-lg transition-all active:scale-95 flex items-center justify-center gap-2 group ${getButtonClass()}`}
              style={!isFuture && !isVintage && !isLuxury ? { backgroundColor: shop.primaryColor } : {}}
            >
              إحجز طلبك الآن
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
