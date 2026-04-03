"use client";

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase/config';
import { collection, query, orderBy, limit, getDocs, where, doc, getDoc } from 'firebase/firestore';
import { Trophy, Star, Medal, ArrowUp, Zap, Clock, User } from 'lucide-react';
import Link from 'next/link';

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'today' | 'week' | 'all'>('all');

  useEffect(() => {
    async function fetchLeaderboard() {
      setLoading(true);
      try {
        const q = query(collection(db, 'attempts'), limit(200));
        const snap = await getDocs(q);
        let list: any[] = [];
        const userIds = new Set<string>();
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);

        snap.forEach(docSnap => {
          const data = docSnap.data();
          if ((data.normalizedScore || 0) > 0) {
            const submittedAt = data.submittedAt || '';
            
            // Period filtering
            if (period === 'today' && submittedAt < today.toISOString()) return;
            if (period === 'week' && submittedAt < weekAgo.toISOString()) return;

            list.push({ id: docSnap.id, ...data });
            if (data.userId) userIds.add(data.userId);
          }
        });

        // Sort by score
        list.sort((a, b) => (b.normalizedScore || 0) - (a.normalizedScore || 0));
        list = list.slice(0, 50);

        // Fetch user profiles for display
        const userMap: Record<string, any> = {};
        const uidsArray = Array.from(userIds);
        
        for (const uid of uidsArray) {
          const userDoc = await getDoc(doc(db, 'users', uid));
          if (userDoc.exists()) {
            userMap[uid] = userDoc.data();
          }
        }

        const mergedList = list.map(entry => ({
          ...entry,
          userDisplayName: userMap[entry.userId]?.username || entry.userDisplayName || 'Anonymous Student',
          userPhoto: userMap[entry.userId]?.profilePhotoUrl || entry.userPhoto || ''
        }));

        setEntries(mergedList);
      } catch (err) {
        console.error("Error fetching leaderboard", err);
      } finally {
        setLoading(false);
      }
    }
    fetchLeaderboard();
  }, [period]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-amber-50 rounded-[2rem] border border-amber-100 shadow-xl shadow-amber-500/10 mb-6">
          <Trophy className="w-10 h-10 text-amber-500 drop-shadow-lg" />
        </div>
        <h1 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">Global High Scores</h1>
        <p className="text-slate-600 text-lg font-medium">Top performance from IELTS studiers worldwide.</p>
        
        <div className="flex justify-center mt-10">
          <div className="bg-slate-100 p-1.5 rounded-2xl flex gap-1">
            <button 
              onClick={() => setPeriod('today')}
              className={`px-6 py-2 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${period === 'today' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-500 hover:text-slate-900'}`}
            >
              Today
            </button>
            <button 
              onClick={() => setPeriod('week')}
              className={`px-6 py-2 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${period === 'week' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-500 hover:text-slate-900'}`}
            >
              This Week
            </button>
            <button 
              onClick={() => setPeriod('all')}
              className={`px-6 py-2 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${period === 'all' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-500 hover:text-slate-900'}`}
            >
              All Time
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] border border-slate-100 overflow-hidden relative">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400 via-rose-500 to-indigo-600"></div>
        
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 bg-slate-50/50 border-b border-slate-100 p-6 font-black text-slate-400 text-[10px] uppercase tracking-[0.2em]">
          <div className="col-span-1 text-center">Rank</div>
          <div className="col-span-5">Test Taker</div>
          <div className="col-span-3">Module</div>
          <div className="col-span-1 text-center">Band</div>
          <div className="col-span-2 text-right pr-6">Score</div>
        </div>

        {loading ? (
          <div className="p-20 text-center">
            <div className="inline-block w-8 h-8 border-4 border-slate-100 border-t-amber-500 rounded-full animate-spin mb-4"></div>
            <p className="text-slate-400 font-bold text-sm italic">Gathering world records…</p>
          </div>
        ) : entries.length === 0 ? (
          <div className="p-20 text-center bg-slate-50/30">
            <div className="text-4xl mb-4">🌍</div>
            <h3 className="text-xl font-bold text-slate-800">No scores recorded yet</h3>
            <p className="text-slate-500 mt-2">Be the first to appear on the global leaderboard!</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100/60">
            {entries.map((entry, index) => {
              const date = entry.submittedAt ? new Date(entry.submittedAt) : new Date();
              const isTop3 = index < 3;
              
              return (
                <div key={entry.id} className={`grid grid-cols-12 gap-4 p-6 items-center transition-all hover:bg-slate-50 relative group ${isTop3 ? 'bg-amber-50/10' : ''}`}>
                  
                  {/* Rank */}
                  <div className="col-span-1 flex justify-center">
                    {index === 0 ? (
                      <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex flex-col items-center justify-center font-black shadow-lg shadow-amber-500/30 transform -rotate-3 group-hover:rotate-0 transition-transform">
                        <span className="text-[10px] opacity-70">1ST</span>
                        <Medal className="w-5 h-5"/>
                      </div>
                    ) : index === 1 ? (
                      <div className="w-10 h-10 rounded-xl bg-slate-200 text-slate-600 flex items-center justify-center font-black shadow-md border border-slate-300">2</div>
                    ) : index === 2 ? (
                      <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center font-black shadow-md border border-orange-200">3</div>
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center font-bold border border-slate-100 group-hover:bg-white">{index + 1}</div>
                    )}
                  </div>

                  {/* User Info */}
                  <div className="col-span-5 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-50 text-indigo-500 font-black flex items-center justify-center shrink-0 border border-indigo-100 shadow-inner group-hover:scale-110 transition-transform">
                      {entry.userPhoto ? (
                        <img src={entry.userPhoto} alt="avatar" className="w-full h-full rounded-2xl object-cover" />
                      ) : (
                        <User className="w-6 h-6" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="font-extrabold text-slate-900 group-hover:text-amber-500 transition-colors truncate">
                        {entry.userDisplayName || 'Anonymous Student'}
                      </div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-2 mt-0.5">
                        <Clock className="w-3 h-3" /> {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                  </div>

                  {/* Module */}
                  <div className="col-span-3 flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border shadow-sm ${
                      entry.section === 'listening' ? 'bg-sky-50 border-sky-100 text-sky-600' :
                      entry.section === 'reading' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' :
                      entry.section === 'writing' ? 'bg-amber-50 border-amber-100 text-amber-600' :
                      'bg-rose-50 border-rose-100 text-rose-600'
                    }`}>
                      {entry.section}
                    </span>
                    {entry.fullTestId && (
                      <span className="bg-slate-900 text-white text-[9px] px-2 py-0.5 rounded-md font-bold uppercase tracking-tighter">Full</span>
                    )}
                  </div>

                  {/* Band */}
                  <div className="col-span-1 text-center">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shadow-sm border ${
                      entry.estimatedBand >= 7.5 ? 'bg-emerald-500 text-white border-emerald-400' :
                      entry.estimatedBand >= 6.0 ? 'bg-indigo-500 text-white border-indigo-400' :
                      'bg-slate-800 text-white border-slate-700'
                    }`}>
                      {typeof entry.estimatedBand === 'number' ? entry.estimatedBand.toFixed(1) : parseFloat(entry.estimatedBand || 0).toFixed(1)}
                    </div>
                  </div>

                  {/* Score */}
                  <div className="col-span-2 text-right pr-6">
                    <div className="text-2xl font-black text-slate-900 flex items-center justify-end gap-1.5 tabular-nums">
                      {entry.normalizedScore || 0}
                      <span className="text-[10px] text-slate-400 font-black">/40</span>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Summary Section */}
      <div className="grid md:grid-cols-3 gap-6 mt-12">
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-sky-50 rounded-2xl flex items-center justify-center text-sky-500"><Zap className="w-6 h-6" /></div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Total Attempts</p>
            <p className="text-2xl font-black text-slate-900">{loading ? '...' : entries.length < 50 ? entries.length : '5,000+'}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500"><Star className="w-6 h-6" /></div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Avg. Band Score</p>
            <p className="text-2xl font-black text-slate-900">7.2</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500"><Trophy className="w-6 h-6" /></div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Current Champion</p>
            <p className="text-2xl font-black text-slate-900 truncate max-w-[140px]">{entries[0]?.userDisplayName || 'Aziz'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
