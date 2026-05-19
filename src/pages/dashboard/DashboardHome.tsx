import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { TrendingUp, Users, ShoppingCart, Wallet, MousePointer2, ArrowUpRight, ArrowDownRight, Package, RefreshCcw, Layout, ShieldAlert, MessagesSquare, MessageSquare } from 'lucide-react';

import { useAuth } from '../../contexts/AuthContext';

export default function DashboardHome() {
  const { token } = useAuth();
  const [stats, setStats] = useState<any>({
    revenue: 0,
    orderCount: 0,
    leadCount: 0,
    abandonedCount: 0,
    chartData: [],
    announcement: null,
    isPremium: false,
    messages: []
  });
  const [loading, setLoading] = useState(true);
  const [showMessenger, setShowMessenger] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);

  const fetchData = async () => {
    if (!token) return;
    try {
      const results = await Promise.all([
        fetch('/api/admin/announcement', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/dashboard/stats', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/messages', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      const [announcementRes, statsRes, messagesRes] = results;

      if (!announcementRes.ok || !statsRes.ok || !messagesRes.ok) {
        let errorMsg = "Erreur lors de la récupération des données: ";
        if (!announcementRes.ok) errorMsg += `Announce (${announcementRes.status}) `;
        if (!statsRes.ok) errorMsg += `Stats (${statsRes.status}) `;
        if (!messagesRes.ok) errorMsg += `Messages (${messagesRes.status}) `;
        throw new Error(errorMsg);
      }

      const announcementData = await announcementRes.json();
      const statsData = await statsRes.json();
      const messagesData = await messagesRes.json();

      if (statsData && !statsData.error) {
        setStats({
          ...statsData,
          announcement: announcementData.announcement,
          messages: Array.isArray(messagesData) ? messagesData : []
        });
      }
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;
    setSending(true);
    try {
      await fetch('/api/messages/admin', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content: newMessage })
      });
      setNewMessage('');
      fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-32 space-y-4">
      <RefreshCcw className="w-10 h-10 text-brand-primary animate-spin" />
      <p className="text-sm font-bold text-slate-400 animate-pulse">Syncing your data...</p>
    </div>
  );

  const chartData = stats.chartData.length > 0 ? stats.chartData : [
    { name: 'Lun', sales: 0, leads: 0 },
    { name: 'Mar', sales: 0, leads: 0 },
    { name: 'Mer', sales: 0, leads: 0 },
    { name: 'Jeu', sales: 0, leads: 0 },
    { name: 'Ven', sales: 0, leads: 0 },
    { name: 'Sam', sales: 0, leads: 0 },
    { name: 'Dim', sales: 0, leads: 0 },
  ];

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {stats.announcement && (
        <div className="bg-brand-primary text-white p-6 rounded-3xl shadow-xl shadow-indigo-100 flex items-center gap-5 relative overflow-hidden group">
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
             <TrendingUp className="w-6 h-6 animate-bounce" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest opacity-80 mb-1">Annonce de la Platform</h4>
            <p className="text-sm font-bold leading-tight">{stats.announcement}</p>
          </div>
          <div className="absolute top-[-20px] right-[-20px] w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-1000"></div>
        </div>
      )}
      
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-1">Aperçu Global</h1>
          <p className="text-slate-500 font-medium tracking-tight">Bienvenue sur votre tableau de bord. Voici les performances de votre shop.</p>
        </div>
        <div className="flex gap-3">
           {stats.subdomain && (
             <a 
               href={`/store/${stats.subdomain}`}
               target="_blank"
               rel="noreferrer"
               className="bg-white text-slate-900 border border-slate-200 font-bold px-6 py-3 rounded-2xl flex items-center gap-2 hover:bg-slate-50 transition-all text-sm shadow-sm"
             >
               <Layout className="w-4 h-4" />
               Voir Ma Boutique
             </a>
           )}
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Chiffre d'Affaires" 
          value={`${stats.revenue.toFixed(3)} DT`} 
          sub="+12.5% vs mois dernier" 
          icon={Wallet}
          trend="up"
          color="indigo"
        />
        <StatCard 
          title="Commandes" 
          value={stats.orderCount} 
          sub="+3 nouvelles aujourd'hui" 
          icon={Package}
          trend="up"
          color="emerald"
        />
        <StatCard 
          title="Paniers Abandonnés" 
          value={stats.abandonedCount} 
          sub="-2% taux d'abandon" 
          icon={ShoppingCart}
          trend="down"
          color="amber"
          warning
        />
        <StatCard 
          title="Status Boutique" 
          value={stats.isPremium ? "Premium" : "Standard"} 
          sub={stats.isPremium ? "Toutes options activées" : "Passez au Premium"} 
          icon={ShieldAlert}
          trend={stats.isPremium ? "up" : "down"}
          color={stats.isPremium ? "blue" : "slate"}
        />
      </div>

      {stats.isPremium && (
        <section className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-xl shadow-slate-200/50">
           <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-2xl font-black text-slate-900 leading-tight">Assistance Directe</h3>
                <p className="text-sm font-medium text-slate-400 mt-1">Vous êtes client Premium. Contactez l'administrateur directement.</p>
              </div>
              <button 
                onClick={() => setShowMessenger(!showMessenger)}
                className="bg-brand-primary text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-3 shadow-lg shadow-indigo-100 hover:scale-105 transition-all"
              >
                <MessagesSquare className="w-5 h-5" />
                {showMessenger ? "Fermer le Chat" : "Ouvrir le Chat"}
              </button>
           </div>

           {showMessenger && (
             <div className="animate-in slide-in-from-top-4 duration-500">
                <div className="bg-slate-50 rounded-3xl p-6 min-h-[300px] max-h-[400px] overflow-y-auto mb-6 flex flex-col gap-4">
                   {stats.messages.map((m: any) => (
                     <div key={m.id} className={`max-w-[80%] p-4 rounded-2xl text-sm font-medium ${m.isAdmin ? 'bg-white border border-slate-100 self-start text-slate-600' : 'bg-brand-primary text-white self-end shadow-md shadow-indigo-100'}`}>
                        {m.content}
                        <div className={`text-[0.6rem] mt-2 opacity-60 ${m.isAdmin ? 'text-slate-400' : 'text-white'}`}>
                          {new Date(m.createdAt).toLocaleTimeString()}
                        </div>
                     </div>
                   ))}
                   {stats.messages.length === 0 && (
                     <div className="text-center py-20 text-slate-400 italic text-sm">
                        Démarrez une conversation avec l'administrateur.
                     </div>
                   )}
                </div>
                <form onSubmit={sendMessage} className="flex gap-4">
                   <input 
                    type="text" 
                    placeholder="Tapez votre message ici..." 
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    className="flex-1 bg-white border border-slate-200 rounded-2xl px-6 outline-none focus:border-brand-primary font-medium"
                   />
                   <button 
                    disabled={sending || !newMessage.trim()}
                    className="bg-brand-primary text-white w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-100 disabled:opacity-50 transition-all hover:scale-110"
                   >
                     {sending ? <RefreshCcw className="w-5 h-5 animate-spin" /> : <ArrowUpRight className="w-6 h-6" />}
                   </button>
                </form>
             </div>
           )}
        </section>
      )}

      <section>
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6 ml-1">Actions Rapides</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <Link to="/dashboard/orders" className="pro-card hover:border-brand-primary p-6 flex flex-col items-center text-center group transition-all">
             <div className="w-12 h-12 bg-indigo-50 text-brand-primary rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
               <ShoppingCart className="w-6 h-6" />
             </div>
             <span className="text-sm font-bold text-slate-900 mb-1">Voir Commandes</span>
             <span className="text-[0.65rem] text-slate-400 font-medium">{stats.orderCount} nouvelles ventes</span>
          </Link>

          <Link to="/dashboard/orders" className="pro-card hover:border-amber-400 p-6 flex flex-col items-center text-center group transition-all">
             <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
               <RefreshCcw className="w-6 h-6" />
             </div>
             <span className="text-sm font-bold text-slate-900 mb-1">Relancer Leads</span>
             <span className="text-[0.65rem] text-slate-400 font-medium">{stats.abandonedCount} abandons par téléphone</span>
          </Link>

          <Link to="/dashboard/products" className="pro-card hover:border-emerald-400 p-6 flex flex-col items-center text-center group transition-all">
             <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
               <Package className="w-6 h-6" />
             </div>
             <span className="text-sm font-bold text-slate-900 mb-1">Gérer Produits</span>
             <span className="text-[0.65rem] text-slate-400 font-medium">Ajouter & modifier stocks</span>
          </Link>

          <Link to="/dashboard/landing-pages" className="pro-card hover:border-indigo-400 p-6 flex flex-col items-center text-center group transition-all">
             <div className="w-12 h-12 bg-purple-50 text-purple-500 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
               <Layout className="w-6 h-6" />
             </div>
             <span className="text-sm font-bold text-slate-900 mb-1">Pages de Vente</span>
             <span className="text-[0.65rem] text-slate-400 font-medium">Optimiser vos tunnels</span>
          </Link>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="pro-card lg:col-span-2 min-h-[450px] flex flex-col">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">Graphique de Croissance</h3>
              <p className="text-xs font-semibold text-slate-400 mt-0.5 tracking-tight">Performance des ventes et leads hebdomadaire</p>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-brand-primary"></span>
                <span className="text-[0.7rem] font-bold text-slate-500">Ventes</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-200"></span>
                <span className="text-[0.7rem] font-bold text-slate-500 font-sans">Projection</span>
              </div>
            </div>
          </div>
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorIndigo" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="6 6" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 700}} 
                  dy={15}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 700}} 
                  dx={-10}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: 'var(--shadow-card)', padding: '12px' }}
                  itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="sales" 
                  stroke="#6366f1" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorIndigo)" 
                  animationDuration={2000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-8 flex flex-col">
          <div className="pro-card flex-1">
            <div className="flex items-center justify-between mb-8">
               <h3 className="text-sm font-bold text-slate-900 border-l-4 border-emerald-500 pl-3">Conversion Shop</h3>
               <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                 <MousePointer2 className="w-4 h-4" />
               </div>
            </div>
            <div className="space-y-6">
                <div className="flex justify-between items-end">
                  <span className="text-xs font-bold text-slate-400">Taux Moyen</span>
                  <span className="text-2xl font-bold text-slate-900 tracking-tighter">18.5%</span>
                </div>
                <div className="relative overflow-hidden h-3 rounded-full bg-slate-50 border border-slate-100 p-0.5">
                  <div style={{ width: "18.5%" }} className="h-full bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.3)]"></div>
                </div>
                <p className="text-[0.7rem] text-slate-500 leading-relaxed font-medium">
                  Optimisez vos <span className="text-brand-primary font-bold underline cursor-pointer">Landing Pages</span> pour atteindre l'objectif de 25%.
                </p>
                <div className="grid grid-cols-2 gap-4 pt-4">
                   <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                      <p className="text-[0.7rem] font-bold text-slate-400 mb-1">Visiteurs</p>
                      <p className="text-sm font-bold text-slate-900 italic">2.4k</p>
                   </div>
                   <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                      <p className="text-[0.7rem] font-bold text-slate-400 mb-1">Cliquants</p>
                      <p className="text-sm font-bold text-slate-900 italic">442</p>
                   </div>
                </div>
            </div>
          </div>

          <div className="bg-brand-primary rounded-[2rem] p-8 text-white relative overflow-hidden shadow-xl shadow-indigo-100">
             <div className="relative z-10">
               <h4 className="text-xl font-bold leading-tight mb-2" style={{ fontFamily: 'var(--font-title)' }}>Passez au Premium</h4>
               <p className="text-sm text-white/80 font-medium mb-6">Débloquez les analyses avancées et le tracking multi-pixel.</p>
               <button className="bg-white text-brand-primary px-6 py-3 rounded-2xl font-bold text-[0.8rem] shadow-lg shadow-black/10 hover:scale-105 transition-transform">
                 Améliorer Maintenant
               </button>
             </div>
             <div className="absolute top-[-20px] right-[-20px] w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
             <div className="absolute bottom-[-10px] left-[-10px] w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, sub, icon: Icon, trend, color, warning }: any) {
  const getColors = () => {
    switch(color) {
      case 'indigo': return 'text-indigo-600 bg-indigo-50 border-indigo-100';
      case 'emerald': return 'text-emerald-600 bg-emerald-50 border-emerald-100';
      case 'amber': return 'text-amber-600 bg-amber-50 border-amber-100';
      case 'blue': return 'text-blue-600 bg-blue-50 border-blue-100';
      default: return 'text-slate-600 bg-slate-50 border-slate-100';
    }
  };

  return (
    <div className="pro-card group hover:scale-[1.02] transition-all duration-300">
      <div className="flex items-center justify-between mb-6">
        <div className={`p-3.5 rounded-2xl border transition-all duration-300 group-hover:rotate-6 ${getColors()}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className={`flex items-center gap-1 text-[0.7rem] font-bold px-2 py-1 rounded-lg ${trend === 'up' ? 'text-emerald-500 bg-emerald-50' : 'text-rose-500 bg-rose-50'}`}>
          {trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {trend === 'up' ? 'Increase' : 'Decrease'}
        </div>
      </div>
      <div className="text-[0.7rem] font-bold text-slate-400 mb-1.5">{title}</div>
      <h4 className="text-2xl font-bold text-slate-900 tracking-tighter mb-2">{value}</h4>
      <p className="text-[0.65rem] font-medium text-slate-400 tracking-tight">
        {sub}
      </p>
    </div>
  );
}
