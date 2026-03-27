"use client";

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs } from 'firebase/firestore';
import Link from 'next/link';
import { LayoutGrid, List as ListIcon, Search, PenTool } from 'lucide-react';

export default function WritingListPage() {
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTests() {
      try {
        const q = query(
          collection(db, 'tests'), 
          where('type', '==', 'writing'), 
          where('status', '==', 'published')
        );
        const snap = await getDocs(q);
        const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        list.sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0));
        setTests(list);
      } catch (err) {
        console.error("Error fetching writing tests:", err);
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
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Writing Practice Tests</h1>
              <p className="text-slate-500 font-medium">Practice Academic and General Training Writing tasks.</p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search tests..." 
                  className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-500/20 transition-all w-64"
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
              <div className="text-4xl mb-4"><PenTool className="w-12 h-12 text-slate-300 mx-auto" /></div>
              <h3 className="text-xl font-bold text-slate-800">No writing tests available yet</h3>
              <p className="text-slate-500 mt-2">Admins are working on adding more tasks.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-10">
              {tests.map((test) => (
                <div key={test.id} className="group bg-white border border-slate-100 rounded-[28px] p-8 transition-all duration-300 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.1)] hover:-translate-y-1">
                  <div className="mb-8 flex justify-between items-start">
                    <span className="bg-fuchsia-100 text-fuchsia-600 text-[10px] font-bold px-3 py-1.5 rounded-lg border border-fuchsia-200 uppercase tracking-wider">
                      Writing
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded">
                      {test.difficulty || 'Medium'}
                    </span>
                  </div>
                  
                  <h3 className="text-[22px] font-bold text-slate-900 leading-[1.3] mb-10 group-hover:text-fuchsia-600 transition-colors min-h-[56px] tracking-tight">
                    {test.title || "Untitled Writing Test"}
                  </h3>
                  
                  <Link 
                    href={`/writing/${test.id}`}
                    className="block w-full text-center bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-bold py-4.5 rounded-xl shadow-lg shadow-fuchsia-500/10 transition-all active:scale-[0.98]"
                  >
                    Take Test
                  </Link>
                </div>
              ))}
            </div>
          )}

        </main>
      </div>
    </ProtectedRoute>
  );
}
