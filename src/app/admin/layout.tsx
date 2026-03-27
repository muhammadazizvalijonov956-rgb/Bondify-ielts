"use client";

import { useAuth } from '@/lib/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import { ShieldAlert } from 'lucide-react';
import AdminSidebar from '@/components/admin/AdminSidebar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { profile, loading } = useAuth();

  if (loading) return <ProtectedRoute><div className="min-h-screen flex items-center justify-center text-slate-500">Verifying admin access...</div></ProtectedRoute>;
  
  if (profile?.role !== 'admin') {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="max-w-md w-full px-4 py-12 text-center bg-white rounded-3xl shadow-xl border border-slate-100">
            <div className="w-20 h-20 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShieldAlert className="w-10 h-10"/>
            </div>
            <h1 className="text-3xl font-black text-slate-900 mb-4">Access Denied</h1>
            <p className="text-slate-600 font-medium mb-8">You do not have permission to view the Bondify Admin Dashboard. This area is restricted.</p>
            <a href="/" className="bg-slate-900 text-white font-bold py-3 px-8 rounded-xl hover:bg-slate-800 transition-colors inline-block">Return Home</a>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  // Ensure Admin layout hides the main site Navbar and Footer by forcing a full screen takeover
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-50 flex">
        <AdminSidebar />
        <main className="flex-1 ml-64 min-h-screen bg-slate-50/50">
          {children}
        </main>
      </div>
    </ProtectedRoute>
  );
}
