import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, ShoppingBag, X, Save, RefreshCcw, Image, Search, Copy } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { MediaUploader } from '../../components/MediaUploader';

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [search, setSearch] = useState('');

  const [formData, setFormData] = useState<any>({
    name: '',
    price: 0,
    comparePrice: 0,
    description: '',
    image: '',
    stock: 0,
    offers: [],
    freeShipping: false,
    active: true
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/products', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('API Error');
      const data = await res.json();
      setProducts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const handleClone = async (id: string) => {
    try {
      const res = await fetch(`/api/products/clone/${id}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    (p.description || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenModal = (product?: any) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name || '',
        price: product.price || 0,
        comparePrice: product.comparePrice || 0,
        description: product.description || '',
        image: product.image || '',
        stock: product.stock || 0,
        offers: product.offers || [],
        freeShipping: product.freeShipping || false,
        active: product.active !== undefined ? product.active : true
      });
    } else {
      setEditingProduct(null);
      setFormData({ name: '', price: 0, comparePrice: 0, description: '', image: '', stock: 0, offers: [], freeShipping: false, active: true });
    }
    setIsModalOpen(true);
  };

  const addOffer = () => {
    setFormData({
      ...formData,
      offers: [...formData.offers, { text: 'Offre ' + (formData.offers.length + 1), price: formData.price, active: true }]
    });
  };

  const removeOffer = (index: number) => {
    const newOffers = [...formData.offers];
    newOffers.splice(index, 1);
    setFormData({ ...formData, offers: newOffers });
  };

  const updateOffer = (index: number, field: string, value: any) => {
    const newOffers = [...formData.offers];
    newOffers[index] = { ...newOffers[index], [field]: value };
    setFormData({ ...formData, offers: newOffers });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingProduct ? 'PUT' : 'POST';
    const url = editingProduct ? `/api/products/${editingProduct.id}` : '/api/products';

    const res = await fetch(url, {
      method,
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    });

    if (res.ok) {
      setIsModalOpen(false);
      fetchData();
    }
  };

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (deleteConfirmId !== id) {
      setDeleteConfirmId(id);
      return;
    }

    try {
      const res = await fetch(`/api/products/${id}`, {
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

  const handleToggleActive = async (id: string) => {
    try {
      const res = await fetch(`/api/products/${id}/toggle-active`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Catalogue Produits</h1>
          <p className="text-slate-500 font-medium tracking-tight">Gérez votre inventaire et vos offres promotionnelles.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-brand-primary text-white font-black px-8 py-4 rounded-2xl flex items-center gap-2 shadow-xl shadow-indigo-100 hover:scale-105 active:scale-95 transition-all uppercase tracking-widest text-xs"
        >
          <Plus className="w-5 h-5" />
          Nouveau Produit
        </button>
      </div>

      <div className="pro-card !p-0 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-white flex items-center gap-4">
           <div className="relative flex-1 max-w-md">
             <Search className="absolute left-4 top-3.5 w-4 h-4 text-slate-300" />
             <input 
              type="text" 
              placeholder="Rechercher un produit..." 
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 pl-11 pr-4 text-sm outline-none focus:border-brand-primary placeholder:text-slate-300 transition-all font-medium" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
           </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-6 text-xs font-bold text-slate-400">Produit & Informations</th>
                <th className="px-8 py-6 text-xs font-bold text-slate-400">Tarification</th>
                <th className="px-8 py-6 text-xs font-bold text-slate-400">Visibilité</th>
                <th className="px-8 py-6 text-xs font-bold text-slate-400">Stock Total</th>
                <th className="px-8 py-6 text-xs font-bold text-slate-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={5} className="text-center py-20"><RefreshCcw className="w-8 h-8 text-brand-primary animate-spin mx-auto opacity-20" /></td></tr>
              ) : filteredProducts.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-20 text-slate-400 font-bold uppercase tracking-widest text-xs">Aucun produit trouvé</td></tr>
              ) : filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center border-2 border-white shadow-sm overflow-hidden group-hover:scale-110 transition-transform">
                        {product.image ? (
                          <img src={product.image} className="w-full h-full object-cover" alt={product.name} />
                        ) : (
                          <ShoppingBag className="w-6 h-6 text-slate-300" />
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900 group-hover:text-brand-primary transition-colors mb-0.5">{product.name}</div>
                        <div className="text-[0.65rem] text-slate-400 font-medium truncate max-w-[250px] italic">{product.description || 'Description non renseignée'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-base font-bold text-slate-900 tracking-tighter">{product.price.toFixed(3)} <span className="text-[0.6rem] text-slate-400 font-bold">DT</span></span>
                        {product.comparePrice && product.comparePrice > product.price && (
                          <span className="text-[0.7rem] text-slate-300 font-bold line-through">{product.comparePrice.toFixed(3)}</span>
                        )}
                      </div>
                      {product.freeShipping && (
                        <span className="text-[0.6rem] text-brand-primary font-bold bg-indigo-50 px-2 py-0.5 rounded-lg w-fit">Livraison Gratuite</span>
                      )}
                      {product.offers && product.offers.length > 0 && (
                        <span className="text-[0.6rem] text-emerald-500 font-bold">+{product.offers.length} offres actives</span>
                      )}
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <button 
                      onClick={() => handleToggleActive(product.id)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all border ${product.active ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-slate-100 border-slate-200 text-slate-400'}`}
                    >
                       <div className={`w-2 h-2 rounded-full ${product.active ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                       <span className="text-[0.65rem] font-black uppercase tracking-widest">{product.active ? 'Actif' : 'Masqué'}</span>
                    </button>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-2">
                       <div className={`w-2 h-2 rounded-full ${product.stock > 10 ? 'bg-emerald-500' : (product.stock > 0 ? 'bg-amber-500' : 'bg-rose-500')}`}></div>
                       <span className="text-xs font-black text-slate-700 tracking-tight">{product.stock} unités</span>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => handleClone(product.id)}
                        className="p-3 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-2xl transition-all"
                        title="Cloner"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleOpenModal(product)}
                        className="p-3 text-slate-400 hover:text-brand-primary hover:bg-indigo-50 rounded-2xl transition-all"
                        title="Modifier"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(product.id)}
                        className={`p-3 rounded-2xl transition-all flex items-center gap-2 ${deleteConfirmId === product.id ? 'bg-rose-500 text-white' : 'text-slate-400 hover:text-rose-500 hover:bg-rose-50'}`}
                      >
                        <Trash2 className="w-4 h-4" />
                        {deleteConfirmId === product.id && <span className="text-[0.6rem] font-black uppercase tracking-widest">Confirmer?</span>}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-y-auto max-h-[90vh] animate-in zoom-in-95 duration-300 border border-white/20">
             <div className="p-8 pb-4 flex items-center justify-between">
                <div>
                   <h3 className="text-xl font-black text-slate-900 tracking-tight">{editingProduct ? 'Modifier le Produit' : 'Nouveau Produit'}</h3>
                   <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Édition du catalogue</p>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-3 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-2xl transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
             </div>
             
             <form onSubmit={handleSave} className="p-8 space-y-8">
                <div className="grid grid-cols-2 gap-6">
                  <div className="col-span-2">
                    <label className="text-[0.7rem] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-2">Nom du produit</label>
                    <input 
                      required
                      type="text" 
                      placeholder="Ex: Montre Connectée Elite 2"
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 outline-none focus:border-brand-primary font-black text-slate-700 transition-all"
                      value={formData.name || ''}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-[0.7rem] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-2">Prix unitaire (DT)</label>
                    <div className="relative">
                       <input 
                        required
                        type="number" step="0.001"
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 outline-none focus:border-brand-primary font-black text-slate-900 transition-all font-mono"
                        value={formData.price ?? 0}
                        onChange={e => setFormData({...formData, price: parseFloat(e.target.value)})}
                      />
                      <span className="absolute right-5 top-4.5 text-xs font-black text-slate-400">DT</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-[0.7rem] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-2">Ancien Prix (Barre)</label>
                    <div className="relative">
                       <input 
                        type="number" step="0.001"
                        placeholder="Ex: 120.000"
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 outline-none focus:border-brand-primary font-black text-slate-400 transition-all font-mono italic"
                        value={formData.comparePrice ?? 0}
                        onChange={e => setFormData({...formData, comparePrice: parseFloat(e.target.value)})}
                      />
                      <span className="absolute right-5 top-4.5 text-xs font-black text-slate-400">DT</span>
                    </div>
                  </div>
                  <div className="col-span-2">
                    <label className="text-[0.7rem] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-2">Stock initial</label>
                    <div className="relative">
                       <input 
                        required
                        type="number"
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 outline-none focus:border-brand-primary font-black text-slate-900 transition-all"
                        value={formData.stock ?? 0}
                        onChange={e => setFormData({...formData, stock: parseInt(e.target.value)})}
                      />
                      <span className="absolute right-5 top-4.5 text-xs font-black text-slate-400 italic">unité</span>
                    </div>
                  </div>
                  <div className="col-span-2">
                     <label className="text-[0.7rem] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-2">Description commerciale</label>
                     <textarea 
                        placeholder="Quels sont les points forts du produit ?"
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 outline-none focus:border-brand-primary h-32 font-medium text-slate-700 transition-all resize-none"
                        value={formData.description || ''}
                        onChange={e => setFormData({...formData, description: e.target.value})}
                     />
                  </div>
                  <div className="col-span-2">
                      <MediaUploader 
                        label="Image du produit"
                        type="image"
                        initialUrl={formData.image}
                        onUploadComplete={(url) => setFormData({...formData, image: url})}
                        className="mb-8"
                      />
                  </div>

                  <div className="col-span-2">
                    <label className="flex items-center gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100 cursor-pointer group hover:border-brand-primary transition-all">
                      <input 
                        type="checkbox"
                        className="w-5 h-5 accent-brand-primary rounded"
                        checked={formData.active}
                        onChange={e => setFormData({...formData, active: e.target.checked})}
                      />
                      <div>
                        <span className="text-xs font-bold text-slate-700 block">Produit visible dans la boutique</span>
                        <span className="text-[0.65rem] text-slate-400">Les invités peuvent voir ce produit sur votre page d'accueil.</span>
                      </div>
                    </label>
                  </div>

                  <div className="col-span-2">
                    <label className="flex items-center gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100 cursor-pointer group hover:border-brand-primary transition-all">
                      <input 
                        type="checkbox"
                        className="w-5 h-5 accent-brand-primary rounded"
                        checked={formData.freeShipping}
                        onChange={e => setFormData({...formData, freeShipping: e.target.checked})}
                      />
                      <div>
                        <span className="text-xs font-bold text-slate-700 block">Livraison gratuite pour ce produit</span>
                        <span className="text-[0.65rem] text-slate-400">Ignore les seuils globaux de livraison de la boutique.</span>
                      </div>
                    </label>
                  </div>

                  <div className="col-span-2 space-y-4 pt-4">
                    <div className="flex items-center justify-between px-2">
                      <h4 className="text-[0.65rem] font-black uppercase tracking-widest text-slate-400">Offres Promotionnelles (Bundles)</h4>
                      <button 
                        type="button"
                        onClick={addOffer}
                        className="text-[0.6rem] font-black text-brand-primary hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-all border border-transparent hover:border-indigo-100"
                      >
                        + AJOUTER UNE OFFRE
                      </button>
                    </div>

                    <div className="space-y-4">
                      {formData.offers.length === 0 && (
                        <div className="bg-slate-50/50 border-2 border-dashed border-slate-100 rounded-2xl p-6 text-center text-[0.65rem] font-black text-slate-300 uppercase tracking-widest">
                           Aucune offre groupée définie
                        </div>
                      )}
                      {formData.offers.map((offer: any, idx: number) => (
                        <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-4 animate-in slide-in-from-top-2 duration-300">
                          <div className="flex items-center justify-between">
                             <span className="text-[0.65rem] font-black text-brand-primary px-3 py-1 bg-indigo-50 rounded-lg">OFFRE #{idx + 1}</span>
                             <button onClick={() => removeOffer(idx)} type="button" className="p-2 text-rose-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all">
                               <Trash2 className="w-4 h-4" />
                             </button>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <input 
                              type="text"
                              placeholder="Libellé marketing (ex: Pack de 2)"
                              className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm outline-none focus:border-brand-primary font-black text-slate-700"
                              value={offer.text}
                              onChange={e => updateOffer(idx, 'text', e.target.value)}
                            />
                            <div className="relative">
                               <input 
                                type="number" step="0.001"
                                placeholder="Prix Promo"
                                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm outline-none focus:border-brand-primary font-black text-slate-900 pl-12"
                                value={offer.price}
                                onChange={e => updateOffer(idx, 'price', parseFloat(e.target.value))}
                              />
                              <span className="absolute left-4 top-3 text-[0.65rem] font-black text-slate-400">DT</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-8">
                  <button 
                    type="button" 
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 bg-slate-50 border border-slate-100 text-slate-500 font-black py-4 rounded-2xl hover:bg-slate-100 transition-all text-xs uppercase tracking-widest"
                  >
                    Fermer
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 bg-brand-primary text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-indigo-100 uppercase tracking-widest text-xs"
                  >
                    <Save className="w-4 h-4" />
                    Enregistrer
                  </button>
                </div>
             </form>
          </div>
        </div>
      )}
    </div>
  );
}
