"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db } from '@/lib/firebase/config';
import { collection, query, where, orderBy, getDocs, doc, getDoc } from 'firebase/firestore';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, BookOpen, Layers, Zap } from 'lucide-react';

export default function LearningCategoryPage() {
  const params = useParams();
  const categoryId = params.category as string;
  const router = useRouter();

  const [category, setCategory] = useState<any>(null);
  const [lessons, setLessons] = useState<{ [key: string]: any[] }>({
    beginner: [],
    intermediate: [],
    advanced: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCategoryData() {
      try {
        const catDoc = await getDoc(doc(db, 'learning_categories', categoryId));
        if (catDoc.exists()) {
          setCategory({ id: catDoc.id, ...catDoc.data() });
        } else {
          router.push('/learn');
          return;
        }

        const q = query(
          collection(db, 'learning_lessons'),
          where('category_id', '==', categoryId),
          where('is_published', '==', true)
        );
        const snap = await getDocs(q);
        const fetched = snap.docs.map(d => ({ id: d.id, ...d.data() } as { id: string, order: number, level: string, [key: string]: any }));

        // Sort manually if compound index missing, then group
        fetched.sort((a, b) => a.order - b.order);

        const grouped = {
          beginner: fetched.filter(f => f.level === 'beginner'),
          intermediate: fetched.filter(f => f.level === 'intermediate'),
          advanced: fetched.filter(f => f.level === 'advanced')
        };
        setLessons(grouped);
      } catch (err) {
        console.error("Error loading category data", err);
      } finally {
        setLoading(false);
      }
    }

    if (categoryId) loadCategoryData();
  }, [categoryId, router]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <div className="animate-spin w-12 h-12 border-4 border-slate-200 border-t-primary-600 rounded-full"></div>
        <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Curating Curriculum...</p>
      </div>
    );
  }

  const levels = [
    { key: 'beginner', title: 'Beginner', icon: BookOpen, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
    { key: 'intermediate', title: 'Intermediate', icon: Layers, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
    { key: 'advanced', title: 'Advanced', icon: Zap, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200' }
  ];

  return (
    <div className="max-w-5xl mx-auto px-6 py-16">
      <Link href="/learn" className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-800 font-bold mb-8 transition-colors group text-sm uppercase tracking-widest">
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> All Paths
      </Link>

      <div className="bg-white rounded-[3rem] p-12 border border-slate-200 shadow-sm mb-16 text-center">
        <h1 className="text-5xl font-black text-slate-900 tracking-tight leading-tight mb-4 uppercase">{category?.title}</h1>
        <p className="text-xl text-slate-500 font-medium max-w-2xl mx-auto leading-relaxed">{category?.description}</p>
      </div>

      <div className="space-y-16">
        {levels.map(level => {
          const sectionLessons = lessons[level.key];
          if (sectionLessons.length === 0) return null;

          const Icon = level.icon;

          return (
            <div key={level.key} className="space-y-8">
              <div className="flex items-center gap-4 border-b border-slate-200 pb-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${level.bg} ${level.color} ${level.border} border`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">{level.title} Phase</h2>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {sectionLessons.map(lesson => (
                  <div key={lesson.id} className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/40 hover:-translate-y-1 hover:shadow-2xl transition-all flex flex-col group">
                    <div className="flex justify-between items-start mb-4">
                      <span className={`px-3 py-1 pb-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${level.bg} ${level.color} ${level.border}`}>
                        {level.title}
                      </span>
                      <span className="text-slate-300 font-black text-2xl group-hover:text-primary-200 transition-colors">
                        #{lesson.order}
                      </span>
                    </div>

                    <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tight group-hover:text-primary-600 transition-colors">{lesson.title}</h3>
                    <p className="text-slate-500 font-medium mb-8 leading-relaxed flex-grow">{lesson.description}</p>

                    <Link 
                      href={`/learn/${categoryId}/${lesson.id}`} 
                      className="w-full flex items-center justify-center gap-2 py-4 bg-slate-900 hover:bg-black text-white font-black text-sm uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-slate-900/10 mt-auto"
                    >
                      Start Lesson <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {Object.values(lessons).every(arr => arr.length === 0) && (
          <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200 text-slate-500 font-medium">
            Lessons are currently being drafted for this category.
          </div>
        )}
      </div>
    </div>
  );
}
