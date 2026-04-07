"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  FileText,
  CalendarDays,
  Trophy,
  Settings,
  LogOut,
  ShieldCheck,
  Bell,
  Code2,
  Activity
} from 'lucide-react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { auth } from '@/lib/firebase/config';

const navItems = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Tests Control', href: '/admin/tests', icon: FileText },
  { name: 'Test Monitor', href: '/admin/test-monitor', icon: Activity },
  { name: 'User Management', href: '/admin/users', icon: Users },
  { name: 'Events', href: '/admin/events', icon: CalendarDays },
  { name: 'Leaderboard', href: '/admin/leaderboard', icon: Trophy },
  { name: 'Updates', href: '/admin/updates', icon: Bell },
  { name: 'Learning Manager', href: '/admin/learn', icon: Code2 },
  { name: 'Platform Settings', href: '/admin/settings', icon: Settings },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const { profile } = useAuth();

  return (
    <aside className="fixed inset-y-0 left-0 bg-slate-900 w-64 border-r border-slate-800 text-slate-300 flex flex-col z-50">
      <div className="h-16 flex items-center px-6 border-b border-slate-800 bg-slate-950/50">
        <Link href="/" className="flex items-center gap-2 text-white font-bold text-lg hover:opacity-80 transition-opacity">
          <ShieldCheck className="w-6 h-6 text-primary-500" />
          Bondify Admin
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto py-6 flex flex-col gap-1 px-4">
        {navItems.map((item) => {
          const isActive = item.href === '/admin'
            ? pathname === '/admin'
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-all ${isActive
                  ? 'bg-primary-600 text-white shadow-md'
                  : 'hover:bg-slate-800 hover:text-white'
                }`}
            >
              <item.icon className={`w-5 h-5 ${isActive ? 'text-primary-200' : 'text-slate-400'}`} />
              {item.name}
            </Link>
          );
        })}
      </div>

      <div className="p-4 border-t border-slate-800 bg-slate-950/50">
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center font-bold text-xs uppercase">
            {profile?.username?.charAt(0) || 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-white truncate">{profile?.username || 'Admin'}</div>
            <div className="text-xs text-slate-500 truncate">{profile?.role || 'admin'}</div>
          </div>
        </div>
        <button
          onClick={() => auth.signOut()}
          className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
