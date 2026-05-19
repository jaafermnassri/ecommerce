/**
 * ConvertyFlow Core Application
 */
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Pages - We'll create these next
import SaaSPage from './pages/SaaSPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardLayout from './components/dashboard/DashboardLayout';
import DashboardHome from './pages/dashboard/DashboardHome';
import AdminDashboard from './pages/admin/AdminDashboard';
import ProductsPage from './pages/dashboard/ProductsPage';
import OrdersPage from './pages/dashboard/OrdersPage';
import SettingsPage from './pages/dashboard/SettingsPage';
import LandingPagesPage from './pages/dashboard/LandingPagesPage';
import LandingPageBuilder from './pages/dashboard/LandingPageBuilder';
import LandingPageRenderer from './pages/store/LandingPageRenderer';
import PublicStore from './pages/store/PublicStore';

function ProtectedRoute({ children, role }: { children: React.ReactNode, role?: string }) {
  const { user, token, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold text-slate-400">Chargement...</div>;
  if (!token) return <Navigate to="/login" />;
  if (role && user?.role !== role) return <Navigate to="/dashboard" />;
  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<SaaSPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/s/:slug" element={<LandingPageRenderer />} />
          <Route path="/store/:subdomain" element={<PublicStore />} />

          {/* Admin Dashboard */}
          <Route path="/admin" element={<ProtectedRoute role="ADMIN"><DashboardLayout isAdmin /></ProtectedRoute>}>
             <Route index element={<AdminDashboard />} />
             <Route path="users" element={<AdminDashboard />} />
             <Route path="pages" element={<AdminDashboard />} />
             <Route path="messages" element={<AdminDashboard />} />
             <Route path="settings" element={<AdminDashboard />} />
          </Route>

          {/* Shop Owner Dashboard (French) */}
          <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
            <Route index element={<DashboardHome />} />
            <Route path="products" element={<ProductsPage />} />
            <Route path="orders" element={<OrdersPage />} />
            <Route path="landing-pages" element={<LandingPagesPage />} />
            <Route path="landing-pages/builder/:id" element={<LandingPageBuilder />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
