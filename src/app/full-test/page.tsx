"use client";

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs } from 'firebase/firestore';
import Link from 'next/link';
import { LayoutGrid, List as ListIcon, Search, Trophy } from 'lucide-react';

export default function FullTestListPage() {
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTests() {
      try {
        const q = query(
          collection(db, 'tests'), 
          where('type', '==', 'full_length'), 
          where('status', '==', 'published')
        );
        const snap = await getDocs(q);
        const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        list.sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0));
        setTests(list);
      } catch (err) {
        console.error("Error fetching full tests:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchTests();
  }, []);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
        <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-12">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className="bg-indigo-600 text-white text-[10px] font-black px-2.5 py-1 rounded shadow-sm uppercase tracking-widest">Premium Session</span>
              </div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2 italic">Full Practice Sessions</h1>
              <p className="text-slate-500 font-medium">Complete simulated IELTS exam including all 4 sub-tests.</p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search full sessions..." 
                  className="pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all w-72 shadow-sm"
                />
              </div>
            </div>
          </div>

          {loading ? (
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
               {[1,2,3,4].map(i => (
                 <div key={i} className="h-48 bg-white rounded-[32px] animate-pulse border border-slate-100 shadow-sm" />
               ))}
             </div>
          ) : tests.length === 0 ? (
            <div className="text-center py-32 bg-white rounded-[48px] border border-dashed border-slate-200 shadow-sm">
              <div className="text-5xl mb-6">🏁</div>
              <h3 className="text-2xl font-black text-slate-800 tracking-tight">No full practice sessions ready</h3>
              <p className="text-slate-500 mt-2 font-medium">We're preparing comprehensive mock exams for you.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              {tests.map((test) => (
                <div key={test.id} className="group bg-white border border-slate-100 rounded-[40px] p-10 transition-all duration-500 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.04)] hover:shadow-[0_40px_80px_-24px_rgba(79,70,229,0.15)] hover:-translate-y-2 border-b-8 border-b-indigo-600 overflow-hidden relative">
                  
                  <div className="absolute top-0 right-0 p-8">
                     <Trophy className="w-12 h-12 text-slate-50 group-hover:text-indigo-50 transition-colors duration-500" />
                  </div>

                  <div className="flex flex-col h-full relative z-10">
                    <div className="flex items-center gap-2 mb-8">
                      <div className="flex -space-x-2">
                        {['L','R','W','S'].map(s => (
                          <div key={s} className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400">{s}</div>
                        ))}
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 italic">Complete Coverage</span>
                    </div>
                    
                    <h3 className="text-3xl font-black text-slate-900 leading-[1.15] mb-4 group-hover:text-indigo-600 transition-colors tracking-tight">
                      {test.title || "Untitled Full Session"}
                    </h3>
                    
                    <p className="text-slate-500 font-medium mb-12 line-clamp-2 text-sm leading-relaxed">
                      {test.instructions || "Start a complete 2 hours 45 minutes practice session including Listening, Reading, and Writing."}
                    </p>

                    <div className="mt-auto flex items-center justify-between gap-6">
                      <div className="flex items-center gap-6">
                         <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-1">Duration</p>
                            <p className="text-sm font-bold text-slate-800">~165 Mins</p>
                         </div>
                         <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-1">Difficulty</p>
                            <p className="text-sm font-bold text-slate-800 capitalize">{test.difficulty || 'Mixed'}</p>
                         </div>
                      </div>

                      <Link 
                        href={`/full-test/${test.id}`}
                        className="bg-slate-900 hover:bg-black text-white px-10 py-4.5 rounded-[22px] font-black text-sm shadow-xl shadow-slate-200 transition-all active:scale-[0.98] hover:px-12"
                      >
                        Launch Session
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

        </main>
      </div>
    </ProtectedRoute>
  );
}
