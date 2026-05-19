import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Users, 
  ShoppingBag, 
  TrendingUp, 
  Settings, 
  Search,
  CheckCircle2,
  XCircle,
  MoreVertical,
  Database,
  Loader2,
  MessageSquare,
  ShieldAlert,
  Save,
  Trash2,
  Power,
  BarChart3,
  MapPin,
  ArrowUpRight
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area 
} from 'recharts';

export default function AdminDashboard() {
  const { token } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [globalSettings, setGlobalSettings] = useState<any>(null);
  const [salesChart, setSalesChart] = useState<any[]>([]);
  const [regionChart, setRegionChart] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [landingPages, setLandingPages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [globalSearch, setGlobalSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [fetchingUser, setFetchingUser] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [activeShopId, setActiveShopId] = useState<string | null>(null);

  // Group messages by shop for the admin to see separate conversations
  const conversations = (() => {
    const map: Record<string, any> = {};
    messages.forEach(m => {
      // If shop sent it, shop is sender. If admin sent it, shop is recipient.
      const shopId = m.isAdmin ? m.recipientId : m.senderId;
      if (!shopId) return; // Skip global/system if any
      if (!map[shopId]) {
        map[shopId] = {
          shopId,
          shopName: m.sender?.shopName || 'Boutique',
          lastMessage: m.content,
          date: m.createdAt,
          messages: []
        };
      }
      map[shopId].messages.push(m);
      if (new Date(m.createdAt) > new Date(map[shopId].date)) {
        map[shopId].date = m.createdAt;
        map[shopId].lastMessage = m.content;
      }
    });
    return Object.values(map).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  })();

  const activeMessages = activeShopId ? messages.filter(m => (m.senderId === activeShopId || m.recipientId === activeShopId)) : [];
  const activeTab = location.pathname.includes('/users') ? 'users' : 
                   location.pathname.includes('/settings') ? 'settings' : 
                   location.pathname.includes('/messages') ? 'messages' : 
                   location.pathname.includes('/pages') ? 'pages' : 'overview';

  const fetchData = async () => {
    if (!token) return;
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      const responses = await Promise.all([
        fetch('/api/admin/stats', { headers }),
        fetch('/api/admin/users', { headers }),
        fetch('/api/admin/settings', { headers }),
        fetch('/api/admin/charts/sales', { headers }),
        fetch('/api/admin/charts/regions', { headers }),
        fetch('/api/messages', { headers }),
        fetch('/api/admin/landing-pages', { headers }),
      ]);

      const [statsRes, usersRes, settingsRes, salesRes, regionsRes, messagesRes, pagesRes] = responses;

      if (responses.some(r => !r.ok)) {
        throw new Error("Certaines données n'ont pas pu être chargées.");
      }

      const [statsData, usersData, settingsData, salesData, regionsData, messagesData, pagesData] = await Promise.all([
        statsRes.json(),
        usersRes.json(),
        settingsRes.json(),
        salesRes.json(),
        regionsRes.json(),
        messagesRes.json(),
        pagesRes.json()
      ]);

      setStats(statsData);
      setUsers(usersData);
      setGlobalSettings(settingsData);
      setSalesChart(salesData);
      setRegionChart(regionsData);
      setMessages(Array.isArray(messagesData) ? messagesData : []);
      setLandingPages(pagesData);
    } catch (error) {
      console.error("Fetch admin data failed:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token, location.pathname]);

  const fetchUserDetails = async (id: string) => {
    setFetchingUser(true);
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setSelectedUser(data);
      setShowModal(true);
    } catch (err) {
      console.error(err);
    } finally {
      setFetchingUser(false);
    }
  };

  const toggleUserActive = async (id: string) => {
    try {
      await fetch(`/api/admin/users/${id}/toggle-active`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchData();
      if (selectedUser?.id === id) {
        fetchUserDetails(id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const toggleUserPremium = async (id: string) => {
    try {
      await fetch(`/api/admin/users/${id}/toggle-premium`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchData();
      if (selectedUser?.id === id) {
        fetchUserDetails(id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const deleteUser = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette boutique ? Cette action est irréversible.')) return;
    try {
      await fetch(`/api/admin/users/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchData();
      if (selectedUser?.id === id) {
        setShowModal(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const toggleLandingPageSuspension = async (id: string) => {
    try {
      await fetch(`/api/admin/landing-pages/${id}/toggle-suspension`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleGlobalSearch = async (val: string) => {
    setGlobalSearch(val);
    if (!val.trim()) {
      setSearchResults(null);
      return;
    }
    setIsSearching(true);
    try {
      const res = await fetch(`/api/admin/search?q=${encodeURIComponent(val)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setSearchResults(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSearching(false);
    }
  };

  const updateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(globalSettings)
      });
      alert('Paramètres mis à jour !');
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return (
    <div className="min-h-[400px] flex items-center justify-center">
      <Loader2 className="w-10 h-10 animate-spin text-brand-primary" />
    </div>
  );

  const filteredUsers = users.filter(u => 
    u.shopName?.toLowerCase().includes(search.toLowerCase()) || 
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 font-sans">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight" style={{ fontFamily: 'var(--font-title)' }}>Plateforme Admin</h1>
          <p className="text-slate-500 font-medium tracking-tight">Gestion globale et monitoring de ConvertyFlow.</p>
        </div>

        <div className="flex-1 max-w-md relative group">
           <div className={`flex items-center gap-3 px-6 py-3.5 bg-white border rounded-[1.5rem] transition-all ${globalSearch ? 'border-brand-primary ring-4 ring-indigo-50 shadow-sm' : 'border-slate-100 hover:border-slate-200 shadow-sm'}`}>
              <Search className={`w-5 h-5 ${globalSearch ? 'text-brand-primary' : 'text-slate-400'}`} />
              <input 
                type="text" 
                placeholder="Recherche globale (Boutiques, Commandes, Pages)..." 
                className="bg-transparent outline-none flex-1 text-sm font-bold text-slate-900"
                value={globalSearch}
                onChange={e => handleGlobalSearch(e.target.value)}
              />
              {isSearching && <Loader2 className="w-4 h-4 animate-spin text-brand-primary" />}
           </div>

           {searchResults && globalSearch && (
             <div className="absolute top-full left-0 right-0 mt-4 bg-white border border-slate-100 rounded-[2rem] shadow-2xl z-[150] overflow-hidden p-2 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="max-h-[400px] overflow-y-auto custom-scrollbar p-2 space-y-6">
                   {/* Users */}
                   {searchResults.users?.length > 0 && (
                     <div>
                        <h4 className="px-4 text-[0.65rem] font-black text-slate-400 uppercase tracking-widest mb-2">Boutiques</h4>
                        <div className="space-y-1">
                           {searchResults.users.map((u: any) => (
                             <button onClick={() => { fetchUserDetails(u.id); setGlobalSearch(''); setSearchResults(null); }} key={u.id} className="w-full flex items-center gap-4 p-3 hover:bg-slate-50 rounded-2xl transition-all group">
                                <div className="w-10 h-10 bg-indigo-50 text-brand-primary rounded-xl flex items-center justify-center font-black">{u.shopName?.[0] || 'B'}</div>
                                <div className="text-left">
                                   <p className="text-sm font-bold text-slate-900 group-hover:text-brand-primary transition-colors">{u.shopName}</p>
                                   <p className="text-[0.7rem] text-slate-400">/{u.subdomain}</p>
                                </div>
                             </button>
                           ))}
                        </div>
                     </div>
                   )}

                   {/* Orders */}
                   {searchResults.orders?.length > 0 && (
                     <div>
                        <h4 className="px-4 text-[0.65rem] font-black text-slate-400 uppercase tracking-widest mb-2">Commandes</h4>
                        <div className="space-y-1">
                           {searchResults.orders.map((o: any) => (
                             <button key={o.id} className="w-full flex items-center justify-between p-4 hover:bg-slate-50 rounded-2xl transition-all">
                                <div className="text-left">
                                   <p className="text-sm font-bold text-slate-900">{o.customerName}</p>
                                   <p className="text-[0.65rem] text-slate-400">Boutique: {o.user?.shopName}</p>
                                </div>
                                <p className="text-xs font-black text-brand-primary">{o.total.toFixed(3)} DT</p>
                             </button>
                           ))}
                        </div>
                     </div>
                   )}

                   {/* Pages */}
                   {searchResults.pages?.length > 0 && (
                     <div>
                        <h4 className="px-4 text-[0.65rem] font-black text-slate-400 uppercase tracking-widest mb-2">Landing Pages</h4>
                        <div className="space-y-1">
                           {searchResults.pages.map((p: any) => (
                             <button key={p.id} className="w-full flex items-center justify-between p-4 hover:bg-slate-50 rounded-2xl transition-all">
                                <div className="text-left">
                                   <p className="text-sm font-bold text-slate-900">{p.title}</p>
                                   <p className="text-[0.65rem] text-slate-400">/{p.slug}</p>
                                </div>
                                <span className={`text-[0.6rem] font-bold px-2 py-0.5 rounded-lg border ${p.isSuspended ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                                   {p.isSuspended ? 'Suspendue' : 'Active'}
                                </span>
                             </button>
                           ))}
                        </div>
                     </div>
                   )}

                   {!searchResults.users?.length && !searchResults.orders?.length && !searchResults.pages?.length && (
                     <div className="p-8 text-center text-slate-400 italic">Aucun résultat trouvé.</div>
                   )}
                </div>
             </div>
           )}
        </div>
        
        <div className="flex bg-white p-1 rounded-2xl border border-slate-100 shadow-sm self-start">
           <button onClick={() => navigate('/admin')} className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'overview' ? 'bg-brand-primary text-white shadow-lg shadow-indigo-100' : 'text-slate-400 hover:text-slate-600'}`}>Vue d'ensemble</button>
           <button onClick={() => navigate('/admin/users')} className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'users' ? 'bg-brand-primary text-white shadow-lg shadow-indigo-100' : 'text-slate-400 hover:text-slate-600'}`}>Utilisateurs</button>
           <button onClick={() => navigate('/admin/pages')} className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'pages' ? 'bg-brand-primary text-white shadow-lg shadow-indigo-100' : 'text-slate-400 hover:text-slate-600'}`}>Pages</button>
           <button onClick={() => navigate('/admin/messages')} className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'messages' ? 'bg-brand-primary text-white shadow-lg shadow-indigo-100' : 'text-slate-400 hover:text-slate-600'}`}>Messages</button>
           <button onClick={() => navigate('/admin/settings')} className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'settings' ? 'bg-brand-primary text-white shadow-lg shadow-indigo-100' : 'text-slate-400 hover:text-slate-600'}`}>Configuration</button>
        </div>
      </header>

      {activeTab === 'overview' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <GlobalStatCard 
              title="Revenu Global" 
              value={`${(stats?.totalRevenue || 0).toFixed(3)} DT`} 
              icon={TrendingUp} 
              trend={`${stats?.orderCounts?.find((c: any) => c.status === 'DELIVERED')?._count?._all || 0} livraisons`}
              color="indigo" 
            />
            <GlobalStatCard 
              title="Utilisateurs" 
              value={stats?.totalUsers} 
              icon={Users} 
              trend={`+${stats?.newUsersToday} aujourd'hui`} 
              color="blue" 
            />
            <GlobalStatCard 
              title="Conversion" 
              value={`${(stats?.conversionRate || 0).toFixed(1)}%`} 
              icon={BarChart3} 
              trend={`${stats?.orderCounts?.reduce((acc: number, curr: any) => acc + curr._count._all, 0) || 0} total`} 
              color="emerald" 
            />
            <GlobalStatCard 
              title="Premium Ratio" 
              value={`${(stats?.premiumConversionRate || 0).toFixed(1)}%`} 
              icon={ShieldAlert} 
              trend={`${users.filter(u => u.isPremium).length} premium`} 
              color="amber" 
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="pro-card lg:col-span-2">
              <h3 className="text-lg font-bold text-slate-900 mb-8" style={{ fontFamily: 'var(--font-title)' }}>Revenu des 30 Derniers Jours</h3>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={salesChart}>
                    <defs>
                      <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
                    />
                    <Area type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="pro-card">
              <h3 className="text-lg font-bold text-slate-900 mb-8" style={{ fontFamily: 'var(--font-title)' }}>Répartition par Status</h3>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats?.orderCounts?.map((c: any) => ({ name: c.status, count: c._count._all })) || []}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar dataKey="count" fill="#818cf8" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="pro-card">
              <h3 className="text-lg font-bold text-slate-900 mb-8" style={{ fontFamily: 'var(--font-title)' }}>Volume par Région</h3>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={regionChart} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#475569', fontWeight: 'bold', fontSize: 12}} width={80} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar dataKey="value" fill="#6366f1" radius={[0, 8, 8, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="pro-card">
              <div className="flex items-center justify-between mb-8">
                 <h3 className="text-xl font-black text-slate-900 flex items-center gap-3" style={{ fontFamily: 'var(--font-title)' }}>
                    <TrendingUp className="w-6 h-6 text-emerald-500" />
                    Top Performing Shops (Leaderboard)
                 </h3>
                 <span className="text-[0.65rem] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-full border border-slate-100">Top 10 Global</span>
              </div>
              <div className="overflow-x-auto">
                 <table className="w-full text-left">
                    <thead>
                       <tr className="border-b border-slate-50">
                          <th className="pb-4 text-[0.65rem] font-black text-slate-400 uppercase px-4">Rang</th>
                          <th className="pb-4 text-[0.65rem] font-black text-slate-400 uppercase px-4">Boutique</th>
                          <th className="pb-4 text-[0.65rem] font-black text-slate-400 uppercase px-4 text-center">Commandes</th>
                          <th className="pb-4 text-[0.65rem] font-black text-slate-400 uppercase px-4 text-right">Revenu Total</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                       {stats?.topShops?.map((shop: any, index: number) => (
                         <tr key={shop.id} className="hover:bg-slate-50 transition-all cursor-pointer group" onClick={() => fetchUserDetails(shop.id)}>
                            <td className="p-4">
                               <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs ${index < 3 ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-400'}`}>
                                  {index + 1}
                               </div>
                            </td>
                            <td className="p-4">
                               <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-indigo-50 text-indigo-500 rounded-xl flex items-center justify-center font-black group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                                     {shop.shopName?.[0] || 'B'}
                                  </div>
                                  <div>
                                     <p className="text-sm font-black text-slate-900">{shop.shopName || 'Boutique'}</p>
                                     <p className="text-[0.65rem] text-slate-400 font-bold">{shop.email}</p>
                                  </div>
                               </div>
                            </td>
                            <td className="p-4 text-center">
                               <p className="text-sm font-black text-slate-700">{shop.orderCount}</p>
                            </td>
                            <td className="p-4 text-right">
                               <p className="text-sm font-black text-brand-primary">{shop.totalRevenue.toFixed(3)} DT</p>
                            </td>
                         </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
          </div>
        </>
      )}

      {activeTab === 'pages' && (
        <div className="pro-card animate-in fade-in duration-500">
           <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-black text-slate-900" style={{ fontFamily: 'var(--font-title)' }}>Landing Page Auditor & Moderator</h3>
           </div>
           
           <div className="overflow-x-auto">
              <table className="w-full text-left">
                 <thead>
                    <tr className="border-b border-slate-100">
                       <th className="p-4 text-[0.65rem] font-black text-slate-400 uppercase tracking-widest">Boutique</th>
                       <th className="p-4 text-[0.65rem] font-black text-slate-400 uppercase tracking-widest">Titre de la Page</th>
                       <th className="p-4 text-[0.65rem] font-black text-slate-400 uppercase tracking-widest text-center">Création</th>
                       <th className="p-4 text-[0.65rem] font-black text-slate-400 uppercase tracking-widest text-center">Statut</th>
                       <th className="p-4 text-[0.65rem] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50">
                    {landingPages.map((p: any) => (
                      <tr key={p.id} className="hover:bg-slate-50/50 transition-all">
                         <td className="p-4 font-bold text-sm text-slate-900">{p.user?.shopName}</td>
                         <td className="p-4">
                            <p className="text-sm font-bold text-slate-900">{p.title}</p>
                            <p className="text-[0.65rem] text-slate-400 font-bold tracking-tight">/{p.slug}</p>
                         </td>
                         <td className="p-4 text-center">
                            <p className="text-[0.65rem] font-bold text-slate-500 uppercase">{new Date(p.createdAt).toLocaleDateString()}</p>
                         </td>
                         <td className="p-4 text-center">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-[0.6rem] font-black uppercase tracking-widest border ${p.isSuspended ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                               {p.isSuspended ? 'Suspendue' : 'Active'}
                            </span>
                         </td>
                         <td className="p-4 text-right">
                            <div className="flex justify-end items-center gap-3">
                               <a href={`/s/${p.slug}`} target="_blank" className="p-2 bg-slate-100 text-slate-400 rounded-lg hover:bg-slate-200 transition-all">
                                  <ArrowUpRight className="w-5 h-5" />
                               </a>
                               <button 
                                onClick={() => toggleLandingPageSuspension(p.id)}
                                className={`px-4 py-2 rounded-xl text-xs font-black transition-all border ${p.isSuspended ? 'bg-indigo-600 text-white border-indigo-700 shadow-lg shadow-indigo-100' : 'bg-white text-rose-600 border-rose-100 hover:bg-rose-50'}`}
                               >
                                  {p.isSuspended ? 'Réactiver' : 'Suspendre'}
                               </button>
                            </div>
                         </td>
                      </tr>
                    ))}
                    {landingPages.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-20 text-center text-slate-400 italic">Aucune landing page trouvée.</td>
                      </tr>
                    )}
                 </tbody>
              </table>
           </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="pro-card">
          <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
            <h3 className="text-lg font-bold text-slate-900" style={{ fontFamily: 'var(--font-title)' }}>Gestion des Boutiques</h3>
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 px-4 py-2 rounded-xl text-slate-400 text-sm w-full md:w-64">
               <Search className="w-4 h-4" />
               <input 
                type="text" 
                placeholder="Rechercher..." 
                className="bg-transparent outline-none flex-1 font-medium"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
               />
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-50">
                  <th className="pb-4 text-[0.7rem] font-bold text-slate-400 uppercase tracking-widest px-4">Boutique</th>
                  <th className="pb-4 text-[0.7rem] font-bold text-slate-400 uppercase tracking-widest px-4">Admin</th>
                  <th className="pb-4 text-[0.7rem] font-bold text-slate-400 uppercase tracking-widest px-4">Stats</th>
                  <th className="pb-4 text-[0.7rem] font-bold text-slate-400 uppercase tracking-widest px-4">Status</th>
                  <th className="pb-4 text-[0.7rem] font-bold text-slate-400 uppercase tracking-widest px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                 {filteredUsers.map(u => (
                  <tr key={u.id} className="group hover:bg-slate-50 transition-all">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-50 text-brand-primary rounded-xl flex items-center justify-center font-bold">
                          {u.shopName?.[0] || 'B'}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{u.shopName || 'Boutique'}</p>
                          <p className="text-[0.7rem] text-slate-400">/{u.subdomain}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="text-xs font-medium text-slate-600">{u.email}</p>
                      <p className="text-[0.65rem] text-slate-400 italic">Depuis {new Date(u.createdAt).toLocaleDateString()}</p>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <p className="text-[0.65rem] font-bold text-slate-400 uppercase">Comm</p>
                          <p className="text-xs font-bold text-slate-800">{u._count.orders}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-[0.65rem] font-bold text-slate-400 uppercase">Prod</p>
                          <p className="text-xs font-bold text-slate-800">{u._count.products}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-2">
                        <button 
                          onClick={() => toggleUserActive(u.id)}
                          className={`group w-max px-3 py-1 rounded-full text-[0.6rem] font-bold uppercase tracking-widest flex items-center gap-2 transition-all ${
                            u.active ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                          }`}
                        >
                          {u.active ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          {u.active ? 'Actif' : 'Bloqué'}
                        </button>
                        {u.isPremium && (
                          <span className="w-max px-3 py-1 bg-amber-100 text-amber-700 text-[0.6rem] font-bold uppercase tracking-widest rounded-full flex items-center gap-2">
                            <ShieldAlert className="w-3 h-3" /> Premium
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                       <div className="flex justify-end gap-2">
                         <button 
                          onClick={() => fetchUserDetails(u.id)}
                          className="p-2 text-slate-400 hover:text-brand-primary transition-colors flex items-center gap-1 text-xs font-bold"
                         >
                           {fetchingUser && selectedUser?.id === u.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <MoreVertical className="w-5 h-5" />}
                           Détails
                         </button>
                         <button 
                          onClick={() => deleteUser(u.id)}
                          className="p-2 text-slate-300 hover:text-rose-600 transition-colors"
                         >
                           <Trash2 className="w-5 h-5" />
                         </button>
                       </div>
                    </td>
                  </tr>
                 ))}
              </tbody>
            </table>
          </div>

          {/* User Details Modal */}
          {showModal && selectedUser && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
              <div className="bg-white rounded-[3rem] w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-300">
                <header className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                   <div className="flex items-center gap-6">
                      <div className="w-16 h-16 bg-brand-primary text-white rounded-2xl flex items-center justify-center text-2xl font-black shadow-lg shadow-indigo-100">
                        {selectedUser.shopName?.[0] || 'B'}
                      </div>
                      <div>
                        <h2 className="text-2xl font-black text-slate-900">{selectedUser.shopName || 'Boutique'}</h2>
                        <div className="flex items-center gap-4 mt-1">
                          <p className="text-sm font-bold text-brand-primary">/{selectedUser.subdomain}</p>
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                          <p className="text-xs font-medium text-slate-500">{selectedUser.email}</p>
                        </div>
                      </div>
                   </div>
                   <button 
                    onClick={() => setShowModal(false)}
                    className="p-3 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-colors shadow-sm"
                   >
                     <XCircle className="w-6 h-6 text-slate-400" />
                   </button>
                </header>

                <div className="flex-1 overflow-y-auto p-8">
                   <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                      <DetailStat label="Commandes" value={selectedUser._count.orders} icon={ShoppingBag} color="blue" />
                      <DetailStat label="Produits" value={selectedUser._count.products} icon={Database} color="indigo" />
                      <DetailStat label="Pages" value={selectedUser._count.landingPages} icon={Save} color="emerald" />
                      <DetailStat label="Leads" value={selectedUser._count.leads} icon={Users} color="amber" />
                   </div>

                   <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <div>
                        <h3 className="text-[0.65rem] font-black text-slate-400 uppercase tracking-widest mb-4">Derniers Produits</h3>
                        <div className="space-y-4">
                           {selectedUser.products.map((p: any) => (
                            <div key={p.id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl">
                               <div className="w-12 h-12 bg-white rounded-xl overflow-hidden border border-slate-100 flex-shrink-0">
                                  {p.image ? <img src={p.image} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-200"><Database className="w-6 h-6" /></div>}
                               </div>
                               <div className="flex-1">
                                  <p className="text-sm font-bold text-slate-900 leading-tight">{p.name}</p>
                                  <p className="text-xs font-medium text-brand-primary">{p.price.toFixed(3)} DT</p>
                               </div>
                            </div>
                           ))}
                           {selectedUser.products.length === 0 && <p className="text-xs text-slate-400 italic">Aucun produit.</p>}
                        </div>
                      </div>

                      <div>
                        <h3 className="text-[0.65rem] font-black text-slate-400 uppercase tracking-widest mb-4 text-right">Dernières Commandes</h3>
                        <div className="space-y-4">
                           {selectedUser.orders.map((o: any) => (
                            <div key={o.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                               <div>
                                  <p className="text-sm font-bold text-slate-900">{o.customerName}</p>
                                  <p className="text-[0.65rem] text-slate-500">{new Date(o.createdAt).toLocaleDateString()}</p>
                               </div>
                               <div className="text-right">
                                  <p className="text-sm font-black text-slate-900">{o.total.toFixed(3)} DT</p>
                                  <span className={`text-[0.6rem] font-bold px-2 py-0.5 rounded-lg border ${
                                    o.status === 'DELIVERED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                                    'bg-blue-50 text-blue-600 border-blue-100'
                                  }`}>
                                    {o.status}
                                  </span>
                               </div>
                            </div>
                           ))}
                           {selectedUser.orders.length === 0 && <p className="text-xs text-slate-400 italic">Aucune commande.</p>}
                        </div>
                      </div>
                   </div>
                </div>

                <footer className="p-8 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
                   <div className="flex items-center gap-4">
                      <button 
                        onClick={() => {
                          setActiveShopId(selectedUser.id);
                          navigate('/admin/messages');
                          setShowModal(false);
                        }}
                        className="px-6 py-3 bg-indigo-50 text-brand-primary border border-indigo-100 rounded-xl font-bold text-sm shadow-sm flex items-center gap-2 transition-all hover:bg-indigo-100"
                      >
                         <MessageSquare className="w-4 h-4" />
                         Contacter
                      </button>
                      <button 
                        onClick={() => toggleUserActive(selectedUser.id)}
                        className={`px-6 py-3 rounded-xl font-bold text-sm shadow-sm flex items-center gap-2 transition-all ${
                          selectedUser.active ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                        }`}
                      >
                         <Power className="w-4 h-4" />
                         {selectedUser.active ? "Bloquer l'accès" : "Réactiver l'accès"}
                      </button>
                      <button 
                        onClick={() => toggleUserPremium(selectedUser.id)}
                        className={`px-6 py-3 rounded-xl font-bold text-sm shadow-sm flex items-center gap-2 transition-all ${
                          selectedUser.isPremium ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                         <ShieldAlert className="w-4 h-4" />
                         {selectedUser.isPremium ? "Passer en Standard" : "Activer Premium"}
                      </button>
                   </div>
                   <p className="text-xs font-medium text-slate-400">ID: {selectedUser.id}</p>
                </footer>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'messages' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-500 min-h-[600px]">
           {/* Conversation List */}
           <div className="pro-card p-6 flex flex-col">
              <h3 className="text-xl font-black text-slate-900 mb-6" style={{ fontFamily: 'var(--font-title)' }}>Conversations</h3>
              <div className="flex-1 overflow-y-auto space-y-3">
                 {conversations.map((c: any) => (
                   <button 
                    key={c.shopId}
                    onClick={() => setActiveShopId(c.shopId)}
                    className={`w-full text-left p-4 rounded-2xl transition-all border ${activeShopId === c.shopId ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-100 hover:border-slate-200 shadow-sm'}`}
                   >
                      <div className="flex justify-between items-start mb-2">
                         <span className="text-sm font-black text-slate-900">{c.shopName}</span>
                         <span className="text-[0.6rem] text-slate-400 font-bold">{new Date(c.date).toLocaleDateString()}</span>
                      </div>
                      <p className="text-xs text-slate-500 font-medium line-clamp-1 truncate">{c.lastMessage}</p>
                   </button>
                 ))}
                 {conversations.length === 0 && (
                   <div className="text-center py-20 text-slate-400 italic text-sm">
                      Aucune conversation.
                   </div>
                 )}
              </div>
           </div>

           {/* Chat Window */}
           <div className="lg:col-span-2 pro-card p-0 overflow-hidden flex flex-col">
              {activeShopId ? (
                <>
                  <header className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                     <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-brand-primary text-white rounded-xl flex items-center justify-center font-black">
                           {(conversations.find(c => c.shopId === activeShopId)?.shopName || users.find(u => u.id === activeShopId)?.shopName || 'B')[0]}
                        </div>
                        <div>
                           <h4 className="text-sm font-black text-slate-900">
                             {conversations.find(c => c.shopId === activeShopId)?.shopName || users.find(u => u.id === activeShopId)?.shopName || 'Boutique'}
                           </h4>
                           <p className="text-[0.65rem] text-brand-primary font-bold">Client Premium</p>
                        </div>
                     </div>
                  </header>
                  <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/30">
                     {activeMessages.map((m: any) => (
                       <div key={m.id} className={`max-w-[80%] p-4 rounded-2xl text-sm font-medium ${m.isAdmin ? 'bg-brand-primary text-white self-end ml-auto shadow-md shadow-indigo-100' : 'bg-white border border-slate-200 self-start text-slate-600'}`}>
                          {m.content}
                          <div className={`text-[0.6rem] mt-2 opacity-60 ${m.isAdmin ? 'text-white' : 'text-slate-400'}`}>
                            {new Date(m.createdAt).toLocaleTimeString()}
                          </div>
                       </div>
                     ))}
                  </div>
                  <div className="p-6 border-t border-slate-100 bg-white">
                     <div className="flex gap-4">
                        <textarea 
                          placeholder="Tapez votre réponse ici..." 
                          value={replyText}
                          onChange={e => setReplyText(e.target.value)}
                          className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl p-4 outline-none focus:border-brand-primary font-medium text-sm transition-all resize-none"
                          rows={2}
                        />
                        <button 
                          onClick={async () => {
                            if (!replyText.trim()) return;
                            await fetch('/api/messages/admin', {
                              method: 'POST',
                              headers: { 
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json'
                              },
                              body: JSON.stringify({ content: replyText, recipientId: activeShopId })
                            });
                            setReplyText('');
                            fetchData();
                          }}
                          className="bg-brand-primary text-white w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-100 hover:scale-110 transition-all flex-shrink-0"
                        >
                          <ArrowUpRight className="w-6 h-6" />
                        </button>
                     </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-12">
                   <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center mb-4">
                      <MessageSquare className="w-8 h-8" />
                   </div>
                   <p className="font-medium italic">Sélectionnez une conversation pour répondre.</p>
                </div>
              )}
           </div>
        </div>
      )}

      {activeTab === 'settings' && globalSettings && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="pro-card">
            <h3 className="text-lg font-bold text-slate-900 mb-8 flex items-center gap-3" style={{ fontFamily: 'var(--font-title)' }}>
              <Settings className="w-6 h-6 text-brand-primary" />
              Politique de Livraison Platform
            </h3>
            
            <form onSubmit={updateSettings} className="space-y-8">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                   <label className="text-[0.7rem] font-bold text-slate-400 uppercase tracking-widest mb-2 block ml-2">Frais Fixes (DT)</label>
                   <input 
                    type="number" 
                    step="0.1" 
                    value={globalSettings.defaultDelivery ?? 0} 
                    onChange={e => setGlobalSettings({...globalSettings, defaultDelivery: parseFloat(e.target.value)})}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 outline-none focus:border-brand-primary font-bold text-slate-700" 
                   />
                 </div>
                 <div>
                   <label className="text-[0.7rem] font-bold text-slate-400 uppercase tracking-widest mb-2 block ml-2">Livraison Gratuite (min DT)</label>
                   <input 
                    type="number" 
                    step="1" 
                    value={globalSettings.freeShippingMin ?? 0} 
                    onChange={e => setGlobalSettings({...globalSettings, freeShippingMin: parseFloat(e.target.value)})}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 outline-none focus:border-brand-primary font-bold text-slate-700" 
                   />
                 </div>
               </div>

               <div className="p-6 bg-amber-50 rounded-[2rem] border border-amber-100">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-amber-500 flex-shrink-0">
                      <Power className="w-6 h-6" />
                    </div>
                    <div>
                       <h4 className="text-sm font-bold text-slate-900">Mode Maintenance</h4>
                       <p className="text-[0.7rem] text-slate-500 font-medium">Bloque l'accès à toutes les boutiques de la plateforme.</p>
                    </div>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setGlobalSettings({...globalSettings, maintenanceMode: !globalSettings.maintenanceMode})}
                    className={`w-full py-4 rounded-xl font-bold transition-all border-2 ${globalSettings.maintenanceMode ? 'bg-rose-500 text-white border-rose-600' : 'bg-white text-slate-600 border-slate-200'}`}
                  >
                    {globalSettings.maintenanceMode ? "Désactiver la Maintenance" : "Activer la Maintenance"}
                  </button>
               </div>

               <button type="submit" className="w-full bg-slate-900 text-white font-bold py-5 rounded-2xl shadow-xl flex items-center justify-center gap-2 hover:bg-black transition-all">
                 <Save className="w-5 h-5" /> Enregistrer les changements
               </button>
            </form>
          </div>

          <div className="pro-card">
             <h3 className="text-lg font-bold text-slate-900 mb-8 flex items-center gap-3" style={{ fontFamily: 'var(--font-title)' }}>
                <MessageSquare className="w-6 h-6 text-indigo-500" />
                Annonce Globale (Dashboard)
             </h3>
             <p className="text-[0.8rem] text-slate-400 mb-6 italic">Visible par tous les propriétaires de boutiques sur leur tableau de bord.</p>
             
             <textarea 
              rows={4} 
              placeholder="Ex: Nouvelle mise à jour disponible ce soir..." 
              value={globalSettings.announcement || ''}
              onChange={e => setGlobalSettings({...globalSettings, announcement: e.target.value})}
              className="w-full bg-slate-50 border border-slate-100 rounded-3xl p-6 outline-none focus:border-brand-primary font-medium text-slate-700"
             />
             
             <div className="mt-8 p-6 border border-dashed border-slate-200 rounded-3xl">
                <p className="text-[0.65rem] font-bold text-slate-400 uppercase tracking-widest mb-4">Aperçu</p>
                <div className="bg-indigo-600 text-white p-5 rounded-2xl shadow-lg flex items-center gap-4">
                   <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                      <ZapIcon className="w-6 h-6" />
                   </div>
                   <p className="text-sm font-bold">{globalSettings.announcement || "Aucune annonce active."}</p>
                </div>
             </div>

             <button 
              onClick={updateSettings}
              className="w-full mt-6 bg-white border border-slate-200 text-slate-900 font-bold py-5 rounded-2xl hover:bg-slate-50 transition-all flex items-center justify-center gap-2 shadow-sm"
             >
               Diffuser l'annonce
             </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ZapIcon(props: any) {
  return (
    <svg 
      {...props} 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
    >
      <path d="M4 14.71V2.69a1 1 0 0 1 1.61-.78l14 10.74a1 1 0 0 1-.61 1.78H4a1 1 0 0 1-1-1z" />
      <path d="M20 9.29v12.02a1 1 0 0 1-1.61.78l-14-10.74a1 1 0 0 1 .61-1.78H20a1 1 0 0 1 1 1z" />
    </svg>
  );
}

function DetailStat({ label, value, icon: Icon, color }: any) {
  const colors: any = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100'
  };
  return (
    <div className={`p-5 rounded-3xl border ${colors[color]} text-center`}>
       <div className="w-10 h-10 bg-white rounded-xl shadow-sm mx-auto mb-3 flex items-center justify-center">
          <Icon className="w-5 h-5" />
       </div>
       <p className="text-[0.6rem] font-bold opacity-80 uppercase tracking-widest mb-0.5">{label}</p>
       <p className="text-xl font-black leading-none">{value}</p>
    </div>
  );
}

function GlobalStatCard({ title, value, icon: Icon, trend, color }: any) {
  const colorMap: any = {
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100'
  };

  return (
    <div className="pro-card group hover:translate-y-[-4px] transition-all">
       <div className="flex justify-between items-start mb-6">
          <div className={`p-4 rounded-2xl border ${colorMap[color]}`}>
             <Icon className="w-6 h-6" />
          </div>
          <span className="text-[0.65rem] font-bold text-slate-400 bg-slate-50 px-2.5 py-1 rounded-full border border-slate-100 group-hover:bg-brand-primary group-hover:text-white transition-colors">{trend}</span>
       </div>
       <p className="text-[0.7rem] font-bold text-slate-400 uppercase tracking-widest mb-1">{title}</p>
       <h4 className="text-2xl font-black text-slate-900 tracking-tighter">{value}</h4>
    </div>
  );
}

