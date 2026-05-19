import React, { useState, useEffect } from 'react';
import { Search, Filter, Trash2, User, Smartphone, MapPin, Loader2, ExternalLink, RefreshCcw, Calendar, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function OrdersPage() {
  const [tab, setTab] = useState<'all' | 'completed' | 'abandoned'>('all');
  const [orders, setOrders] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState({ start: '', end: '' });
  const { token } = useAuth();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ordersRes, leadsRes] = await Promise.all([
        fetch('/api/orders', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/leads', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      const ordersData = await ordersRes.json();
      const leadsData = await leadsRes.json();
      setOrders(Array.isArray(ordersData) ? ordersData : []);
      setLeads(Array.isArray(leadsData) ? leadsData : []);
    } catch (err) {
      console.error("Error fetching data", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (token) fetchData();
  }, [token]);

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleDeleteOrder = async (id: string) => {
    if (deleteConfirmId !== id) {
      setDeleteConfirmId(id);
      return;
    }

    try {
      const res = await fetch(`/api/orders/${id}`, {
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
      alert("Erreur réseau");
      setDeleteConfirmId(null);
    }
  };

  const handleDeleteLead = async (id: string) => {
    if (deleteConfirmId !== id) {
      setDeleteConfirmId(id);
      return;
    }

    try {
      const res = await fetch(`/api/leads/${id}`, {
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
      alert("Erreur réseau");
      setDeleteConfirmId(null);
    }
  };

  const abandonedLeads = leads.filter(l => !l.recovered);

  const filterByDate = (date: string) => {
    if (!dateFilter.start && !dateFilter.end) return true;
    const itemDate = new Date(date);
    itemDate.setHours(0, 0, 0, 0);
    
    if (dateFilter.start) {
      const start = new Date(dateFilter.start);
      start.setHours(0, 0, 0, 0);
      if (itemDate < start) return false;
    }
    if (dateFilter.end) {
      const end = new Date(dateFilter.end);
      end.setHours(0, 0, 0, 0);
      if (itemDate > end) return false;
    }
    return true;
  };

  const filteredOrders = orders.filter(o => 
    (o.customerName.toLowerCase().includes(search.toLowerCase()) || 
    o.customerPhone.includes(search)) &&
    filterByDate(o.createdAt)
  );

  const filteredLeads = abandonedLeads.filter(l => 
    ((l.customerName || '').toLowerCase().includes(search.toLowerCase()) || 
    (l.customerPhone || '').includes(search)) &&
    filterByDate(l.createdAt)
  );

  // Combine for 'All' tab
  const allItems = [
    ...filteredOrders.map(o => ({ ...o, type: 'order' })),
    ...filteredLeads.map(l => ({ ...l, type: 'lead' }))
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const currentItems = tab === 'all' ? allItems : (tab === 'completed' ? filteredOrders : filteredLeads);

  const exportToCSV = () => {
    const headers = ['Date', 'Nom Client', 'Telephone', 'Produit', 'Offre/Source', 'Adresse', 'Total', 'Statut'];
    const rows = currentItems.map(item => {
      const isOrder = item.type === 'order' || (tab === 'completed');
      return [
        new Date(item.createdAt).toLocaleDateString(),
        item.customerName || 'Inconnu',
        item.customerPhone || 'N/A',
        item.productName || 'N/A',
        isOrder ? (item.items && item.items[0]?.offer ? item.items[0].offer : 'Solo') : 'Landing Page',
        item.customerAddress || 'N/A',
        isOrder ? (item.total || 0).toFixed(3) : '0',
        isOrder ? 'Confirme' : 'Abandon'
      ];
    });

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `convertyflow_orders_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Suivi des Conversions</h1>
        <p className="text-slate-500 font-medium tracking-tight italic">Consultez vos commandes confirmées et vos prospects à relancer.</p>
      </header>

      <div className="flex gap-2 bg-slate-100/50 p-1.5 rounded-2xl w-fit border border-slate-200/50">
        <button 
          onClick={() => setTab('all')}
          className={`px-8 py-3 rounded-xl text-xs font-bold transition-all ${tab === 'all' ? 'bg-white text-brand-primary shadow-lg shadow-indigo-100/50' : 'text-slate-400 hover:text-slate-600'}`}
        >
          Tous ({orders.length + abandonedLeads.length})
        </button>
        <button 
          onClick={() => setTab('completed')}
          className={`px-8 py-3 rounded-xl text-xs font-bold transition-all ${tab === 'completed' ? 'bg-white text-brand-primary shadow-lg shadow-indigo-100/50' : 'text-slate-400 hover:text-slate-600'}`}
        >
          Confirmées ({orders.length})
        </button>
        <button 
          onClick={() => setTab('abandoned')}
          className={`px-8 py-3 rounded-xl text-xs font-bold transition-all ${tab === 'abandoned' ? 'bg-white text-brand-primary shadow-lg shadow-indigo-100/50' : 'text-slate-400 hover:text-slate-600'}`}
        >
          Abandons ({abandonedLeads.length})
        </button>
      </div>

      <div className="pro-card !p-0 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col lg:flex-row gap-4 bg-white items-end lg:items-center">
           <div className="relative flex-1 w-full">
             <Search className="absolute left-4 top-3.5 w-4 h-4 text-slate-300" />
             <input 
              type="text" 
              placeholder="Rechercher un client..." 
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 pl-11 pr-4 text-sm outline-none focus:border-brand-primary placeholder:text-slate-300 transition-all font-medium" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
           </div>
           
           <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
             <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-2xl px-4 py-2">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <input 
                  type="date" 
                  value={dateFilter.start}
                  onChange={(e) => setDateFilter(prev => ({ ...prev, start: e.target.value }))}
                  className="bg-transparent text-[0.65rem] font-bold outline-none text-slate-600"
                />
                <span className="text-slate-300">→</span>
                <input 
                  type="date" 
                  value={dateFilter.end}
                  onChange={(e) => setDateFilter(prev => ({ ...prev, end: e.target.value }))}
                  className="bg-transparent text-[0.65rem] font-bold outline-none text-slate-600"
                />
                {(dateFilter.start || dateFilter.end) && (
                  <button onClick={() => setDateFilter({ start: '', end: '' })} className="ml-1 p-1 hover:bg-slate-200 rounded-full">
                    <X className="w-3 h-3 text-slate-400" />
                  </button>
                )}
             </div>

             <div className="flex gap-2 ml-auto lg:ml-0">
               <button className="bg-slate-50 border border-slate-100 rounded-2xl px-6 py-2 flex items-center gap-2 text-[0.65rem] font-black text-slate-500 hover:bg-slate-100 transition-colors uppercase tracking-widest leading-none">
                 <Filter className="w-3.5 h-3.5" /> FILTRER
               </button>
               <button 
                onClick={exportToCSV}
                className="bg-brand-primary text-white px-6 py-2 rounded-2xl text-[0.65rem] font-black hover:opacity-95 transition-opacity uppercase tracking-widest shadow-lg shadow-indigo-100"
               >
                 EXPORTER
               </button>
             </div>
           </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
             <div className="flex flex-col items-center justify-center p-32 space-y-4">
                <Loader2 className="w-10 h-10 text-brand-primary animate-spin" />
                <span className="text-[0.65rem] font-black text-slate-400 uppercase tracking-widest">Hydrating table...</span>
             </div>
          ) : (
            <table className="w-full text-left border-collapse">
               <thead>
                 <tr className="bg-slate-50/50 border-b border-slate-100">
                   <th className="px-8 py-6 text-xs font-bold text-slate-400">{tab === 'completed' ? 'Client' : 'Prospect'}</th>
                   <th className="px-8 py-6 text-xs font-bold text-slate-400">Téléphone</th>
                   <th className="px-8 py-6 text-xs font-bold text-slate-400">Produit</th>
                   <th className="px-8 py-6 text-xs font-bold text-slate-400">Offre / Source</th>
                   <th className="px-8 py-6 text-xs font-bold text-slate-400">Adresse</th>
                   <th className="px-8 py-6 text-xs font-bold text-slate-400">Total TTC</th>
                   <th className="px-8 py-6 text-xs font-bold text-slate-400">Statut</th>
                   <th className="px-8 py-6 text-xs font-bold text-slate-400 text-right">Actions</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                 {currentItems.length === 0 ? (
                   <tr><td colSpan={8} className="text-center py-32 text-slate-300 font-black uppercase tracking-widest text-xs italic">Aucune donnée trouvée</td></tr>
                 ) : currentItems.map((item: any) => {
                   const isOrder = item.type === 'order' || (tab === 'completed');
                   const offerName = isOrder 
                     ? (item.items && item.items[0]?.offer ? item.items[0].offer : 'Solo')
                     : 'Landing Page';
                   const productName = item.productName || 'N/A';
                   const qty = isOrder && item.items && item.items[0]?.quantity ? item.items[0].quantity : 1;

                   return (
                     <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-8 py-6">
                           <div className="flex items-center gap-3">
                              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-xs border ${isOrder ? 'bg-white shadow-sm border-slate-100 text-brand-primary' : 'bg-orange-50 text-orange-600 border-orange-100'}`}>
                                {item.customerName?.charAt(0).toUpperCase() || 'L'}
                              </div>
                              <div>
                                <div className={`text-sm font-black text-slate-900 mb-0.5 leading-none transition-colors group-hover:text-brand-primary ${!isOrder && 'font-arabic'}`}>{item.customerName || 'Inconnu'}</div>
                                <div className="text-[0.65rem] text-slate-400 font-bold">{new Date(item.createdAt).toLocaleDateString('fr-TN')}</div>
                              </div>
                           </div>
                        </td>
                        <td className="px-8 py-6">
                           <div className="flex items-center gap-2 text-slate-700 font-black text-sm">
                              <Smartphone className="w-3.5 h-3.5 text-slate-300" />
                              {item.customerPhone || 'N/A'}
                           </div>
                        </td>
                        <td className="px-8 py-6">
                           <span className="text-[0.65rem] font-black text-slate-600 bg-slate-50 border border-slate-100 px-3 py-1 rounded-xl">
                              {productName}
                           </span>
                        </td>
                        <td className="px-8 py-6">
                           <div className="flex flex-col gap-1">
                              <span className={`text-[0.7rem] font-bold px-2 py-0.5 rounded-lg w-fit ${isOrder ? 'bg-indigo-50 text-brand-primary border border-indigo-100' : 'bg-slate-50 text-slate-400 border border-slate-100'}`}>
                                {offerName}
                              </span>
                              {isOrder && <span className="text-[0.6rem] font-bold text-slate-400 italic">Quantité: {qty}</span>}
                           </div>
                        </td>
                        <td className="px-8 py-6">
                           <div className="flex items-center gap-2 max-w-[200px]">
                              <MapPin className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                              <span className="text-[0.65rem] font-bold text-slate-500 truncate" title={item.customerAddress || 'Non spécifié'}>
                                {item.customerAddress || 'N/A'}
                              </span>
                           </div>
                        </td>
                        <td className="px-8 py-6">
                           {isOrder ? (
                             <div className="flex flex-col">
                               <span className="text-sm font-black text-slate-900 tracking-tighter">{(item.total || 0).toFixed(3)} <span className="text-[0.6rem] text-slate-400">DT</span></span>
                               <span className="text-[0.6rem] text-emerald-500 font-bold">Paiement Livraison</span>
                             </div>
                           ) : (
                             <span className="text-xs text-slate-300 font-bold italic">N/A</span>
                           )}
                        </td>
                        <td className="px-8 py-6">
                           <span className={`status-pill ${isOrder ? 'status-confirmed' : 'status-abandoned'}`}>
                             {isOrder ? 'Confirmé' : 'Abandonné'}
                           </span>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                             <button 
                               onClick={() => isOrder ? handleDeleteOrder(item.id) : handleDeleteLead(item.id)} 
                               className={`p-3 rounded-2xl transition-all flex items-center gap-2 ${deleteConfirmId === item.id ? 'bg-rose-500 text-white shadow-lg shadow-rose-100' : 'text-slate-400 hover:text-rose-500 hover:bg-rose-50'}`}
                             >
                               <Trash2 className="w-4 h-4" />
                               {deleteConfirmId === item.id && <span className="text-[0.6rem] font-black uppercase tracking-widest">Confirm?</span>}
                             </button>
                             {isOrder ? (
                               <button className="bg-slate-900 text-white px-5 py-2.5 rounded-2xl text-[0.65rem] font-black uppercase tracking-widest hover:bg-brand-primary hover:shadow-lg hover:shadow-indigo-100 transition-all">Gérer</button>
                             ) : (
                               <button className="flex items-center gap-2 text-[0.65rem] font-black text-emerald-600 bg-emerald-50 px-5 py-2.5 rounded-2xl hover:bg-emerald-500 hover:text-white transition-all uppercase tracking-widest shadow-sm border border-emerald-100">
                                 <RefreshCcw className="w-3.5 h-3.5" />
                                 WhatsApp
                               </button>
                             )}
                          </div>
                        </td>
                     </tr>
                   );
                 })}
               </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

