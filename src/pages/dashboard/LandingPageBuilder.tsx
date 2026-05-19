import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Save, 
  Eye, 
  Plus, 
  Trash2, 
  Image as ImageIcon, 
  Type, 
  Layout, 
  CheckCircle2,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { MediaUploader } from '../../components/MediaUploader';

interface Section {
  id: string;
  type: 'gallery' | 'text' | 'features' | 'form';
  content: any;
}

export default function LandingPageBuilder() {
  const { id } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [pageData, setPageData] = useState<any>({
    title: '',
    slug: '',
    productId: '',
    active: true,
    content: {
      hero: { title: '', subtitle: '', image: '' },
      sections: [],
      cta: 'Commander Maintenant',
      countdown: { enabled: false, title: "ينتهي العرض في:", durationHours: 24 }
    }
  });
  
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pageRes, productsRes] = await Promise.all([
          fetch(`/api/landing-pages/${id}`, { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch('/api/products', { headers: { 'Authorization': `Bearer ${token}` } })
        ]);

        if (pageRes.ok) {
          const data = await pageRes.json();
          setPageData(data);
        }
        
        if (productsRes.ok) {
          setProducts(await productsRes.json());
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, token]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/landing-pages/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(pageData)
      });
      if (res.ok) {
        alert("Page enregistrée avec succès!");
      } else {
        const errData = await res.json().catch(() => ({ error: "Erreur inconnue" }));
        alert(`Erreur: ${errData.error || res.statusText}\n${errData.details || ''}`);
      }
    } catch (err) {
      console.error(err);
      alert("Erreur réseau ou serveur.");
    } finally {
      setSaving(false);
    }
  };

  const addSection = (type: Section['type']) => {
    const newSection: Section = {
      id: Math.random().toString(36).substring(2, 9),
      type,
      content: type === 'gallery' ? { images: [] } : 
               type === 'features' ? { items: [] } : 
               type === 'text' ? { text: '' } : 
               type === 'form' ? { title: 'Détails de la commande' } : {}
    };
    setPageData({
      ...pageData,
      content: {
        ...pageData.content,
        sections: [...(pageData.content.sections || []), newSection]
      }
    });
  };

  const moveSection = (id: string, direction: 'up' | 'down') => {
    const sections = [...pageData.content.sections];
    const index = sections.findIndex((s: any) => s.id === id);
    if (index === -1) return;

    if (direction === 'up' && index > 0) {
      [sections[index], sections[index - 1]] = [sections[index - 1], sections[index]];
    } else if (direction === 'down' && index < sections.length - 1) {
      [sections[index], sections[index + 1]] = [sections[index + 1], sections[index]];
    }

    setPageData({
      ...pageData,
      content: {
        ...pageData.content,
        sections
      }
    });
  };

  const removeSection = (sectionId: string) => {
    setPageData({
      ...pageData,
      content: {
        ...pageData.content,
        sections: pageData.content.sections.filter((s: any) => s.id !== sectionId)
      }
    });
  };

  const updateSectionContent = (sectionId: string, updates: any) => {
    setPageData({
      ...pageData,
      content: {
        ...pageData.content,
        sections: pageData.content.sections.map((s: any) => 
          s.id === sectionId ? { ...s, content: { ...s.content, ...updates } } : s
        )
      }
    });
  };

  const handleImageUpload = async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append('image', file);
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        return data.url;
      }
    } catch (err) {
      console.error("Upload error", err);
    }
    return null;
  };

  if (loading) return <div className="p-20 text-center font-black animate-pulse">CHARGEMENT DU BUILDER...</div>;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Builder Top Bar */}
      <div className="bg-brand-dark text-white p-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/dashboard/landing-pages')} className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-sm font-black uppercase tracking-tighter italic">
              {pageData.title || 'Page sans titre'}
              <span className="ml-2 text-[0.6rem] text-slate-500 font-normal">BUILDER v1.0</span>
            </h1>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <a 
            href={`/s/${pageData.slug}`} 
            target="_blank" 
            rel="noreferrer"
            className="flex items-center gap-2 text-xs font-bold px-4 py-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <Eye className="w-4 h-4" /> APERÇU
          </a>
          <button 
            onClick={handleSave}
            disabled={saving}
            className="bg-brand-primary text-brand-dark px-6 py-2 rounded-lg font-black text-xs flex items-center gap-2 shadow-lg shadow-brand-primary/20 hover:opacity-90 disabled:opacity-50"
          >
            {saving ? 'ENREGISTREMENT...' : <><Save className="w-4 h-4" /> ENREGISTRER</>}
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Controls */}
        <div className="w-80 bg-white border-r border-slate-200 overflow-y-auto p-6 space-y-8 scrollbar-hide">
          <div className="space-y-4">
            <h3 className="text-[0.65rem] font-black text-slate-400 uppercase tracking-widest border-b pb-2">Paramètres de Base</h3>
            <div>
              <label className="text-[0.7rem] font-bold text-slate-500 mb-1 block">Lier à un Produit</label>
              <select 
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-primary"
                value={pageData.productId || ''}
                onChange={e => setPageData({...pageData, productId: e.target.value})}
              >
                <option value="">Aucun</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[0.7rem] font-bold text-slate-500 mb-1 block">Slug (URL)</label>
              <input 
                type="text"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-brand-primary"
                value={pageData.slug || ''}
                onChange={e => setPageData({...pageData, slug: e.target.value})}
              />
            </div>
            
            <div className="pt-2">
               <label className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 cursor-pointer hover:border-brand-primary transition-all">
                  <input 
                    type="checkbox"
                    className="w-4 h-4 accent-brand-primary rounded"
                    checked={pageData.active}
                    onChange={e => setPageData({...pageData, active: e.target.checked})}
                  />
                  <div>
                    <span className="text-[0.7rem] font-black text-slate-700 uppercase tracking-widest block">Activer la Page</span>
                    <span className="text-[0.6rem] text-slate-400 font-medium">Visible par les visiteurs</span>
                  </div>
               </label>
            </div>
            
            <div className="pt-4 space-y-4 border-t border-slate-100">
               <h3 className="text-[0.65rem] font-black text-slate-400 uppercase tracking-widest">Compte à Rebours</h3>
               <label className="flex items-center gap-3 cursor-pointer">
                  <input 
                    type="checkbox"
                    className="w-4 h-4 accent-orange-500 rounded"
                    checked={pageData.content.countdown?.enabled || false}
                    onChange={e => setPageData({...pageData, content: {...pageData.content, countdown: {...(pageData.content.countdown || {}), enabled: e.target.checked}}})}
                  />
                  <span className="text-xs font-bold text-slate-600">Activer le Timer</span>
               </label>
               
               {pageData.content.countdown?.enabled && (
                 <div className="space-y-3 animate-in slide-in-from-top-2 duration-300">
                    <div>
                      <label className="text-[0.7rem] font-bold text-slate-500 mb-1 block">Titre du Timer (AR)</label>
                      <input 
                        type="text"
                        dir="rtl"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none font-arabic"
                        value={pageData.content.countdown?.title || ''}
                        onChange={e => setPageData({...pageData, content: {...pageData.content, countdown: {...pageData.content.countdown, title: e.target.value}}})}
                      />
                    </div>
                    <div>
                      <label className="text-[0.7rem] font-bold text-slate-500 mb-1 block">Durée (Heures)</label>
                      <input 
                        type="number"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none"
                        value={pageData.content.countdown?.durationHours || 24}
                        onChange={e => setPageData({...pageData, content: {...pageData.content, countdown: {...pageData.content.countdown, durationHours: parseInt(e.target.value)}}})}
                      />
                    </div>
                 </div>
               )}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-[0.65rem] font-black text-slate-400 uppercase tracking-widest border-b pb-2">Ajouter des Eléments</h3>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => addSection('gallery')} className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-xl border-2 border-transparent hover:border-brand-primary hover:bg-white transition-all group">
                <ImageIcon className="w-5 h-5 mb-2 text-slate-400 group-hover:text-brand-primary" />
                <span className="text-[0.6rem] font-black uppercase">Galerie</span>
              </button>
              <button onClick={() => addSection('text')} className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-xl border-2 border-transparent hover:border-brand-primary hover:bg-white transition-all group">
                <Type className="w-5 h-5 mb-2 text-slate-400 group-hover:text-brand-primary" />
                <span className="text-[0.6rem] font-black uppercase">Texte</span>
              </button>
              <button onClick={() => addSection('features')} className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-xl border-2 border-transparent hover:border-brand-primary hover:bg-white transition-all group">
                <Layout className="w-5 h-5 mb-2 text-slate-400 group-hover:text-brand-primary" />
                <span className="text-[0.6rem] font-black uppercase">Features</span>
              </button>
              <button onClick={() => addSection('form')} className="flex flex-col items-center justify-center p-4 bg-indigo-50 rounded-xl border-2 border-transparent hover:border-brand-primary hover:bg-white transition-all group">
                <CheckCircle2 className="w-5 h-5 mb-2 text-brand-primary group-hover:scale-110 transition-transform" />
                <span className="text-[0.6rem] font-black uppercase text-brand-primary">Formulaire</span>
              </button>
            </div>
          </div>
        </div>

        {/* Builder Canvas */}
        <div className="flex-1 bg-slate-100 p-12 overflow-y-auto">
          <div className="max-w-2xl mx-auto space-y-6">
            
            {/* HERO SECTION (Mandatory) */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden border-2 border-transparent hover:border-brand-primary transition-all group relative">
              <div className="absolute top-4 right-4 text-[0.6rem] font-black text-slate-300 uppercase">En-tête Principal (Fixe)</div>
              <div className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-[0.65rem] font-black uppercase text-slate-400">Titre Principal (H1)</label>
                  <input 
                    type="text"
                    dir="rtl"
                    className="w-full text-2xl font-black text-slate-800 outline-none placeholder:text-slate-200 font-arabic"
                    placeholder="أدخل عنوان الصفحة هنا..."
                    value={pageData.content.hero.title || ''}
                    onChange={e => setPageData({...pageData, content: {...pageData.content, hero: {...pageData.content.hero, title: e.target.value}}})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[0.65rem] font-black uppercase text-slate-400">Sous-titre</label>
                  <textarea 
                    dir="rtl"
                    rows={2}
                    className="w-full text-slate-500 outline-none resize-none placeholder:text-slate-200 font-arabic text-sm"
                    placeholder="وصف مختصر للمنتج أو العرض..."
                    value={pageData.content.hero.subtitle || ''}
                    onChange={e => setPageData({...pageData, content: {...pageData.content, hero: {...pageData.content.hero, subtitle: e.target.value}}})}
                  />
                </div>
                <div className="space-y-2">
                  <MediaUploader 
                    label="Image / Vidéo de Couverture"
                    initialUrl={pageData.content.hero.image}
                    onUploadComplete={(url) => setPageData({...pageData, content: {...pageData.content, hero: {...pageData.content.hero, image: url}}})}
                    className="mt-2"
                  />
                </div>
              </div>
            </div>

            {/* DYNAMIC SECTIONS */}
            {(pageData.content.sections || []).map((section: any, idx: number) => (
              <div key={section.id} className="bg-white rounded-2xl shadow-sm border-2 border-transparent hover:border-brand-primary transition-all relative group">
                <div className="absolute -right-12 top-0 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                   <button 
                    disabled={idx === 0}
                    onClick={() => moveSection(section.id, 'up')} 
                    className="p-2 bg-white rounded-lg shadow-sm text-slate-400 hover:text-brand-primary disabled:opacity-30"
                   >
                     <ChevronUp className="w-4 h-4" />
                   </button>
                   <button 
                    disabled={idx === (pageData.content.sections.length - 1)}
                    onClick={() => moveSection(section.id, 'down')} 
                    className="p-2 bg-white rounded-lg shadow-sm text-slate-400 hover:text-brand-primary disabled:opacity-30"
                   >
                     <ChevronDown className="w-4 h-4" />
                   </button>
                   <button onClick={() => removeSection(section.id)} className="p-2 bg-white rounded-lg shadow-sm text-red-500 hover:bg-red-50">
                     <Trash2 className="w-4 h-4" />
                   </button>
                </div>

                <div className="p-8">
                  <div className="flex items-center gap-2 mb-6">
                    <div className="p-2 bg-slate-100 rounded-lg">
                      {section.type === 'gallery' ? <ImageIcon className="w-4 h-4" /> : 
                       section.type === 'text' ? <Type className="w-4 h-4" /> : <Layout className="w-4 h-4" />}
                    </div>
                    <span className="text-[0.65rem] font-black uppercase tracking-widest text-slate-400">{section.type}</span>
                  </div>

                  {section.type === 'text' && (
                    <textarea 
                      dir="rtl"
                      rows={4}
                      className="w-full text-slate-700 outline-none resize-none placeholder:text-slate-200 font-arabic"
                      placeholder="اكتب المحتوى هنا..."
                      value={section.content.text || ''}
                      onChange={e => updateSectionContent(section.id, { text: e.target.value })}
                    />
                  )}

                  {section.type === 'form' && (
                    <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 text-center space-y-4">
                      <Layout className="w-8 h-8 text-slate-300 mx-auto" />
                      <div>
                        <p className="text-[0.7rem] font-black text-slate-400 uppercase tracking-widest">Le formulaire sera affiché ici</p>
                        <p className="text-[0.6rem] text-slate-400 italic">Il capturera les commandes de vos clients.</p>
                      </div>
                      <input 
                        type="text"
                        dir="rtl"
                        className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2 text-sm outline-none font-arabic text-center"
                        placeholder="عنوان النموذج (Détails de la commande)"
                        value={section.content.title || ''}
                        onChange={e => updateSectionContent(section.id, { title: e.target.value })}
                      />
                    </div>
                  )}

                  {section.type === 'gallery' && (
                    <div className="space-y-4">
                      <MediaUploader 
                        label="Ajouter à la Galerie"
                        onUploadComplete={(url) => {
                          if (url) {
                            updateSectionContent(section.id, { images: [...(section.content.images || []), url] });
                          }
                        }}
                      />
                      <div className="grid grid-cols-2 gap-4">
                        {(section.content.images || []).map((img: string, idx: number) => (
                          <div key={idx} className="relative aspect-square bg-slate-50 overflow-hidden border border-slate-200">
                            <img src={img} className="w-full h-full object-cover" />
                            <button 
                              onClick={() => {
                                const newImgs = [...section.content.images];
                                newImgs.splice(idx, 1);
                                updateSectionContent(section.id, { images: newImgs });
                              }}
                              className="absolute top-2 right-2 p-1 bg-white/80 rounded-md text-red-500"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {section.type === 'features' && (
                    <div className="space-y-4">
                      {(section.content.items || []).map((item: string, idx: number) => (
                        <div key={idx} className="flex items-center gap-3">
                          <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                          <input 
                            type="text"
                            dir="rtl"
                            className="flex-1 bg-slate-50 rounded-lg px-3 py-2 text-sm outline-none font-arabic"
                            value={item || ''}
                            onChange={e => {
                              const newItems = [...section.content.items];
                              newItems[idx] = e.target.value;
                              updateSectionContent(section.id, { items: newItems });
                            }}
                          />
                          <button onClick={() => {
                            const newItems = [...section.content.items];
                            newItems.splice(idx, 1);
                            updateSectionContent(section.id, { items: newItems });
                          }}><X className="w-4 h-4 text-slate-300" /></button>
                        </div>
                      ))}
                      <button 
                        onClick={() => updateSectionContent(section.id, { items: [...(section.content.items || []), 'ميزة جديدة'] })}
                        className="text-[0.6rem] font-black text-brand-primary"
                      >
                        + AJOUTER UNE CARACTÉRISTIQUE
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* CTA SECTION (Bottom) */}
            <div className="bg-white rounded-2xl shadow-sm p-8 border-2 border-transparent hover:border-brand-primary transition-all relative">
              <div className="absolute top-4 right-4 text-[0.6rem] font-black text-slate-300 uppercase">Section Commande (Fixe)</div>
              <div className="space-y-4 pt-4">
                <label className="text-[0.65rem] font-black uppercase text-slate-400">Texte du Bouton de Commande</label>
                <input 
                  type="text"
                  dir="rtl"
                  className="w-full bg-brand-primary/10 border-2 border-brand-primary rounded-2xl px-6 py-4 text-center text-lg font-black text-brand-dark outline-none font-arabic"
                  value={pageData.content.cta || ''}
                  onChange={e => setPageData({...pageData, content: {...pageData.content, cta: e.target.value}})}
                />
                <p className="text-center text-[0.6rem] text-slate-400 font-bold uppercase italic">
                  Note: Vous pouvez déplacer le formulaire de commande avec les flèches dans la zone de contenu.
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
