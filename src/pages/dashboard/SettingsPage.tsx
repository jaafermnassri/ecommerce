import React, { useState, useEffect } from 'react';
import { Palette, Share2, Receipt, Image, Layout, Save, Loader2, Database, Smartphone, Users, MessageCircle, Crown, Tv, Instagram, Type, ShoppingBag, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { MediaUploader } from '../../components/MediaUploader';

export default function SettingsPage() {
  const { token, user: authUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [templateId, setTemplateId] = useState('basic');
  const [settings, setSettings] = useState({
    storeName: '',
    primaryColor: '#38bdf8',
    logo: '',
    freeShippingMin: 150,
    fixedDelivery: 7,
    tiktokPixel: '',
    facebookPixel: '',
    banner: '',
    whatsappAssistantEnabled: false,
    arabicFont: 'Tajawal'
  });

  const [googleSheetUrl, setGoogleSheetUrl] = useState('');
  const [serviceAccountEmail, setServiceAccountEmail] = useState('');
  const [googleSheetId, setGoogleSheetId] = useState('');
  const [subdomain, setSubdomain] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [settingsRes, statsRes, googleRes] = await Promise.all([
          fetch('/api/settings', { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch('/api/dashboard/stats', { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch('/api/v1/user/google-sheet/status', { headers: { 'Authorization': `Bearer ${token}` } })
        ]);
        
        const data = await settingsRes.json();
        const statsData = await statsRes.json();
        const googleData = await googleRes.json();
        
        if (data && !data.error) {
          setSettings(prev => ({
            ...prev,
            ...data,
            storeName: data.storeName ?? '',
            logo: data.logo ?? '',
            tiktokPixel: data.tiktokPixel ?? '',
            facebookPixel: data.facebookPixel ?? '',
            banner: data.banner ?? '',
            arabicFont: data.arabicFont ?? 'Tajawal'
          }));
        }
        
        if (statsData) {
          setIsPremium(statsData.isPremium || false);
          setSubdomain(statsData.subdomain || '');
        }

        if (googleData) {
          setServiceAccountEmail(googleData.serviceAccountEmail);
          setGoogleSheetId(googleData.googleSheetId || '');
          if (googleData.googleSheetId) {
            setGoogleSheetUrl(`https://docs.google.com/spreadsheets/d/${googleData.googleSheetId}`);
          }
        }

        // Fetch user profile for template and subdomain fallback
        const profileRes = await fetch('/api/auth/me', { headers: { 'Authorization': `Bearer ${token}` } });
        if (profileRes.ok) {
          const profile = await profileRes.json();
          setTemplateId(profile.templateId || 'basic');
          if (!subdomain && profile.subdomain) setSubdomain(profile.subdomain);
        }

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token]);

  const handleSave = async () => {
    setSaving(true);
    try {
      // 1. Save standard settings
      const settingsPromise = fetch('/api/settings', {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      });

      // 2. Save template
      const templatePromise = fetch('/api/user/template', {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ templateId })
      });

      // 3. Extract and save Google Sheet ID
      let googlePromise: Promise<any> = Promise.resolve();
      if (isPremium) {
        let spreadsheetId = '';
        if (googleSheetUrl) {
          const match = googleSheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
          if (match) spreadsheetId = match[1];
        }

        googlePromise = fetch('/api/v1/user/google-sheet', {
          method: 'POST',
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ spreadsheetId })
        });
      }

      await Promise.all([settingsPromise, templatePromise, googlePromise]);
      alert("Paramètres enregistrés avec succès !");
    } catch (err) {
      console.error(err);
      alert("Une erreur est survenue lors de l'enregistrement.");
    }
    setSaving(false);
  };

  if (loading) return <div className="flex items-center justify-center p-20 text-slate-400 font-bold uppercase tracking-widest animate-pulse">Chargement...</div>;

  return (
    <div className="max-w-[1000px] space-y-10 animate-in slide-in-from-bottom-4 duration-500 pb-32">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter italic">Réglages du Store</h1>
          <p className="text-slate-500 text-sm font-bold opacity-70">Personnalisez l'apparence et les intégrations de votre boutique.</p>
          {subdomain && (
            <a 
              href={`/store/${subdomain}`} 
              target="_blank" 
              rel="noreferrer"
              className="inline-flex items-center gap-2 mt-4 text-[0.65rem] font-black text-brand-primary bg-indigo-50 px-4 py-2 rounded-full uppercase tracking-widest hover:bg-brand-primary hover:text-white transition-all shadow-sm"
            >
              <Layout className="w-3.5 h-3.5" /> VOIR MA BOUTIQUE
            </a>
          )}
        </div>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="bg-brand-primary text-white font-black px-10 py-4 rounded-2xl flex items-center gap-3 shadow-xl shadow-brand-primary/20 hover:scale-[1.02] active:scale-95 transition-all text-sm disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          {saving ? 'Enregistrement...' : 'Sauvegarder'}
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Premium Status Banner */}
        <section className="pro-card space-y-4 md:col-span-2 flex flex-col sm:flex-row items-center justify-between bg-gradient-to-r from-slate-900 to-slate-800 text-white border-none shadow-2xl p-8 rounded-[2.5rem]">
          <div className="flex items-center gap-6">
            <div className={`p-4 rounded-2xl ${isPremium ? 'bg-amber-400 text-slate-900' : 'bg-slate-700 text-slate-400'}`}>
              <Crown className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight">{isPremium ? 'Compte Premium Activé' : 'Compte Standard'}</h2>
              <p className="text-slate-400 text-[0.65rem] font-bold uppercase tracking-widest leading-relaxed">
                {isPremium ? 'Toutes les intégrations sont débloquées.' : 'Passez au Premium pour activer Google Sheets et WhatsApp IA.'}
              </p>
            </div>
          </div>
          <button
            onClick={async () => {
              try {
                const res = await fetch('/api/admin/users/toggle-premium', {
                  method: 'POST',
                  headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({ userId: authUser?.id })
                });
                if (res.ok) window.location.reload();
                else alert("Erreur lors du changement de statut.");
              } catch (err) {
                console.error(err);
              }
            }}
            className="mt-4 sm:mt-0 px-6 py-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border border-white/10 backdrop-blur-md"
          >
            {isPremium ? 'Désactiver Premium (Dev)' : 'Devenir Premium (Dev)'}
          </button>
        </section>

        {/* Design Settings */}
        <section className="pro-card space-y-8 flex flex-col">
          <div className="flex items-center gap-4">
             <div className="p-3 bg-indigo-50 text-brand-primary rounded-2xl border border-indigo-100">
               <Palette className="w-5 h-5" />
             </div>
             <h3 className="text-sm font-bold text-slate-900">Identité Visuelle</h3>
          </div>
          
          <div className="space-y-6 flex-1">
            <div>
              <label className="text-xs font-bold text-slate-400 mb-2 block ml-2">Nom de la Boutique</label>
              <input 
                type="text" 
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm outline-none focus:border-brand-primary font-bold text-slate-700"
                placeholder="Ex: Ma Boutique"
                value={settings.storeName || ''}
                onChange={(e) => setSettings({...settings, storeName: e.target.value})}
              />
            </div>

            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
              <label className="text-xs font-bold text-slate-400 mb-4 block">Couleur de Marque</label>
              <div className="flex gap-4 items-center">
                <div className="relative group">
                  <div 
                    className="w-16 h-16 rounded-2xl border-4 border-white shadow-xl overflow-hidden relative cursor-pointer ring-2 ring-slate-100 ring-offset-2"
                    style={{ backgroundColor: settings.primaryColor }}
                  >
                    <input 
                      type="color" 
                      value={settings.primaryColor || '#38bdf8'}
                      onChange={(e) => setSettings({...settings, primaryColor: e.target.value})}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full scale-[5]"
                    />
                  </div>
                </div>
                <div className="flex-1">
                   <p className="text-[0.7rem] font-bold text-slate-400 mb-1.5 opacity-60">HEX Code</p>
                   <span className="text-sm font-bold text-slate-900 bg-white px-4 py-2 rounded-xl border border-slate-200 block w-fit">
                    {settings.primaryColor}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <label className="text-[0.65rem] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-2">Police Arabe (Font)</label>
              <select 
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm outline-none focus:border-brand-primary font-black text-slate-700 transition-all cursor-pointer"
                value={settings.arabicFont || 'Tajawal'}
                onChange={(e) => setSettings({...settings, arabicFont: e.target.value})}
              >
                <option value="Tajawal, sans-serif">Tajawal (Modern)</option>
                <option value="Cairo, sans-serif">Cairo (Clear)</option>
                <option value="Amiri, serif">Amiri (Traditional)</option>
                <option value="Almarai, sans-serif">Almarai (Corporate)</option>
              </select>
            </div>

            <div>
              <MediaUploader 
                label="Logo de la Boutique"
                type="image"
                initialUrl={settings.logo}
                onUploadComplete={(url) => setSettings({...settings, logo: url})}
                className="mb-6"
              />
            </div>

            <div>
              <MediaUploader 
                label="Bannière de la Boutique"
                type="image"
                initialUrl={settings.banner}
                onUploadComplete={(url) => setSettings({...settings, banner: url})}
                className="mb-6"
              />
            </div>
          </div>
        </section>

        {/* Integration Settings */}
        <section className="pro-card space-y-8 flex flex-col">
          <div className="flex items-center gap-4">
             <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl border border-amber-100">
               <Share2 className="w-5 h-5" />
             </div>
             <h3 className="text-sm font-bold text-slate-900">Tracking & Pixels</h3>
          </div>
          
          <div className="space-y-6 flex-1">
            <div>
              <label className="text-[0.65rem] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-2">TikTok Pixel ID</label>
              <div className="relative">
                <input 
                  type="text" 
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm outline-none focus:border-brand-primary font-medium pl-12"
                  placeholder="ID Unique"
                  value={settings.tiktokPixel || ''}
                  onChange={(e) => setSettings({...settings, tiktokPixel: e.target.value})}
                />
                <Smartphone className="absolute left-4 top-4.5 w-4 h-4 text-slate-400" />
              </div>
            </div>
            <div>
              <label className="text-[0.65rem] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-2">Facebook Pixel ID</label>
              <div className="relative">
                 <input 
                  type="text" 
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm outline-none focus:border-brand-primary font-medium pl-12"
                  placeholder="12345..."
                  value={settings.facebookPixel || ''}
                  onChange={(e) => setSettings({...settings, facebookPixel: e.target.value})}
                />
                <Users className="absolute left-4 top-4.5 w-4 h-4 text-slate-400" />
              </div>
            </div>
            <div className={`p-5 rounded-2xl border transition-all ${isPremium ? 'bg-indigo-50 border-indigo-100' : 'bg-slate-50 border-slate-100'}`}>
                <div className="flex items-center justify-between mb-2">
                   <div className="flex items-center gap-2">
                      <MessageCircle className={`w-4 h-4 ${isPremium ? 'text-brand-primary' : 'text-slate-400'}`} />
                      <span className="text-[0.65rem] font-black uppercase text-slate-900">Assistant WhatsApp IA</span>
                   </div>
                   {!isPremium && <Crown className="w-4 h-4 text-amber-500" />}
                </div>
                <div className="flex items-center justify-between">
                   <p className="text-[0.6rem] text-slate-500 font-bold max-w-[70%]">Activez l'IA pour répondre automatiquement à vos clients via WhatsApp.</p>
                   <button 
                    disabled={!isPremium}
                    onClick={() => setSettings({...settings, whatsappAssistantEnabled: !settings.whatsappAssistantEnabled})}
                    className={`w-10 h-5 rounded-full transition-all relative ${settings.whatsappAssistantEnabled ? 'bg-emerald-500' : 'bg-slate-200'} ${!isPremium && 'opacity-50'}`}
                   >
                      <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${settings.whatsappAssistantEnabled ? 'right-1' : 'left-1'}`} />
                   </button>
                </div>
            </div>
          </div>
        </section>

        {/* Template Selection */}
        <section className="pro-card space-y-8 md:col-span-2">
           <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-50 text-brand-primary rounded-2xl border border-indigo-100">
                <Layout className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Apparence du Store (Templates)</h3>
                <p className="text-[0.6rem] text-slate-400 font-bold uppercase tracking-widest mt-1">Choisissez un design qui correspond à votre marque</p>
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { id: 'basic', name: 'Minimaliste', img: 'https://images.unsplash.com/photo-1517705008128-361805f42e86?auto=format&fit=crop&w=400&h=300&q=80', premium: false },
                { id: 'dark', name: 'Dark Mode', img: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=400&h=300&q=80', premium: false },
                { id: 'clean', name: 'Clean Shop', img: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=400&h=300&q=80', premium: false },
                { id: 'modern', name: 'Moderne', img: 'https://images.unsplash.com/photo-1491897554428-130a83e8a6fa?auto=format&fit=crop&w=400&h=300&q=80', premium: false },
                
                { id: 'luxury', name: 'Luxueux', img: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=400&h=300&q=80', premium: true },
                { id: 'vsl', name: 'Direct Sales', img: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=400&h=300&q=80', premium: true },
                { id: 'instagram', name: 'Insta Style', img: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&w=400&h=300&q=80', premium: true },
                { id: 'tiktok', name: 'TikTok Style', img: 'https://images.unsplash.com/photo-1611605698335-8b1569810432?auto=format&fit=crop&w=400&h=300&q=80', premium: true },
                
                { id: 'mega', name: 'Grand Shop', img: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=400&h=300&q=80', premium: true },
                { id: 'minimal', name: 'Ultra Minimal', img: 'https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?auto=format&fit=crop&w=400&h=300&q=80', premium: true },
                { id: 'vintage', name: 'Retro Shop', img: 'https://images.unsplash.com/photo-1531346878377-a5ec20888f43?auto=format&fit=crop&w=400&h=300&q=80', premium: true },
                { id: 'future', name: 'Futuriste', img: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=400&h=300&q=80', premium: true },
              ].map((t) => (
                <button 
                  key={t.id}
                  onClick={() => {
                    if (t.premium && !isPremium) return alert("Ce template est réservé aux membres Premium.");
                    setTemplateId(t.id);
                  }}
                  className={`group rounded-[2rem] border-2 transition-all flex flex-col overflow-hidden relative ${templateId === t.id ? 'border-brand-primary bg-indigo-50 shadow-xl scale-[1.02] z-10' : 'border-slate-100 bg-white hover:border-slate-200'}`}
                >
                   <div className="aspect-[16/10] w-full relative overflow-hidden bg-slate-100 border-b border-slate-100">
                      <img src={t.img} alt={t.name} className={`w-full h-full object-cover transition-transform duration-700 ${templateId === t.id ? 'scale-110' : 'group-hover:scale-105'}`} />
                      <div className={`absolute inset-0 bg-brand-primary/10 transition-opacity ${templateId === t.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-40'}`} />
                      {templateId === t.id && (
                        <div className="absolute inset-2 top-2 flex justify-end">
                          <div className="bg-brand-primary text-white p-1.5 rounded-full shadow-lg">
                            <CheckCircle2 className="w-4 h-4" />
                          </div>
                        </div>
                      )}
                   </div>
                   <div className="p-4 flex flex-col items-center">
                    <span className={`text-[0.65rem] font-black uppercase tracking-widest ${templateId === t.id ? 'text-brand-primary' : 'text-slate-600'}`}>{t.name}</span>
                    {t.premium && (
                      <div className="flex items-center gap-1 mt-1">
                        <Crown className={`w-3 h-3 ${isPremium ? 'text-emerald-500' : 'text-amber-500'}`} />
                        <span className="text-[0.55rem] font-bold text-slate-400 uppercase tracking-tighter">Premium</span>
                      </div>
                    )}
                   </div>
                </button>
              ))}
           </div>
        </section>

        {/* Google Sheets Integration */}
        <section className="pro-card space-y-8 md:col-span-2 shadow-lg shadow-emerald-50/50">
          <div className="flex items-center gap-4">
             <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100">
               <Database className="w-5 h-5" />
             </div>
             <h3 className="text-sm font-bold text-slate-900">Lier Google Sheet (Premium)</h3>
          </div>
          <div className={`p-8 rounded-3xl border transition-all ${isPremium ? 'bg-emerald-50/30 border-emerald-100' : 'bg-slate-50 border-slate-100 opacity-80'}`}>
            <div className="mb-6 space-y-4">
              <div className="flex items-start gap-4 p-4 bg-white/50 rounded-2xl border border-emerald-100/50">
                <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-black shrink-0">1</div>
                <p className="text-[0.75rem] font-bold text-slate-600 leading-relaxed">
                  Partagez votre Google Sheet avec l'adresse suivante en tant qu'<strong>Éditeur</strong> : <br />
                  <code className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded mt-2 inline-block break-all select-all">{serviceAccountEmail}</code>
                </p>
              </div>
              <div className="flex items-start gap-4 p-4 bg-white/50 rounded-2xl border border-emerald-100/50">
                <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-black shrink-0">2</div>
                <p className="text-[0.75rem] font-bold text-slate-600 leading-relaxed">Collez le lien de votre Google Sheet ci-dessous.</p>
              </div>
            </div>

            <div className="space-y-4">
               <label className="text-[0.65rem] font-black text-slate-400 uppercase tracking-widest block px-2">Lien Google Sheet</label>
               <div className="relative group">
                 <input 
                  type="text" 
                  disabled={!isPremium}
                  className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-4 text-sm outline-none focus:border-emerald-500 font-medium text-slate-700 shadow-sm transition-all"
                  placeholder={isPremium ? "https://docs.google.com/spreadsheets/d/..." : "Abonnement Premium requis"}
                  value={googleSheetUrl}
                  onChange={(e) => setGoogleSheetUrl(e.target.value)}
                />
                {!isPremium && <Crown className="absolute right-6 top-4 w-4 h-4 text-amber-500" />}
               </div>
            </div>

            {googleSheetId && (
              <div className="text-[0.65rem] text-slate-400 mt-4 font-bold tracking-tight px-2 flex items-center gap-2 italic">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                Sheet ID Détecté : {googleSheetId}
              </div>
            )}
            
            {isPremium && (
              <div className="mt-6 p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl">
                <p className="text-[0.65rem] text-indigo-600 font-bold leading-relaxed">
                  <strong>Notes :</strong> Vos données seront ajoutées en temps réel sur l'onglet nommé "Sheet1" (ou le premier onglet). Assurez-vous que les colonnes sont prêtes.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Delivery Logic */}
        <section className="pro-card space-y-8 md:col-span-2 shadow-lg shadow-orange-50/50">
          <div className="flex items-center gap-4">
             <div className="p-3 bg-orange-50 text-orange-600 rounded-2xl border border-orange-100">
               <Receipt className="w-5 h-5" />
             </div>
             <h3 className="text-sm font-bold text-slate-900">Politique de Livraison</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-[0.65rem] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-2">Frais de livraison standard</label>
              <div className="relative">
                <input 
                  type="number" step="0.5"
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-5 text-lg font-black text-slate-900 outline-none focus:border-orange-500 transition-all pr-16"
                  value={settings.fixedDelivery ?? 0}
                  onChange={(e) => setSettings({...settings, fixedDelivery: parseFloat(e.target.value)})}
                />
                <span className="absolute right-6 top-6 text-sm font-black text-slate-400">DT</span>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[0.65rem] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-2">Seuil Livraison Gratuite</label>
              <div className="relative">
                <input 
                  type="number" 
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-5 text-lg font-black text-slate-900 outline-none focus:border-orange-500 transition-all pr-16"
                  value={settings.freeShippingMin ?? 0}
                  onChange={(e) => setSettings({...settings, freeShippingMin: parseFloat(e.target.value)})}
                />
                <span className="absolute right-6 top-6 text-sm font-black text-slate-400">DT</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
