"use client";

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { ChevronRight, LayoutGrid, List as ListIcon, Search, Mic } from 'lucide-react';

export default function SpeakingListPage() {
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTests() {
      try {
        const q = query(
          collection(db, 'tests'), 
          where('type', '==', 'speaking'), 
          where('status', '==', 'published')
        );
        const snap = await getDocs(q);
        const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // Manual sort by createdAt if it exists
        list.sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0));
        setTests(list);
      } catch (err) {
        console.error("Error fetching speaking tests:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchTests();
  }, []);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-white flex flex-col font-sans">
        <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-10">
          
          {/* Header Area */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center border border-rose-100">
                  <Mic className="w-5 h-5 text-rose-500" />
                </div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Speaking Practice Tests</h1>
              </div>
              <p className="text-slate-500 font-medium">Practice your speaking skills with authentic IELTS topics.</p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search topics..." 
                  className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 transition-all w-64"
                />
              </div>
              <div className="flex bg-slate-100 p-1 rounded-xl">
                <button className="p-1.5 bg-white shadow-sm rounded-lg pr-2 py-2"><LayoutGrid className="w-4 h-4 text-slate-800" /></button>
                <button className="p-1.5 text-slate-400"><ListIcon className="w-4 h-4" /></button>
              </div>
            </div>
          </div>

          {loading ? (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
               {[1,2,3,4,5,6].map(i => (
                 <div key={i} className="h-64 bg-slate-50 rounded-3xl animate-pulse border border-slate-100" />
               ))}
             </div>
          ) : tests.length === 0 ? (
            <div className="text-center py-24 bg-slate-50 rounded-[40px] border border-dashed border-slate-200">
              <div className="text-4xl mb-4">🎙️</div>
              <h3 className="text-xl font-bold text-slate-800">No speaking tests available yet</h3>
              <p className="text-slate-500 mt-2">Our team is uploading new practice material. Check back soon!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-10">
              {tests.map((test) => (
                <div key={test.id} className="group bg-white border border-slate-100 rounded-[28px] p-8 transition-all duration-300 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.1)] hover:-translate-y-1">
                  <div className="mb-8 flex justify-between items-start">
                    <span className="bg-rose-50 text-rose-600 text-[10px] font-bold px-3 py-1.5 rounded-lg border border-rose-100 uppercase tracking-wider">
                      Speaking Session
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1.5">
                      <ChevronRight className="w-3 h-3 text-rose-500" /> 11-14 mins
                    </span>
                  </div>
                  
                  <h3 className="text-[22px] font-bold text-slate-900 leading-[1.3] mb-10 group-hover:text-rose-600 transition-colors min-h-[56px] tracking-tight">
                    {test.title || "Untitled Speaking Test"}
                  </h3>
                  
                  <Link 
                    href={`/speaking/${test.id}`}
                    className="block w-full text-center bg-rose-600 hover:bg-rose-700 text-white font-bold py-4.5 rounded-xl shadow-lg shadow-rose-500/10 transition-all active:scale-[0.98]"
                  >
                    Start Speaking
                  </Link>
                </div>
              ))}
            </div>
          )}

          {/* Pagination Placeholder */}
          {!loading && tests.length > 0 && (
            <div className="mt-16 flex items-center justify-center gap-2">
              <button className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-900 text-white font-bold shadow-lg shadow-slate-900/20">1</button>
            </div>
          )}

        </main>
      </div>
    </ProtectedRoute>
  );
}
