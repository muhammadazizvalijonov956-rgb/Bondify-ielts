"use client";

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { db } from '@/lib/firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import { useParams, useRouter } from 'next/navigation';
import { PlayCircle, Clock, CheckCircle, ArrowRight } from 'lucide-react';
import TestNavbar from '@/components/TestNavbar';

export default function FullTestSessionPage() {
  const { id } = useParams();
  const router = useRouter();
  const [test, setTest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeStep, setActiveStep] = useState(0); // 0: Intro, 1: Component List

  useEffect(() => {
    async function loadFullTest() {
      const snap = await getDoc(doc(db, 'tests', id as string));
      if (snap.exists()) {
        setTest({ id: snap.id, ...snap.data() });
      }
      setLoading(false);
    }
    loadFullTest();
  }, [id]);

  if (loading) return <ProtectedRoute><div className="min-h-screen flex items-center justify-center font-bold text-slate-500">Initializing Premium Session...</div></ProtectedRoute>;
  if (!test) return <ProtectedRoute><div className="min-h-screen flex items-center justify-center font-bold text-slate-500">Session not found.</div></ProtectedRoute>;

  const comps = test.fullTestComponents || {};
  const steps = [
    { type: 'listening', id: comps.listening, time: 30 },
    { type: 'reading', id: comps.reading, time: 60 },
    { type: 'writing', id: comps.writing, time: 60 },
    { type: 'speaking', id: comps.speaking, time: 15 }
  ].filter(s => s.id);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-900 flex flex-col font-sans text-white selection:bg-indigo-500/50">
        <TestNavbar durationMinutes={165} title={test.title || "Full Practice Session"} />
        
        <div className="flex-1 flex flex-col items-center justify-center p-6 bg-[radial-gradient(circle_at_center,rgba(79,70,229,0.1)_0%,transparent_100%)]">
          <div className="max-w-2xl w-full">
            
            <div className="text-center mb-16">
              <div className="w-20 h-20 bg-indigo-600 rounded-3xl mx-auto mb-8 flex items-center justify-center shadow-2xl shadow-indigo-600/30">
                <PlayCircle className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-4xl font-black mb-4 tracking-tight leading-tight italic">
                {test.title}
              </h1>
              <p className="text-slate-400 font-medium text-lg">
                This session consists of {steps.length} timed modules. Once started, you should aim to complete it in one sitting.
              </p>
            </div>

            <div className="space-y-4 mb-20 bg-slate-800/40 p-8 rounded-[40px] border border-white/5 backdrop-blur-xl">
               <h3 className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-6">Session Components</h3>
               {steps.map((step, idx) => (
                 <div key={idx} className="flex items-center justify-between py-5 border-b border-white/5 last:border-0 group">
                    <div className="flex items-center gap-6">
                       <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-sm font-black text-slate-500 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                          {idx + 1}
                       </div>
                       <div>
                          <p className="text-lg font-bold text-slate-100 capitalize">{step.type}</p>
                          <p className="text-xs text-slate-500 font-mono">ID: {step.id}</p>
                       </div>
                    </div>
                    <div className="flex items-center gap-4">
                       <div className="flex items-center gap-1.5 text-slate-400 font-bold text-sm bg-slate-800 px-3 py-1.5 rounded-xl border border-white/5">
                          <Clock className="w-3.5 h-3.5" />
                          {step.time}m
                       </div>
                       <button 
                        onClick={() => router.push(`/${step.type}/${step.id}?fullTestId=${id}`)}
                        className="p-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white transition-all transform hover:scale-110 active:scale-95 shadow-lg shadow-indigo-600/20"
                       >
                         <ArrowRight className="w-5 h-5" />
                       </button>
                    </div>
                 </div>
               ))}
            </div>

            <div className="flex flex-col gap-6">
               <button 
                onClick={() => router.push(`/${steps[0]?.type}/${steps[0]?.id}?fullTestId=${id}`)}
                className="w-full bg-white text-slate-900 py-6 rounded-[30px] font-black text-xl hover:bg-indigo-50 transition-all flex items-center justify-center gap-3 shadow-2xl active:scale-[0.98]"
               >
                 Begin Full Session <PlayCircle className="w-6 h-6" />
               </button>
               <button 
                onClick={() => router.push('/full-test')}
                className="text-slate-500 font-bold hover:text-white transition-colors"
               >
                 Cancel and Return
               </button>
            </div>

          </div>
        </div>

        <footer className="p-10 border-t border-white/5 text-center text-[10px] font-black tracking-widest text-slate-600 uppercase">
           Professional IELTS Simulation Framework &copy; 2026
        </footer>
      </div>
    </ProtectedRoute>
  );
}
