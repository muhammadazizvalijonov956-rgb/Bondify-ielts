"use client";

import { useState, useEffect, Suspense } from 'react';
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, Zap, ArrowRight, XCircle } from 'lucide-react';
import Link from 'next/link';

function JoinForm() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const urlCode = searchParams.get('code');
    if (urlCode && !loading) {
      handleJoin(urlCode);
    }
  }, [searchParams]);

  const handleJoin = async (targetCode: string) => {
    const cleanCode = targetCode.trim().toUpperCase();
    if (!cleanCode) return;
    
    setLoading(true);
    setError('');
    
    try {
      const q = query(collection(db, 'test_sessions'), where('session_code', '==', cleanCode), limit(1));
      const snap = await getDocs(q);
      
      if (snap.empty) {
        setError('Invalid session code. Please check with your supervisor.');
        setLoading(false);
        return;
      }

      const session = snap.docs[0].data();
      const sessionId = snap.docs[0].id;

      if (session.completed) {
        setError('This session has already been completed.');
        setLoading(false);
        return;
      }

      // Store in session storage for the test page to pick up
      sessionStorage.setItem('current_session_id', sessionId);
      sessionStorage.setItem('session_student_name', session.student_name);
      
      // Redirect to the test
      const testRef = await getDocs(query(collection(db, 'tests'), where('id', '==', session.test_id), limit(1)));
      // If we don't have the explicit test type in session, we might need a fallback or fetch test first.
      // Assuming test_id is enough if we have a generic /test/[id] or similar.
      // But looking at the app, it's /[type]/[id].
      
      const testSnap = await getDocs(collection(db, 'tests'));
      const testDoc = testSnap.docs.find(d => d.id === session.test_id);
      
      if (!testDoc) {
          setError('Test configuration not found.');
          setLoading(false);
          return;
      }
      
      const testData = testDoc.data();
      router.push(`/${testData.type}/${testDoc.id}?session=${sessionId}`);

    } catch (err) {
      console.error("Join error", err);
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-slate-100 max-w-md w-full">
        <div className="flex justify-center mb-8">
            <Link href="/" className="bg-slate-900 text-white p-4 rounded-2xl flex items-center justify-center shadow-lg hover:scale-105 transition-transform active:scale-95">
                <Zap className="w-8 h-8 fill-primary-500 text-primary-500" />
            </Link>
        </div>

        <div className="text-center mb-10">
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Join Test Session</h1>
          <p className="text-slate-500 font-medium mt-2 leading-relaxed">Enter your 6-digit code to begin your official ADC practice test.</p>
        </div>

        {error && (
            <div className="bg-rose-50 text-rose-600 p-4 rounded-2xl mb-8 flex items-center gap-3 border border-rose-100 text-sm font-bold animate-in fade-in slide-in-from-top-2 duration-300">
                <XCircle className="w-5 h-5 shrink-0" />
                {error}
            </div>
        )}

        <form onSubmit={(e) => { e.preventDefault(); handleJoin(code); }} className="space-y-6">
          <div className="relative">
            <input 
              type="text" 
              maxLength={6}
              placeholder="e.g. ABC123"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="w-full text-center text-3xl font-black tracking-[0.2em] py-6 rounded-[2rem] border-2 border-slate-100 bg-slate-50 focus:bg-white focus:border-primary-500 focus:outline-none transition-all placeholder:text-slate-200 uppercase"
              required
              autoFocus
            />
          </div>

          <button 
            type="submit"
            disabled={loading || code.length < 4}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-black py-5 rounded-[2rem] shadow-xl shadow-primary-500/20 transition-all flex items-center justify-center gap-3 disabled:opacity-50 active:scale-[0.98]"
          >
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <><ArrowRight className="w-6 h-6" /> Start Exam</>}
          </button>
        </form>

        <p className="mt-10 text-center text-slate-400 text-xs font-bold uppercase tracking-widest leading-loose">
          Not part of an organization?<br />
          <Link href="/register" className="text-primary-600 hover:underline">Create a free account instead</Link>
        </p>
      </div>
    </div>
  );
}

export default function JoinPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-primary-500" /></div>}>
      <JoinForm />
    </Suspense>
  );
}
