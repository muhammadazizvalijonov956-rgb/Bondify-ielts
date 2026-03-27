"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Trophy, Star, ArrowRight, CheckCircle2, Flame, Zap as Lightning, Clock, Layout, Play, Gift, Monitor } from 'lucide-react';
import { useAuth } from '@/lib/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function Home() {
  const { user, profile } = useAuth();
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const tomorrow = new Date();
      tomorrow.setHours(24, 0, 0, 0);
      const diff = tomorrow.getTime() - now.getTime();

      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft(`${h}h ${m}m ${s}s`);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const today = new Date().toISOString().split('T')[0];
  const hasCompletedDaily = profile?.lastChallengeDate === today;

  return (
    <div className="flex flex-col gap-12 py-8">

      {/* Personalized Header (If Logged In) */}
      {user && profile && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full mt-4">
          <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-xl shadow-slate-200/50 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-12 opacity-[0.03] transform translate-x-8 -translate-y-8 pointer-events-none">
              <Trophy className="w-64 h-64" />
            </div>

            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-[2rem] bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                {profile.profilePhotoUrl ? (
                  <img src={profile.profilePhotoUrl} className="w-full h-full rounded-[2rem] object-cover" />
                ) : (
                  <span className="text-3xl font-black">{profile.username?.[0]?.toUpperCase()}</span>
                )}
              </div>
              <div>
                <h1 className="text-3xl font-black text-slate-900 leading-tight">Welcome back, {profile.username}!</h1>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-rose-50 text-rose-600 rounded-full text-sm font-black border border-rose-100 italic">
                    <Flame className="w-4 h-4 fill-rose-500" /> {profile.currentStreak || 0} Day Streak
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-sm font-black border border-amber-100">
                    <Gift className="w-4 h-4 fill-amber-500" /> {profile.tokenBalance || 0} Tokens
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Link href="/profile" className="px-6 py-3 rounded-2xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition-colors">My Profile</Link>
              <Link href="/leaderboard" className="px-6 py-3 rounded-2xl bg-slate-900 text-white font-bold hover:bg-black transition-colors shadow-lg">Leaderboard</Link>
            </div>
          </div>
        </section>
      )}

      {/* Gamification Area: Daily Challenge */}
      {user && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Daily Challenge Card */}
            <div className="lg:col-span-2 group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary-600 to-indigo-700 rounded-[3rem] blur-2xl opacity-10 group-hover:opacity-20 transition-opacity"></div>
              <div className="relative bg-gradient-to-br from-primary-600 to-indigo-800 rounded-[3rem] p-10 text-white overflow-hidden shadow-2xl">
                {/* Decorative icon */}
                <Lightning className="absolute -bottom-10 -right-10 w-64 h-64 text-white/5 rotate-12" />

                <div className="flex items-start justify-between mb-8">
                  <div>
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/20 text-white text-xs font-black uppercase tracking-widest border border-white/20 mb-4 backdrop-blur-sm">
                      <Clock className="w-3.5 h-3.5" /> Next Reset: {timeLeft}
                    </div>
                    <h2 className="text-4xl font-black mb-4 tracking-tight leading-tight">Daily IELTS <br /> Micro-Challenge</h2>
                    <p className="text-primary-100 font-medium max-w-md text-lg leading-relaxed">
                      10 quick mixed questions to keep your skills sharp. Complete today to maintain your {profile?.currentStreak || 0} day streak!
                    </p>
                  </div>
                  <div className="hidden md:flex flex-col items-center justify-center w-24 h-24 rounded-[2rem] bg-white shadow-xl text-primary-600">
                    <span className="text-3xl font-black leading-none">10</span>
                    <span className="text-[10px] font-black uppercase tracking-wider mt-1 opacity-60">Quest.</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 flex-wrap">
                  {hasCompletedDaily ? (
                    <div className="flex items-center gap-3 px-8 py-4 bg-emerald-500 text-white rounded-2xl font-black shadow-lg">
                      <CheckCircle2 className="w-6 h-6" /> CHALLENGE COMPLETE
                    </div>
                  ) : (
                    <Link href="/daily-challenge" className="flex items-center gap-3 px-10 py-5 bg-white text-primary-700 rounded-2xl font-black text-xl hover:scale-105 active:scale-95 transition-all shadow-xl">
                      <Play className="w-6 h-6 fill-primary-700" /> Start Now
                    </Link>
                  )}
                  {!hasCompletedDaily && (
                    <p className="text-white/60 text-sm font-bold flex items-center gap-2 italic">
                      <Lightning className="w-4 h-4 fill-white/60" /> Earn +15 Streak Points
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Stats / Motivation Section */}
            <div className="bg-white rounded-[3rem] border-2 border-slate-100 p-8 flex flex-col items-center justify-center text-center shadow-sm relative overflow-hidden">
              <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-slate-50 to-transparent"></div>

              <div className="relative z-10 w-full">
                {profile && profile.leaderboardStats?.testsCompleted === 0 ? (
                  <>
                    <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-slate-100 shadow-inner group cursor-help transition-all hover:bg-white hover:shadow-md">
                        <Trophy className="w-10 h-10 text-slate-300 group-hover:text-amber-500 transition-colors" />
                    </div>
                    <h3 className="text-xl font-black text-slate-800 mb-2">No Records Yet!</h3>
                    <p className="text-slate-500 font-medium mb-6 text-sm leading-relaxed max-w-[200px] mx-auto">
                      Your global rank is hidden. Take a test to appear on the world stage!
                    </p>
                    <Link href="/listening" className="inline-flex items-center gap-2 bg-slate-900 text-white font-bold px-6 py-3 rounded-xl hover:bg-black transition-all shadow-lg active:scale-95">
                      Begin Journey <ArrowRight className="w-4 h-4" />
                    </Link>
                  </>
                ) : (
                  <div className="w-full">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Performance</h3>
                        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-primary-50 text-primary-600 rounded-lg text-[10px] font-black border border-primary-100">
                           TARGET {profile?.targetBand || 7.5}
                        </div>
                    </div>
                    
                    {/* Simplified SVG Line Chart */}
                    <div className="h-32 w-full relative mb-6">
                        <svg className="w-full h-full overflow-visible">
                            {/* Target Band Line */}
                            {(() => {
                                const target = profile?.targetBand || 7.5;
                                const y = 100 - (target / 9) * 100;
                                return (
                                    <line 
                                        x1="0" y1={`${y}%`} x2="100%" y2={`${y}%`} 
                                        stroke="#cbd5e1" strokeWidth="2" strokeDasharray="4 4" 
                                    />
                                );
                            })()}
                            
                            {/* Trend Line (Mocked if no data) */}
                            <polyline
                                fill="none"
                                stroke="url(#gradient)"
                                strokeWidth="4"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                points="0,110 20,95 40,105 60,80 80,85 100,50"
                                className="transition-all duration-1000"
                                style={{ strokeDasharray: 1000, strokeDashoffset: 0 }}
                            />
                            <defs>
                                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="#4f46e5" />
                                    <stop offset="100%" stopColor="#818cf8" />
                                </linearGradient>
                            </defs>
                        </svg>
                        <div className="absolute top-0 right-0 -translate-y-2 translate-x-1 flex flex-col items-center">
                            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                            <span className="text-[10px] font-black text-slate-800">NOW</span>
                        </div>
                    </div>

                    <p className="text-slate-500 font-medium mb-4 text-xs leading-relaxed text-left">
                        Seeing your score physically sitting below your <strong>Target Band</strong> creates an immediate psychological "itch" to improve.
                    </p>
                    
                    <div className="w-full bg-slate-100 rounded-full h-2 mb-2 overflow-hidden">
                      <div className="bg-primary-600 h-full rounded-full transition-all" style={{ width: '65%' }}></div>
                    </div>
                    <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <span>Milestone Progress</span>
                        <span>65%</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Hero Section (Guest Only) */}
      {!user && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-8">
          <h1 className="text-5xl sm:text-7xl font-black text-slate-900 mb-6 tracking-tight leading-tight">
            Level up your <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-indigo-600">IELTS</span> <br />
            <span className="text-slate-800 underline decoration-primary-500/20 underline-offset-8">daily.</span>
          </h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto mb-12 leading-relaxed font-medium">
            Practice for free, maintain your streak, and compete with thousands of students in a gamified environment. Achieve your dream band score with Bondify.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/register" className="bg-primary-600 hover:bg-primary-700 text-white font-black px-10 py-5 rounded-2xl shadow-xl shadow-primary-500/20 hover:shadow-2xl hover:-translate-y-1 transition-all text-xl flex items-center justify-center gap-2 group">
              Join for Free <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </section>
      )}

      {/* Core Practice Areas */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full mb-12">
        <div className="flex items-center gap-3 mb-10">
          <div className="h-10 w-2.5 bg-primary-600 rounded-full"></div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">Practice Hub</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <PracticeCard
            title="Listening"
            description="Improve your focus with real test simulations."
            href="/listening"
            icon={<div className="w-12 h-12 bg-sky-100 text-sky-600 rounded-2xl flex items-center justify-center shadow-inner"><Clock className="w-6 h-6" /></div>}
            color="bg-white border-slate-100 hover:border-sky-500 shadow-sm"
          />
          <PracticeCard
            title="Reading"
            description="Academic passages with real-time timers."
            href="/reading"
            icon={<div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center shadow-inner"><Layout className="w-6 h-6" /></div>}
            color="bg-white border-slate-100 hover:border-emerald-500 shadow-sm"
          />
          <PracticeCard
            title="Writing"
            description="Smart task evaluator and band estimator."
            href="/writing"
            icon={<div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center shadow-inner"><Play className="w-6 h-6 rotate-90" /></div>}
            color="bg-white border-slate-100 hover:border-amber-500 shadow-sm"
          />
          <PracticeCard
            title="Speaking"
            description="Voice recording and feedback breakdown."
            href="/speaking"
            icon={<div className="w-12 h-12 bg-fuchsia-100 text-fuchsia-600 rounded-2xl flex items-center justify-center shadow-inner"><Flame className="w-6 h-6" /></div>}
            color="bg-white border-slate-100 hover:border-fuchsia-500 shadow-sm"
          />
          <PracticeCard
            title="Full Simulation"
            description="The ultimate 2h 45m real exam environment."
            href="/full-test"
            icon={<div className="w-12 h-12 bg-slate-800 text-white rounded-2xl flex items-center justify-center shadow-2xl"><Trophy className="w-6 h-6" /></div>}
            color="bg-slate-900 text-white border-slate-800 hover:border-primary-500 md:col-span-2 lg:col-span-2"
            dark
          />
          <PracticeCard
            title="Exam Mode: On."
            description="Experience the real IELTS interface. No tabs, no notifications, just you and the clock."
            href="/download"
            icon={<div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-2xl flex items-center justify-center shadow-inner"><Monitor className="w-6 h-6" /></div>}
            color="bg-white border-primary-100 hover:border-primary-500 shadow-sm"
          />
        </div>
      </section>

      {/* Leaderboard Preview (Condensed for addictive feel) */}
      {!user && <section className="bg-slate-900 border-y border-slate-800 py-24 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_30%,rgba(79,70,229,0.05),transparent)] pointer-events-none"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 gap-20 items-center relative">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-primary-500/10 text-primary-400 text-xs font-black uppercase tracking-[0.2em] mb-8 border border-primary-500/20">
              <Trophy className="w-4 h-4" /> Global Hall of Fame
            </div>
            <h2 className="text-5xl font-black mb-8 leading-[1.1] tracking-tight text-white">Dominate the <br /> World Rankings.</h2>
            <p className="text-xl text-slate-400 mb-10 leading-relaxed font-medium">
              Join the elite circle of high scorers. Every test earns you points, and every point brings you closer to exclusive premium rewards.
            </p>
            <Link href="/leaderboard" className="group flex items-center gap-4 text-primary-400 font-black text-xl hover:text-primary-300 transition-colors">
              Enter Leaderboard <div className="w-12 h-12 rounded-full border border-primary-500/30 flex items-center justify-center group-hover:bg-primary-500/10 transition-all"><ArrowRight className="w-6 h-6" /></div>
            </Link>
          </div>
          <div className="grid gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-6 bg-slate-800/40 p-6 rounded-[2rem] border border-white/5 backdrop-blur-sm transition-all hover:translate-x-2">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black shadow-lg ${i === 1 ? 'bg-amber-500 text-slate-900' : 'bg-slate-700 text-slate-300'}`}>{i}</div>
                <div className="flex-1">
                  <p className="text-lg font-black text-white">Student_Elite_{i}</p>
                  <p className="text-sm font-bold text-slate-500 flex items-center gap-1.5"><Star className="w-3.5 h-3.5 fill-slate-500" /> Band {9 - i * 0.5}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black text-primary-400 mb-0.5">{2400 - i * 200}</p>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Points</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>}
    </div>
  );
}

function PracticeCard({ title, description, href, color, icon, dark = false }: { title: string, description: string, href: string, color: string, icon?: React.ReactNode, dark?: boolean }) {
  return (
    <Link href={href} className={`group block rounded-[2.5rem] border-2 p-10 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 relative overflow-hidden ${color}`}>
      {icon && <div className="mb-8 transform transition-transform group-hover:scale-110 group-hover:rotate-3 duration-500">{icon}</div>}
      <h3 className="text-3xl font-black mb-4 tracking-tight leading-none">{title}</h3>
      <p className={`font-medium leading-relaxed ${dark ? 'text-slate-400' : 'text-slate-500'}`}>{description}</p>

      <div className={`mt-10 flex justify-between items-center px-6 py-4 rounded-2xl transition-all duration-300 ${dark ? 'bg-slate-800 group-hover:bg-slate-700' : 'bg-slate-50 group-hover:bg-primary-600 group-hover:text-white'}`}>
        <span className="font-black text-xs uppercase tracking-widest">Practice Now</span>
        <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
      </div>
    </Link>
  );
}
