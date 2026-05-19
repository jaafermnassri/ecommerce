import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogIn, ShoppingBag } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    if (res.ok) {
      const data = await res.json();
      login(data.token, data.user);
      if (data.user.role === 'ADMIN') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } else {
      setError('Identifiants invalides');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 dashboard-font">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 border border-white">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-brand-dark rounded-2xl flex items-center justify-center mx-auto mb-4 text-brand-primary shadow-xl">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-black text-brand-dark tracking-tight">ConvertyFlow</h1>
          <p className="text-slate-400 text-sm font-semibold uppercase tracking-widest mt-1">SaaS COD Tunisia</p>
        </div>

        {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-xs font-bold mb-4 border border-red-100">{error}</div>}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="stat-label mb-2 block">Email Professionnel</label>
            <input 
              type="email" 
              required
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 ring-brand-primary ring-offset-2 transition-all text-sm"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="stat-label mb-2 block">Mot de passe</label>
            <input 
              type="password" 
              required
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 ring-brand-primary ring-offset-2 transition-all text-sm"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button 
            type="submit"
            className="w-full bg-brand-dark hover:bg-black text-brand-primary font-black py-4 rounded-xl shadow-xl transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-sm"
          >
            <LogIn className="w-5 h-5" />
            Accéder au Dashboard
          </button>
        </form>

        <p className="text-center mt-6 text-slate-500 text-sm">
          Pas encore de compte? <Link to="/register" className="text-blue-600 font-bold">S'inscrire</Link>
        </p>
      </div>
    </div>
  );
}
