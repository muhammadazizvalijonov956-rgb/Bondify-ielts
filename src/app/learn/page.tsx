"use client";

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase/config';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import Link from 'next/link';
import { Code2, ArrowRight } from 'lucide-react';

export default function LearnPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const q = query(collection(db, 'learning_categories'), orderBy('created_at', 'asc'));
        const snap = await getDocs(q);
        const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setCategories(list);
      } catch (err) {
        console.error("Failed to fetch learn categories", err);
      } finally {
        setLoading(false);
      }
    }
    fetchCategories();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-6 py-20 min-h-screen">
      <div className="text-center mb-16 space-y-4">
        <div className="w-16 h-16 bg-primary-100 text-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-6 transform -rotate-6 shadow-sm ring-4 ring-primary-50">
          <Code2 className="w-8 h-8" />
        </div>
        <h1 className="text-5xl font-black text-slate-900 tracking-tight leading-tight">Learn coding step by step</h1>
        <p className="text-slate-500 text-xl max-w-2xl mx-auto font-medium leading-relaxed">
          Start from zero and build real skills with our highly structured, distraction-free learning paths.
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-4">
          <div className="animate-spin w-12 h-12 border-4 border-slate-200 border-t-primary-600 rounded-full"></div>
          <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Loading Paths...</p>
        </div>
      ) : categories.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-[3rem] p-24 text-center">
          <h3 className="text-2xl font-black text-slate-900 mb-2">No learning paths available yet.</h3>
          <p className="text-slate-500 font-medium max-w-sm mx-auto">Our instructors are busy building the curriculum. Check back soon!</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 max-w-6xl mx-auto">
          {categories.map((cat, idx) => {
            const colors = [
              'text-orange-600 bg-orange-50 border-orange-200 hover:shadow-orange-200/50',
              'text-blue-600 bg-blue-50 border-blue-200 hover:shadow-blue-200/50',
              'text-amber-600 bg-amber-50 border-amber-200 hover:shadow-amber-200/50',
              'text-indigo-600 bg-indigo-50 border-indigo-200 hover:shadow-indigo-200/50',
            ];
            const colorClass = colors[idx % colors.length];

            return (
              <div key={cat.id} className="bg-white rounded-[2rem] p-8 border border-slate-200 flex flex-col transition-all hover:-translate-y-2 hover:shadow-2xl hover:border-transparent group h-full">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 border font-black text-2xl uppercase tracking-widest shadow-sm ${colorClass}`}>
                  {cat.title.substring(0,2)}
                </div>
                
                <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tight group-hover:text-primary-600 transition-colors">{cat.title}</h3>
                <p className="text-slate-500 font-medium mb-8 leading-relaxed flex-grow">{cat.description || `Master the principles of ${cat.title}.`}</p>
                
                <Link 
                  href={`/learn/${cat.id}`} 
                  className="w-full flex items-center justify-center gap-2 py-4 bg-slate-100 hover:bg-slate-900 hover:text-white text-slate-700 font-black text-sm uppercase tracking-widest rounded-xl transition-all font-display mt-auto"
                >
                  Start <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
