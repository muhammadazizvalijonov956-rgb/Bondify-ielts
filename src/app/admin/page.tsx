"use client";

import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Users, FileText, Calendar, TrendingUp, Trophy, Star } from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    users: 0,
    tests: 0,
    events: 0,
    attempts: 0,
    premium: 0,
    tokens: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const usersSnap = await getDocs(collection(db, 'users'));
        const testsSnap = await getDocs(collection(db, 'tests'));
        const eventsSnap = await getDocs(collection(db, 'events'));
        const attemptsSnap = await getDocs(collection(db, 'attempts'));
        
        let premiumCount = 0;
        let totalTokens = 0;

        usersSnap.forEach(doc => {
          const data = doc.data();
          if (['go', 'plus', 'pro'].includes(data.accountTier)) premiumCount++;
          if (data.tokenBalance) totalTokens += data.tokenBalance;
        });

        setStats({
          users: usersSnap.size,
          tests: testsSnap.size,
          events: eventsSnap.size,
          attempts: attemptsSnap.size,
          premium: premiumCount,
          tokens: totalTokens
        });
      } catch (err) {
        console.error("Failed to load admin stats", err);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Dashboard Overview</h1>
          <p className="text-slate-500 font-medium mt-1">Real-time metrics for Bondify.</p>
        </div>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-6">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="h-32 bg-slate-200 rounded-2xl"></div>
            <div className="h-32 bg-slate-200 rounded-2xl"></div>
            <div className="h-32 bg-slate-200 rounded-2xl"></div>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="h-32 bg-slate-200 rounded-2xl"></div>
            <div className="h-32 bg-slate-200 rounded-2xl"></div>
            <div className="h-32 bg-slate-200 rounded-2xl"></div>
          </div>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatCard title="Total Users" value={stats.users} icon={Users} color="bg-blue-50 text-blue-600" />
          <StatCard title="Total Tests Published" value={stats.tests} icon={FileText} color="bg-purple-50 text-purple-600" />
          <StatCard title="Active Events" value={stats.events} icon={Calendar} color="bg-rose-50 text-rose-600" />
          <StatCard title="Test Attempts" value={stats.attempts} icon={Trophy} color="bg-emerald-50 text-emerald-600" />
          <StatCard title="Premium Subscribers" value={stats.premium} icon={Star} color="bg-amber-50 text-amber-600" />
          <StatCard title="Tokens in Circulation" value={stats.tokens} icon={TrendingUp} color="bg-indigo-50 text-indigo-600" />
        </div>
      )}

      <div className="mt-12 bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900 mb-6">Quick Actions</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          <a href="/admin/tests/create" className="p-4 rounded-xl font-bold bg-primary-50 text-primary-700 hover:bg-primary-100 transition-colors text-center shadow-sm block">
            + Create New Test
          </a>
          <a href="/admin/events" className="p-4 rounded-xl font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors text-center shadow-sm block">
            + Schedule Event
          </a>
          <a href="/admin/users" className="p-4 rounded-xl font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors text-center shadow-sm block">
            Manage Users
          </a>
          <a href="/admin/payments" className="p-4 rounded-xl font-bold bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors text-center shadow-sm block border border-amber-200">
            Verify Payments
          </a>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color }: { title: string, value: string | number, icon: any, color: string }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex items-center justify-between">
      <div>
         <p className="text-sm text-slate-500 font-bold uppercase mb-1">{title}</p>
         <p className="text-3xl font-black text-slate-800">{value}</p>
      </div>
      <div className={`w-14 h-14 rounded-full flex items-center justify-center ${color}`}>
        <Icon className="w-7 h-7" />
      </div>
    </div>
  );
}
