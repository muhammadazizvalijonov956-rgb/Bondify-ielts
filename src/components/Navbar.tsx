"use client";

import Link from 'next/link';
import { useAuth } from '@/lib/contexts/AuthContext';
import { LogOut, User as UserIcon, Settings, ShieldCheck, FileText, Zap } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { auth } from '@/lib/firebase/config';
import { signOut } from 'firebase/auth';

import { usePathname } from 'next/navigation';

export default function Navbar() {
  const { user, profile, loading } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();



  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Hide Navbar in practice sections where TestNavbar is used
  const isTestPage = pathname?.includes('/listening/') ||
    pathname?.includes('/reading/') ||
    pathname?.includes('/writing/') ||
    pathname?.includes('/full-test/') ||
    pathname?.includes('/daily-challenge');

  if (isTestPage) return null;

  const handleLogout = async () => {
    await signOut(auth);
    setDropdownOpen(false);
  };

  return (
    <header className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">

        {/* Logo and Branding */}
        <Link href="/" className="flex items-center gap-2 group">
          <img
            src="/assets/images/bondify_logo.png"
            alt="Bondify Logo"
            className="w-10 h-10 object-contain group-hover:scale-105 transition-transform shadow-sm"
            onError={(e) => {
              // fallback if logo is missing
              (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%230284c7"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>';
            }}
          />
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Bondify
          </h1>
        </Link>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center gap-6">
          <Link href="/pricing" className="text-slate-600 hover:text-primary-600 font-medium transition-colors">Pricing</Link>
          <Link href="/updates" className="text-slate-600 hover:text-primary-600 font-medium transition-colors">Updates</Link>
          <Link href="/events" className="text-slate-600 hover:text-primary-600 font-medium transition-colors">Events</Link>
          <Link href="/download" className="text-slate-600 hover:text-primary-600 font-medium transition-colors">Download</Link>
        </div>

        {/* User Auth / Menu */}
        <div className="flex items-center gap-4">
          {!loading && !user && (
            <>
              <Link href="/login" className="text-slate-600 hover:text-slate-900 font-medium px-2 py-1">
                Log In
              </Link>
              <Link href="/register" className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm">
                Sign Up
              </Link>
            </>
          )}

          {!loading && user && profile && (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-3 hover:bg-slate-50 p-1.5 pr-3 rounded-full border border-transparent hover:border-slate-200 transition-all"
              >
                {profile.profilePhotoUrl ? (
                  <img src={profile.profilePhotoUrl} alt="Profile" className="w-9 h-9 border border-slate-200 rounded-full object-cover" />
                ) : (
                  <div className="w-9 h-9 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center font-bold">
                    {profile.username?.charAt(0)?.toUpperCase() || <UserIcon className="w-5 h-5" />}
                  </div>
                )}

                <div className="hidden md:flex flex-col text-left">
                  <span className="text-sm font-semibold text-slate-800 leading-tight">
                    {profile.username || "User"}
                    {['go', 'plus', 'pro'].includes(profile.accountTier) && (
                      <Zap className="inline-block w-3 h-3 text-amber-500 ml-1 fill-amber-500" />
                    )}
                  </span>
                  <span className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                    Tokens: <span className="text-primary-600">{profile.tokenBalance || 0}</span>
                  </span>
                </div>
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden py-1 z-50 transform origin-top-right transition-all">
                  <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                    <p className="text-sm font-semibold text-slate-900 truncate">{profile.fullName || profile.username || 'User'}</p>
                    <p className="text-xs text-slate-500 truncate">{user.email}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="bg-primary-100 text-primary-800 text-xs font-bold px-2 py-0.5 rounded uppercase">
                        {profile.accountTier || 'Free'} Plan
                      </span>
                    </div>
                  </div>

                  <Link href="/profile" onClick={() => setDropdownOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                    <UserIcon className="w-4 h-4 text-slate-400" />
                    My Profile
                  </Link>

                  <Link href="/results" onClick={() => setDropdownOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                    <FileText className="w-4 h-4 text-slate-400" />
                    My Results
                  </Link>

                  {profile.role === 'admin' && (
                    <Link href="/admin" onClick={() => setDropdownOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-rose-600 bg-rose-50 hover:bg-rose-100 font-medium transition-colors border-y border-rose-100">
                      <ShieldCheck className="w-4 h-4 text-rose-600" />
                      Admin Dashboard
                    </Link>
                  )}



                  <Link href="/settings" onClick={() => setDropdownOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                    <Settings className="w-4 h-4 text-slate-400" />
                    Settings
                  </Link>

                  <div className="border-t border-slate-100 my-1"></div>

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors text-left"
                  >
                    <LogOut className="w-4 h-4 text-slate-400" />
                    Log out
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
