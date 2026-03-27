"use client";

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { ChevronRight, LayoutGrid, List as ListIcon, Search, ArrowRight } from 'lucide-react';

export default function ListeningListPage() {
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTests() {
      try {
        const q = query(
          collection(db, 'tests'), 
          where('type', '==', 'listening'), 
          where('status', '==', 'published')
        );
        const snap = await getDocs(q);
        const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // Simple manual sort for now if orderBy fails without index
        list.sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0));
        setTests(list);
      } catch (err) {
        console.error("Error fetching tests:", err);
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
              <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Listening Practice Tests</h1>
              <p className="text-slate-500 font-medium">Boost your score with our authentic IELTS listening modules.</p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search tests..." 
                  className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all w-64"
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
            <div className="text-center py-24 bg-white rounded-[3rem] border-2 border-dashed border-slate-100 flex flex-col items-center">
              <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center text-3xl mb-6 shadow-inner">🎧</div>
              <h3 className="text-2xl font-black text-slate-800 tracking-tight">Ready to listen?</h3>
              <p className="text-slate-500 mt-2 font-medium max-w-sm mb-8">We're preparing new official tests for you. In the meantime, maintain your streak with a quick challenge!</p>
              <Link href="/daily-challenge" className="bg-primary-600 hover:bg-primary-700 text-white font-black px-8 py-4 rounded-xl shadow-xl shadow-primary-500/20 transition-all flex items-center gap-2 group">
                Start Daily Challenge <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-10">
              {tests.map((test) => (
                <div key={test.id} className="group bg-white border border-slate-100 rounded-[28px] p-8 transition-all duration-300 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.1)] hover:-translate-y-1">
                  <div className="mb-8 flex justify-between items-start">
                    <span className="bg-slate-50 text-slate-600 text-[10px] font-bold px-3 py-1.5 rounded-lg border border-slate-100 uppercase tracking-wider">
                      Full Test
                    </span>
                  </div>
                  
                  <h3 className="text-[22px] font-bold text-slate-900 leading-[1.3] mb-10 group-hover:text-[#E31E24] transition-colors min-h-[56px] tracking-tight">
                    {test.title || "Untitled Listening Test"}
                  </h3>
                  
                  <Link 
                    href={`/listening/${test.id}`}
                    className="block w-full text-center bg-[#E31E24] hover:bg-[#c4191f] text-white font-bold py-4.5 rounded-xl shadow-lg shadow-red-500/10 transition-all active:scale-[0.98]"
                  >
                    Take Test
                  </Link>
                </div>
              ))}
            </div>
          )}

          {/* Pagination Placeholder (Mocking the UI in screenshot) */}
          {!loading && tests.length > 0 && (
            <div className="mt-16 flex items-center justify-center gap-2">
              <button className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-900 text-white font-bold shadow-lg shadow-slate-900/20">1</button>
              <button className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-[#E31E24] font-bold hover:bg-slate-50 transition-colors">2</button>
              <button className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-[#E31E24] font-bold hover:bg-slate-50 transition-colors">3</button>
              <button className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-[#E31E24] font-bold hover:bg-slate-50 transition-colors">4</button>
              <button className="px-5 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-[#E31E24] font-bold hover:bg-slate-50 transition-colors">Next »</button>
            </div>
          )}

        </main>
      </div>
    </ProtectedRoute>
  );
}
