"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db } from '@/lib/firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, Terminal } from 'lucide-react';

export default function LessonPage() {
  const params = useParams();
  const categoryId = params.category as string;
  const lessonId = params.lesson as string;
  const router = useRouter();

  const [lesson, setLesson] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLesson() {
      try {
        const d = await getDoc(doc(db, 'learning_lessons', lessonId));
        if (d.exists()) {
          setLesson({ id: d.id, ...d.data() });
        } else {
          router.push(`/learn/${categoryId}`);
        }
      } catch (err) {
        console.error("Failed to load lesson", err);
      } finally {
        setLoading(false);
      }
    }
    fetchLesson();
  }, [lessonId, categoryId, router]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <div className="animate-spin w-12 h-12 border-4 border-slate-200 border-t-primary-600 rounded-full"></div>
        <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Loading Knowledge Base...</p>
      </div>
    );
  }

  if (!lesson) return null;

  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      <Link href={`/learn/${categoryId}`} className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-800 font-bold mb-10 transition-colors group text-sm uppercase tracking-widest">
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Curriculum
      </Link>

      <div className="bg-white rounded-[3rem] p-12 border border-slate-200 shadow-xl shadow-slate-200/50 mb-12">
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <span className="px-3 py-1 pb-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-slate-100 text-slate-500 border border-slate-200">
            {categoryId}
          </span>
          <span className="px-3 py-1 pb-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-indigo-50 text-indigo-700 border border-indigo-200">
            Lesson {lesson.order}
          </span>
        </div>

        <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight mb-8">
          {lesson.title}
        </h1>

        <div className="prose prose-lg prose-slate max-w-none space-y-8">
          {/* Content Block */}
          {lesson.content && (
             <div className="text-xl text-slate-600 font-medium leading-relaxed bg-slate-50 p-8 rounded-3xl border border-slate-100">
               {lesson.content}
             </div>
          )}

          {/* Code Example */}
          {lesson.example_code && (
            <div className="mt-12">
              <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-4">
                <Terminal className="w-5 h-5 text-emerald-500" /> Code Example
              </h3>
              <div className="bg-[#0d1117] rounded-3xl p-6 border border-slate-800 shadow-xl overflow-x-auto">
                <pre className="text-emerald-400 font-mono text-sm sm:text-base leading-relaxed">
                  <code>{lesson.example_code}</code>
                </pre>
              </div>
            </div>
          )}

          {/* Explanation */}
          {lesson.example_explanation && (
            <div className="mt-8 bg-blue-50 border border-blue-100 p-8 rounded-3xl flex items-start gap-4">
               <div>
                  <h4 className="text-xs font-black text-blue-400 uppercase tracking-widest mb-2 border-b border-blue-200 pb-2 inline-block">How it works</h4>
                  <p className="text-blue-900 font-medium leading-relaxed mt-2">{lesson.example_explanation}</p>
               </div>
            </div>
          )}

          {/* Task */}
          {lesson.task && (
             <div className="mt-12 bg-amber-50 border border-amber-200 p-8 rounded-3xl shadow-sm relative overflow-hidden">
               <div className="absolute top-0 right-0 w-24 h-24 bg-amber-200/30 rounded-full -translate-y-12 translate-x-12 blur-xl"></div>
               <h3 className="text-xl font-black text-amber-900 mb-4 flex items-center gap-2">
                 <CheckCircle2 className="w-6 h-6 text-amber-500" /> Your Task
               </h3>
               <div className="text-amber-800 font-bold text-lg leading-relaxed bg-white/60 p-6 rounded-2xl border border-amber-100">
                 {lesson.task}
               </div>
             </div>
          )}
        </div>

        <div className="mt-16 pt-8 border-t border-slate-100 flex items-center justify-between">
          <p className="text-slate-400 font-medium text-sm">You reached the end of this lesson.</p>
          <button 
            onClick={() => router.push(`/learn/${categoryId}`)}
            className="px-8 py-4 bg-primary-600 hover:bg-primary-700 text-white font-black rounded-xl shadow-xl shadow-primary-500/20 transition-all flex items-center gap-2"
          >
            Mark Complete <CheckCircle2 className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
