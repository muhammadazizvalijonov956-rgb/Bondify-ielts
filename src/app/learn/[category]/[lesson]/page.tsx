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
  const [activeMode, setActiveMode] = useState<'explanation' | 'practice'>('explanation');
  const [userCode, setUserCode] = useState('');
  const [previewCode, setPreviewCode] = useState('');

  useEffect(() => {
    async function fetchLesson() {
      try {
        const d = await getDoc(doc(db, 'learning_lessons', lessonId));
        if (d.exists()) {
          const data = d.id ? { id: d.id, ...d.data() } : d.data();
          setLesson(data);
          setUserCode(data.starter_code || '');
          setPreviewCode(data.starter_code || '');
          if (data.lesson_mode === 'practice') {
            setActiveMode('practice');
          }
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

  const handleRunCode = () => {
    setPreviewCode(userCode);
  };

  const handleReset = () => {
    if (confirm('Reset your code to the starter template?')) {
      setUserCode(lesson.starter_code || '');
      setPreviewCode(lesson.starter_code || '');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <div className="animate-spin w-12 h-12 border-4 border-slate-200 border-t-primary-600 rounded-full"></div>
        <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Loading Knowledge Base...</p>
      </div>
    );
  }

  if (!lesson) return null;

  const showExplanation = lesson.lesson_mode === 'explanation' || lesson.lesson_mode === 'both' || !lesson.lesson_mode;
  const showPractice = lesson.lesson_mode === 'practice' || lesson.lesson_mode === 'both';

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <Link href={`/learn/${categoryId}`} className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-800 font-bold mb-8 transition-colors group text-xs uppercase tracking-widest">
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Curriculum
      </Link>

      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
           <div className="flex items-center gap-3 mb-3">
            <span className="px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest bg-slate-100 text-slate-500 border border-slate-200">
              {categoryId}
            </span>
            <span className="px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest bg-indigo-50 text-indigo-700 border border-indigo-200">
              Lesson {lesson.order}
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-tight">
            {lesson.title}
          </h1>
        </div>

        {/* Mode Switcher */}
        {showExplanation && showPractice && (
          <div className="bg-slate-100 p-1 rounded-2xl flex gap-1 border border-slate-200">
            <button 
              onClick={() => setActiveMode('explanation')}
              className={`px-6 py-2 rounded-xl text-sm font-black transition-all ${activeMode === 'explanation' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Explanation
            </button>
            <button 
              onClick={() => setActiveMode('practice')}
              className={`px-6 py-2 rounded-xl text-sm font-black transition-all ${activeMode === 'practice' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Practice
            </button>
          </div>
        )}
      </div>

      {activeMode === 'explanation' ? (
        <div className="bg-white rounded-[2.5rem] p-10 border border-slate-200 shadow-xl shadow-slate-200/40 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="prose prose-lg prose-slate max-w-none space-y-8">
            {/* Content Block */}
            {lesson.content && (
              <div className="text-xl text-slate-600 font-medium leading-relaxed bg-slate-50 p-8 rounded-[2rem] border border-slate-100 italic">
                "{lesson.content}"
              </div>
            )}

            {/* Code Example */}
            {lesson.example_code && (
              <div className="mt-12">
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-4">
                  <Terminal className="w-5 h-5 text-emerald-500" /> Code Example
                </h3>
                <div className="bg-[#0d1117] rounded-[2rem] p-8 border border-slate-800 shadow-2xl overflow-x-auto">
                  <pre className="text-emerald-400 font-mono text-base md:text-lg leading-relaxed">
                    <code>{lesson.example_code}</code>
                  </pre>
                </div>
              </div>
            )}

            {/* Explanation */}
            {lesson.example_explanation && (
              <div className="mt-8 bg-indigo-50 border border-indigo-100 p-8 rounded-[2rem] flex items-start gap-4">
                <div>
                    <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2 border-b border-indigo-200 pb-2 inline-block">Pro Insight</h4>
                    <p className="text-indigo-900 font-bold leading-relaxed mt-2 text-lg">{lesson.example_explanation}</p>
                </div>
              </div>
            )}

            {/* Task */}
            {lesson.task && (
              <div className="mt-12 bg-amber-50 border border-amber-200 p-8 rounded-[2rem] shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-200/40 rounded-full -translate-y-16 translate-x-16 blur-2xl group-hover:scale-110 transition-transform duration-700"></div>
                <h3 className="text-xl font-black text-amber-900 mb-4 flex items-center gap-2">
                  <CheckCircle2 className="w-6 h-6 text-amber-500" /> Lesson Quiz / Task
                </h3>
                <div className="text-amber-800 font-bold text-lg leading-relaxed bg-white/60 p-6 rounded-2xl border border-amber-100">
                  {lesson.task}
                </div>
              </div>
            )}
          </div>

          <div className="mt-16 pt-8 border-t border-slate-100 flex items-center justify-between">
            <p className="text-slate-400 font-medium text-sm">Review finished. Next step: Practice or Curriculum.</p>
            <div className="flex gap-4">
               {showPractice && (
                 <button 
                  onClick={() => setActiveMode('practice')}
                  className="px-8 py-4 bg-slate-900 hover:bg-black text-white font-black rounded-2xl shadow-xl transition-all"
                >
                  Start Practice
                </button>
               )}
               <button 
                onClick={() => router.push(`/learn/${categoryId}`)}
                className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-xl shadow-indigo-500/20 transition-all flex items-center gap-2"
              >
                Mark Complete <CheckCircle2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-8 h-[700px] animate-in fade-in slide-in-from-right-4 duration-500 mb-12">
          {/* Instructions Panel */}
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-lg flex flex-col overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
               <h3 className="font-black text-slate-800 flex items-center gap-2 uppercase tracking-tight text-sm">
                 <Terminal className="w-4 h-4 text-primary-600" /> {lesson.practice_title || 'Coding Challenge'}
               </h3>
               <span className="text-[10px] font-black text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">WORKSPACE</span>
            </div>
            <div className="flex-1 overflow-y-auto p-8 space-y-6">
               <div className="prose prose-slate prose-sm max-w-none">
                 <div className="text-slate-600 font-medium leading-relaxed whitespace-pre-wrap">
                   {lesson.practice_instructions || 'Follow the instructions below to complete the task.'}
                 </div>
               </div>

               {lesson.hints && (
                 <div className="bg-emerald-50 border border-emerald-100 p-5 rounded-2xl">
                    <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2">Helpful Hints</h4>
                    <ul className="space-y-1">
                      {lesson.hints.split('\n').map((h: string, i: number) => (
                        <li key={i} className="text-emerald-800 text-sm font-bold flex items-center gap-2 leading-snug">
                          <span className="w-1 h-1 bg-emerald-400 rounded-full shrink-0" /> {h}
                        </li>
                      ))}
                    </ul>
                 </div>
               )}
            </div>
            <div className="p-6 bg-slate-50 border-t border-slate-100 mt-auto">
               <button 
                onClick={() => router.push(`/learn/${categoryId}`)}
                className="w-full py-4 bg-white border-2 border-indigo-100 hover:border-indigo-400 text-indigo-600 font-black rounded-2xl transition-all shadow-sm"
              >
                Finished? Return to Curriculum
              </button>
            </div>
          </div>

          {/* Editor & Preview Panel */}
          <div className="flex flex-col gap-6">
            <div className="flex-1 bg-[#0d1117] rounded-[2rem] border border-slate-800 shadow-2xl flex flex-col overflow-hidden">
               <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  </div>
                  <div className="flex gap-3">
                    <button onClick={handleReset} className="text-[10px] font-black text-slate-500 hover:text-slate-300 transition-colors uppercase tracking-widest">Reset</button>
                    <button onClick={handleRunCode} className="text-[10px] font-black text-emerald-500 hover:text-emerald-400 transition-colors uppercase tracking-widest flex items-center gap-1">
                      Run Code <span className="text-slate-500">⌘+↵</span>
                    </button>
                  </div>
               </div>
               <textarea 
                 value={userCode}
                 onChange={e => setUserCode(e.target.value)}
                 spellCheck={false}
                 className="flex-1 w-full bg-transparent p-6 text-emerald-400 font-mono text-sm leading-relaxed resize-none focus:outline-none"
                 placeholder="Write your HTML here..."
               />
            </div>

            <div className="h-[250px] bg-white rounded-[2rem] border border-slate-200 shadow-lg flex flex-col overflow-hidden">
               <div className="px-5 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Live Output</span>
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
               </div>
               <div className="flex-1 bg-white">
                  <iframe 
                    title="preview"
                    srcDoc={previewCode}
                    className="w-full h-full border-none"
                    sandbox="allow-scripts"
                  />
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
