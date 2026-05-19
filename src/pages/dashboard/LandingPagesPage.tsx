import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Layout, ExternalLink, Trash2, X, Save, Copy } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function LandingPagesPage() {
  const [pages, setPages] = useState<any[]>([]);
  const { token } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/landing-pages', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const pagesData = await res.json();
      setPages(Array.isArray(pagesData) ? pagesData : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchData();
  }, [token]);

  const handleClone = async (id: string) => {
    try {
      const res = await fetch(`/api/landing-pages/clone/${id}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/landing-pages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ title: newTitle })
    });

    if (res.ok) {
      const page = await res.json();
      setIsModalOpen(false);
      setNewTitle('');
      navigate(`/dashboard/landing-pages/builder/${page.id}`);
    }
  };

  const toggleActive = async (id: string, current: boolean) => {
    try {
      const res = await fetch(`/api/landing-pages/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ active: !current })
      });
      if (res.ok) fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (deleteConfirmId !== id) {
      setDeleteConfirmId(id);
      return;
    }

    try {
      const res = await fetch(`/api/landing-pages/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setDeleteConfirmId(null);
        fetchData();
      } else {
        const errData = await res.json().catch(() => ({ error: "Erreur inconnue" }));
        alert(`Erreur: ${errData.error}`);
        setDeleteConfirmId(null);
      }
    } catch (err) {
      console.error(err);
      alert("Erreur réseau lors de la suppression");
      setDeleteConfirmId(null);
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Landing Pages</h1>
          <p className="text-slate-500 font-medium tracking-tight italic">Créez des pages de vente haute conversion en un clic.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-brand-primary text-white font-bold px-8 py-4 rounded-2xl flex items-center gap-2 shadow-xl shadow-indigo-100 hover:scale-105 active:scale-95 transition-all text-sm"
        >
          <Plus className="w-5 h-5" />
          Nouvelle Page
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1,2,3].map(i => <div key={i} className="h-64 bg-white border border-slate-100 rounded-3xl animate-pulse shadow-sm" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {pages.length === 0 ? (
            <div className="col-span-full pro-card py-24 text-center space-y-6 flex flex-col items-center">
              <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center border border-slate-100 shadow-sm">
                <Layout className="w-10 h-10 text-slate-300" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">Aucune page active</h3>
                <p className="text-sm text-slate-500 font-medium mt-2">Commencez par créer votre première landing page pour booster vos leads.</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="bg-brand-primary text-white px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-100/50"
              >
                Lancer ma première page
              </button>
            </div>
          ) : (
            pages.map(page => (
              <div key={page.id} className="pro-card group hover:scale-[1.02] transition-all duration-300 flex flex-col p-8 hover:border-indigo-100">
                <div className="flex items-center justify-between mb-8 cursor-default">
                  <button 
                    onClick={() => toggleActive(page.id, page.active)}
                    className={`px-3 py-1 rounded-full text-[0.65rem] font-bold border transition-all hover:scale-105 active:scale-95 ${page.active ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}
                  >
                    {page.active ? 'Live Now' : 'Draft Mode'}
                  </button>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${page.active ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                    <span className="text-[0.6rem] font-bold text-slate-400 uppercase tracking-widest">
                       {page.active ? 'Active' : 'Désactivée'}
                    </span>
                  </div>
                </div>

                <div className="mb-8">
                  <h3 className="text-xl font-bold text-slate-900 group-hover:text-brand-primary transition-colors line-clamp-1 leading-tight">{page.title}</h3>
                  <div className="flex items-center gap-1.5 mt-2">
                    <div className="text-[0.65rem] font-black text-brand-primary bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100 uppercase tracking-tighter italic">/s/{page.slug}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-10 pt-6 border-t border-slate-50">
                   <div className="flex flex-col">
                      <span className="text-[0.6rem] font-black text-slate-400 uppercase tracking-widest mb-1.5 opacity-60">Status Produit</span>
                      <span className={`text-[0.7rem] font-bold truncate ${page.product ? 'text-slate-700' : 'text-slate-300 italic'}`}>
                        {page.product ? page.product.name : 'Non lié'}
                      </span>
                   </div>
                   <div className="flex flex-col text-right">
                      <span className="text-[0.6rem] font-black text-slate-400 uppercase tracking-widest mb-1.5 opacity-60">Performance</span>
                      <span className="text-sm font-black text-emerald-500 tracking-tighter">8.4% Conv</span>
                   </div>
                </div>

                 <div className="mt-auto grid grid-cols-3 gap-3 pt-6 border-t border-slate-50">
                  <a 
                    href={`/s/${page.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-2 bg-slate-50 border border-slate-100 text-slate-500 font-black py-3.5 rounded-2xl hover:bg-white hover:border-brand-primary hover:text-brand-primary transition-all text-[0.7rem] uppercase tracking-widest shadow-sm"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <button 
                    onClick={() => handleClone(page.id)}
                    className="flex items-center justify-center gap-2 bg-slate-50 border border-slate-100 text-slate-500 font-black py-3.5 rounded-2xl hover:bg-white hover:border-emerald-500 hover:text-emerald-500 transition-all text-[0.7rem] uppercase tracking-widest shadow-sm"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => navigate(`/dashboard/landing-pages/builder/${page.id}`)}
                    className="bg-slate-900 text-white font-black py-3.5 rounded-2xl hover:bg-brand-primary transition-all text-[0.7rem] uppercase tracking-widest shadow-lg shadow-black/5"
                  >
                    Design
                  </button>
                </div>
                
                <div className="mt-4 flex justify-center">
                  <button 
                    onClick={() => handleDelete(page.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[0.6rem] font-black uppercase tracking-widest transition-all ${deleteConfirmId === page.id ? 'bg-rose-500 text-white shadow-lg' : 'text-slate-300 hover:text-rose-500 hover:bg-rose-50'}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    {deleteConfirmId === page.id ? 'Confirmer Suppression' : 'Supprimer'}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 pb-4 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Nouvelle Page</h3>
                <p className="text-[0.6rem] font-black text-slate-400 uppercase tracking-widest mt-1">Générateur de conversion</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-3 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-2xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-8 pt-4 space-y-8">
              <div>
                <label className="text-[0.7rem] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-2">Nom de la Page</label>
                <input 
                  required
                  autoFocus
                  type="text" 
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 outline-none focus:border-brand-primary text-slate-900 font-black transition-all"
                  placeholder="Ex: Montre Luxe Promo"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                />
              </div>
              <button 
                type="submit"
                className="w-full bg-brand-primary text-white font-black py-5 rounded-2xl flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-indigo-100 uppercase tracking-widest text-xs"
              >
                <Save className="w-4 h-4" />
                Créer & Configurer
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

