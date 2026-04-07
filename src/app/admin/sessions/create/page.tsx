"use client";

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, addDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { Loader2, Plus, ArrowLeft, Send, CheckCircle, Copy, Hash } from 'lucide-react';
import Link from 'next/link';

export default function CreateSessionPage() {
  const [studentName, setStudentName] = useState('');
  const [studentEmail, setStudentEmail] = useState(''); // Optional for staff
  const [testId, setTestId] = useState('');
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingTests, setFetchingTests] = useState(true);
  const [createdSession, setCreatedSession] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchTests() {
      try {
        const q = query(collection(db, 'tests'));
        const snap = await getDocs(q);
        const allTests = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));

        // Filter and sort
        const published = allTests.filter(t => t.status === 'published');
        published.sort((a, b) => (a.title || '').localeCompare(b.title || ''));

        setTests(published);
      } catch (err) {
        console.error("Failed to fetch tests", err);
      } finally {
        setFetchingTests(false);
      }
    }
    fetchTests();
  }, []);

  const generateCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoid ambiguous chars
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName || !testId) return;

    setLoading(true);
    const sessionCode = generateCode();

    try {
      const docRef = await addDoc(collection(db, 'test_sessions'), {
        session_code: sessionCode,
        student_name: studentName,
        student_email: studentEmail || null,
        test_id: testId,
        created_by_staff: true,
        organization: "ADC",
        status: "in_progress",
        completed: false,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      });

      setCreatedSession({ id: docRef.id, session_code: sessionCode });
    } catch (err) {
      console.error("Failed to create session", err);
      alert("Error creating session. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const copyLink = () => {
    const link = `${window.location.origin}/join?code=${createdSession.session_code}`;
    navigator.clipboard.writeText(link);
    alert('Link copied to clipboard!');
  };

  if (createdSession) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-slate-100 max-w-md w-full text-center space-y-8 animate-in zoom-in-95 duration-300">
          <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-[2rem] flex items-center justify-center mx-auto shadow-inner ring-4 ring-white">
            <CheckCircle className="w-12 h-12" />
          </div>

          <div>
            <h2 className="text-3xl font-black text-slate-800 tracking-tight">Session Created!</h2>
            <p className="text-slate-500 font-medium mt-2">The test is ready for {studentName}.</p>
          </div>

          <div className="bg-slate-50 p-6 rounded-3xl border border-dashed border-slate-200">
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3">Entrance Code</p>
            <div className="text-4xl font-black text-primary-600 tracking-[0.2em] mb-4">
              {createdSession.session_code}
            </div>
            <button
              onClick={() => navigator.clipboard.writeText(createdSession.session_code)}
              className="text-xs font-bold text-slate-400 hover:text-primary-600 transition-colors uppercase tracking-widest flex items-center justify-center gap-1.5 mx-auto"
            >
              <Hash className="w-3.5 h-3.5" /> Copy Code
            </button>
          </div>

          <div className="space-y-3">
            <button
              onClick={copyLink}
              className="w-full bg-slate-900 border-2 border-slate-900 text-white font-bold py-4 rounded-2xl hover:bg-black transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-900/10 active:scale-95"
            >
              <Copy className="w-4 h-4" /> Copy Direct Link
            </button>
            <button
              onClick={() => { setCreatedSession(null); setStudentName(''); setStudentEmail(''); }}
              className="w-full bg-white border-2 border-slate-100 text-slate-600 font-bold py-4 rounded-2xl hover:bg-slate-50 transition-all active:scale-95"
            >
              Create Another
            </button>
          </div>

          <Link href="/admin/test-monitor" className="block text-sm font-bold text-primary-600 hover:underline">
            View Live Test Monitor
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8 pb-32">
      <Link href="/admin/test-monitor" className="inline-flex items-center gap-2 text-slate-400 font-bold text-sm hover:text-slate-600 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Monitor
      </Link>

      <div>
        <h1 className="text-4xl font-black text-slate-800 tracking-tight leading-tight">Create ADC Session</h1>
        <p className="text-slate-500 font-medium mt-2">Initialize a controlled test session for an ADC student.</p>
      </div>

      <form onSubmit={handleCreate} className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 space-y-8">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-2">
            <label className="block text-xs font-black uppercase text-slate-400 tracking-widest ml-1">Student Full Name</label>
            <input
              required
              type="text"
              placeholder="e.g. John Doe"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary-500/10 transition-all font-bold placeholder:text-slate-300"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-black uppercase text-slate-400 tracking-widest ml-1">Student Email (Optional)</label>
            <input
              type="email"
              placeholder="john@example.com"
              value={studentEmail}
              onChange={(e) => setStudentEmail(e.target.value)}
              className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary-500/10 transition-all font-bold placeholder:text-slate-300"
            />
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest ml-1">If provided, results will be sent here.</p>
          </div>
        </div>

        <div className="space-y-3">
          <label className="block text-xs font-black uppercase text-slate-400 tracking-widest ml-1">Select Practice Module</label>
          {fetchingTests ? (
            <div className="h-14 bg-slate-50 rounded-2xl animate-pulse" />
          ) : (
            <div className="space-y-4">
              <select
                required
                value={testId}
                onChange={(e) => setTestId(e.target.value)}
                className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary-500/10 transition-all font-bold appearance-none cursor-pointer"
              >
                <option value="">— Choose a Test —</option>
                {tests.map(t => (
                  <option key={t.id} value={t.id}>[{t.type?.toUpperCase()}] {t.title}</option>
                ))}
              </select>
              {tests.length === 0 && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl">
                  <p className="text-xs font-bold text-amber-700">No published tests found.</p>
                  <p className="text-[10px] text-amber-600 mt-0.5">Please ensure you have created tests and set their status to <span className="font-black">"Published"</span> in the Test Management panel.</p>
                  <Link href="/admin/tests" className="text-[10px] font-black text-amber-700 underline mt-2 block uppercase tracking-widest">Go to Test Management &rarr;</Link>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="pt-4">
          <button
            disabled={loading || fetchingTests}
            type="submit"
            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-black py-5 rounded-[2rem] shadow-2xl shadow-primary-500/20 transition-all flex items-center justify-center gap-3 disabled:opacity-50 active:scale-[0.98]"
          >
            {loading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <><Plus className="w-6 h-6" /> Initialize Session</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
