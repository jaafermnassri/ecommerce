import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, ShoppingBag, ShoppingCart, Settings, LogOut, Users, BarChart3, Layout } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function DashboardLayout({ isAdmin }: { isAdmin?: boolean }) {
  const { user, token, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const [sidebarStats, setSidebarStats] = React.useState({ orderCount: 0 });

  React.useEffect(() => {
    if (token && !isAdmin) {
      fetch('/api/dashboard/sidebar-stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => setSidebarStats(data))
      .catch(err => console.error(err));
    }
  }, [token, isAdmin]);

  const shopMenuItems = [
    { name: 'Tableau de bord', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Produits', path: '/dashboard/products', icon: ShoppingBag },
    { name: 'Commandes', path: '/dashboard/orders', icon: ShoppingCart },
    { name: 'Landing Pages', path: '/dashboard/landing-pages', icon: Layout },
    { name: 'Paramètres', path: '/dashboard/settings', icon: Settings },
  ];

  const adminMenuItems = [
    { name: 'Global Stats', path: '/admin', icon: BarChart3 },
    { name: 'Clients / Boutiques', path: '/admin/users', icon: Users },
    { name: 'Config Platform', path: '/admin/settings', icon: Settings },
  ];

  const menuItems = isAdmin ? adminMenuItems : shopMenuItems;

  return (
    <div className="flex h-screen bg-[#F9FAFB] dashboard-font overflow-hidden">
      {/* Refined Light Sidebar */}
      <aside className="w-[280px] bg-white border-r border-slate-100 flex flex-col z-20 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
        <div className="p-8 pb-4">
          <div className="flex items-center gap-3 mb-12 px-2">
            <div className="w-10 h-10 bg-brand-primary rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-100">
              <LayoutDashboard className="w-6 h-6 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold text-slate-900 tracking-tight leading-none" style={{ fontFamily: 'var(--font-title)' }}>Converty</span>
              <span className="text-[0.7rem] font-bold text-brand-primary mt-1">{isAdmin ? 'Admin Panel' : 'Flow Dashboard'}</span>
            </div>
          </div>
          
          <nav className="space-y-1.5">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl text-[0.85rem] transition-all duration-200 group ${
                    isActive 
                      ? 'bg-brand-primary text-white font-bold shadow-lg shadow-indigo-100' 
                      : 'text-slate-500 hover:bg-slate-50 hover:text-brand-primary'
                  }`}
                >
                  <item.icon className={`w-5 h-5 transition-colors ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-brand-primary'}`} />
                  <span className="flex-1">{item.name}</span>
                  {item.name === 'Commandes' && sidebarStats.orderCount > 0 && (
                    <span className={`px-2 py-0.5 rounded-full text-[0.65rem] font-bold ${isActive ? 'bg-white text-brand-primary' : 'bg-brand-primary text-white'}`}>
                      {sidebarStats.orderCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="mt-auto p-6 space-y-4">
          <div className="bg-slate-50 rounded-3xl p-4 border border-slate-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-white shadow-sm border border-slate-200 flex items-center justify-center text-brand-primary font-bold text-sm">
                {user?.email?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900 truncate tracking-tight">{user?.shopName || 'Boutique'}</p>
                <p className="text-[0.7rem] text-slate-400 truncate">{user?.email}</p>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="flex items-center justify-between w-full p-3 bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-2xl border border-slate-100 transition-all font-bold text-xs shadow-sm group"
            >
              <span>Déconnexion</span>
              <LogOut className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
          
          <div className="px-2">
             <p className="text-[0.65rem] text-slate-400 font-medium leading-relaxed">
               Propulsé par <span className="text-brand-primary font-bold">Converty.shop</span><br/>
               v1.2.0-stable (Tunisia)
             </p>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="bg-white/80 backdrop-blur-md h-20 border-b border-slate-100 flex items-center justify-between px-10 shrink-0 sticky top-0 z-10 shadow-sm">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-3">
              {isAdmin ? 'Plateforme ConvertyFlow' : (user?.shopName || 'Boutique Active')}
              <span className={`text-[0.65rem] px-2 py-0.5 rounded-full border font-bold ${isAdmin ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-indigo-50 text-brand-primary border-indigo-100'}`}>
                {isAdmin ? 'System Owner' : 'Plan Pro'}
              </span>
            </h2>
          </div>
          
          <div className="flex items-center gap-6">
             <div className="hidden md:flex bg-slate-50 border border-slate-200 px-4 py-2 rounded-2xl items-center gap-3 w-64 text-slate-400">
               <Layout className="w-4 h-4" />
               <span className="text-xs font-medium">Rechercher...</span>
               <span className="ml-auto text-[0.6rem] bg-white border border-slate-200 px-1.5 py-0.5 rounded shadow-sm font-black">⌘K</span>
             </div>
             <div className="flex items-center gap-3 border-l border-slate-100 pl-6">
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-black text-slate-900 leading-none mb-1 capitalize">Administrateur</p>
                  <p className="text-[0.6rem] text-brand-primary font-bold tracking-widest uppercase">En ligne</p>
                </div>
                <div className="w-11 h-11 bg-white border-2 border-slate-100 rounded-2xl p-0.5 shadow-sm transition-transform hover:scale-105 cursor-pointer">
                   <div className="w-full h-full bg-slate-50 rounded-[0.8rem] flex items-center justify-center text-brand-primary font-black text-sm">
                    {user?.email?.charAt(0).toUpperCase()}
                   </div>
                </div>
             </div>
          </div>
        </header>

        <section className="flex-1 overflow-y-auto p-10 scrollbar-hide">
          <div className="max-w-[1400px] mx-auto">
            <Outlet />
          </div>
        </section>
      </main>
    </div>
  );
}
