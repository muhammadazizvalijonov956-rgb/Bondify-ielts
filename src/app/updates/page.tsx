"use client";

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase/config';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { Sparkles, Wrench, Megaphone, PlusCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function UpdatesPage() {
  const [updates, setUpdates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUpdates() {
      try {
        const q = query(
          collection(db, 'updates'), 
          where('is_published', '==', true), 
          orderBy('created_at', 'desc')
        );
        const snap = await getDocs(q);
        const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setUpdates(list);
      } catch (err) {
        console.error("Failed to load updates", err);
        // Fallback if missing index:
        try {
          const snap = await getDocs(query(collection(db, 'updates'), where('is_published', '==', true)));
          const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a: any, b: any) => {
             const timeA = a.created_at?.toMillis() || 0;
             const timeB = b.created_at?.toMillis() || 0;
             return timeB - timeA;
          });
          setUpdates(list);
        } catch (e) {
             console.error("Critical fallback failed", e);
        }
      } finally {
        setLoading(false);
      }
    }
    fetchUpdates();
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case 'new': return <PlusCircle className="w-5 h-5 text-indigo-500" />;
      case 'improvement': return <Sparkles className="w-5 h-5 text-emerald-500" />;
      case 'fix': return <Wrench className="w-5 h-5 text-rose-500" />;
      case 'announcement': return <Megaphone className="w-5 h-5 text-amber-500" />;
      default: return null;
    }
  };

  const getBadgeStyle = (type: string) => {
    switch (type) {
      case 'new': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'improvement': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'fix': return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'announcement': return 'bg-amber-50 text-amber-700 border-amber-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-800 font-bold mb-10 transition-colors group text-sm uppercase tracking-widest">
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Home
      </Link>

      <div className="mb-16">
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-4">What's New</h1>
        <p className="text-xl text-slate-500 font-medium leading-relaxed max-w-2xl">
          We're constantly evolving Bondify to help you crush your IELTS goals faster. Here are the latest updates.
        </p>
      </div>

      <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin w-10 h-10 border-4 border-slate-200 border-t-primary-600 rounded-full mx-auto mb-4"></div>
            <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Loading Changelog...</p>
          </div>
        ) : updates.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-[3rem] border border-slate-200 shadow-sm relative z-10">
            <h3 className="text-2xl font-black text-slate-900 mb-2">You're all caught up!</h3>
            <p className="text-slate-500 font-medium">No system updates have been published yet.</p>
          </div>
        ) : (
          updates.map((update, index) => (
            <div key={update.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              {/* Timeline dot */}
              <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-slate-100 text-slate-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 transition-colors group-hover:bg-primary-50">
                {getIcon(update.type)}
              </div>
              
              {/* Card */}
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40 hover:-translate-y-1 hover:shadow-2xl transition-all">
                <div className="flex items-center gap-3 mb-4 flex-wrap">
                  <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full border ${getBadgeStyle(update.type)}`}>
                    {update.type === 'new' ? 'New Feature' : update.type === 'improvement' ? 'Improved' : update.type === 'fix' ? 'Bug Fix' : 'Announcement'}
                  </span>
                  <time className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    {update.created_at?.toDate ? new Date(update.created_at.toDate()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Just now'}
                  </time>
                </div>
                
                <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tight leading-tight">{update.title}</h3>
                <p className="text-slate-600 font-medium leading-relaxed">{update.ai_content}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
