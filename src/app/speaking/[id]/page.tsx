"use client";

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { db } from '@/lib/firebase/config';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import { Mic, ArrowRight, Video, ChevronLeft, ChevronRight, Send, Upload, Clock } from 'lucide-react';
import TestNavbar from '@/components/TestNavbar';

export default function TakingSpeakingTest() {
  const [test, setTest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Navigation State
  const [activePartIdx, setActivePartIdx] = useState(0);
  const [activeQuestionIdx, setActiveQuestionIdx] = useState(0);
  const [timer, setTimer] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [totalSpeakingTime, setTotalSpeakingTime] = useState(0);

  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const fullTestId = searchParams.get('fullTestId');
  const { user, profile } = useAuth();

  useEffect(() => {
    async function fetchTest() {
      const id = params.id as string;
      if (!id) return;
      try {
        const snap = await getDoc(doc(db, 'tests', id));
        if (snap.exists()) setTest({ id: snap.id, ...snap.data() });
      } catch (err) {
        console.error("Error fetching speaking test:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchTest();
  }, [params.id]);

  useEffect(() => {
    let interval: any;
    if (isRecording) {
      interval = setInterval(() => {
        setTimer(t => t + 1);
        setTotalSpeakingTime(t => t + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  // Reset timer on question change
  useEffect(() => {
    setTimer(0);
    setIsRecording(false);
  }, [activePartIdx, activeQuestionIdx]);

  const handleSubmit = async () => {
    if (!user || !test) return;
    if (!confirm("Are you sure you want to finish the entire Speaking test?")) return;
    setSubmitting(true);

    const isSkipped = totalSpeakingTime < 10;
    const estimatedBand = isSkipped ? 0.0 : 6.5;

    const attemptId = `att_speak_${Date.now()}`;
    const attempt = {
      id: attemptId,
      userId: user.uid,
      testId: test.id,
      testTitle: test.title || '',
      section: 'speaking',
      startedAt: new Date().toISOString(),
      submittedAt: new Date().toISOString(),
      status: 'pending_evaluation',
      userDisplayName: profile?.username || user.displayName || 'Anonymous Student',
      userPhoto: profile?.profilePhotoUrl || user.photoURL || '',
      estimatedBand,
      normalizedScore: isSkipped ? 0 : 30
    };

    try {
      await setDoc(doc(db, 'attempts', attemptId), attempt);
      
      if (fullTestId) {
        const searchL = searchParams.get('l');
        const searchR = searchParams.get('r');
        const searchW = searchParams.get('w');
        
        let lBand = 0, rBand = 0, wBand = 0;
        
        if (searchL) {
          const lSnap = await getDoc(doc(db, 'attempts', searchL));
          if (lSnap.exists()) lBand = parseFloat(lSnap.data().estimatedBand) || 0;
        }
        if (searchR) {
          const rSnap = await getDoc(doc(db, 'attempts', searchR));
          if (rSnap.exists()) rBand = parseFloat(rSnap.data().estimatedBand) || 0;
        }
        if (searchW) {
          const wSnap = await getDoc(doc(db, 'attempts', searchW));
          if (wSnap.exists()) wBand = parseFloat(wSnap.data().estimatedBand) || 0;
        }
        
        const sum = lBand + rBand + wBand + estimatedBand;
        let overall = sum / 4;
        
        // IELTS rounding: halves
        const fractionalPart = overall - Math.floor(overall);
        if (fractionalPart < 0.25) {
          overall = Math.floor(overall);
        } else if (fractionalPart < 0.75) {
          overall = Math.floor(overall) + 0.5;
        } else {
          overall = Math.ceil(overall);
        }

        const fullAttemptId = `att_full_${Date.now()}`;
        const fullAttempt = {
          id: fullAttemptId,
          userId: user.uid,
          testId: fullTestId,
          testTitle: test.title || 'Full IELTS Practice Test',
          section: 'full-test',
          startedAt: new Date().toISOString(),
          submittedAt: new Date().toISOString(),
          status: 'pending_evaluation',
          userDisplayName: profile?.username || user.displayName || 'Anonymous Student',
          userPhoto: profile?.profilePhotoUrl || user.photoURL || '',
          estimatedBand: overall,
          listeningBand: lBand,
          readingBand: rBand,
          writingBand: wBand,
          speakingBand: estimatedBand,
          listeningAttemptId: searchL || null,
          readingAttemptId: searchR || null,
          writingAttemptId: searchW || null,
          speakingAttemptId: attemptId,
          fullTestId: fullTestId
        };
        await setDoc(doc(db, 'attempts', fullAttemptId), fullAttempt);
        router.push(`/results/${fullAttemptId}`);
      } else {
        router.push(`/results/${attemptId}`);
      }
    } catch (err) {
      console.error("Failed to save attempt", err);
      alert("Failed to submit test. Please try again.");
      setSubmitting(false);
    }
  };

  if (loading) return <ProtectedRoute><div className="min-h-screen flex items-center justify-center font-bold text-slate-500 italic">Initializing Speaking Module...</div></ProtectedRoute>;
  if (!test) return <ProtectedRoute><div className="min-h-screen flex items-center justify-center font-bold text-slate-500">Speaking test not found.</div></ProtectedRoute>;

  const parts = Array.isArray(test.parts) ? test.parts : [];
  const activePart = parts[activePartIdx] || { questions: [] };

  // Normalize questions from different potential schema versions
  const getQuestions = (part: any) => {
    if (Array.isArray(part.items)) {
      return part.items.filter((i: any) => i.type === 'question' || i.type === 'text');
    }
    if (Array.isArray(part.questions)) return part.questions;
    return [];
  };

  const questions = getQuestions(activePart);
  const currentQuestion = questions[activeQuestionIdx] || { text: 'No question text provided' };

  const goToNext = () => {
    if (activeQuestionIdx < questions.length - 1) {
      setActiveQuestionIdx(activeQuestionIdx + 1);
    } else if (activePartIdx < parts.length - 1) {
      setActivePartIdx(activePartIdx + 1);
      setActiveQuestionIdx(0);
    }
  };

  const goToPrev = () => {
    if (activeQuestionIdx > 0) {
      setActiveQuestionIdx(activeQuestionIdx - 1);
    } else if (activePartIdx > 0) {
      const prevPart = parts[activePartIdx - 1];
      const prevQuestions = getQuestions(prevPart);
      setActivePartIdx(activePartIdx - 1);
      setActiveQuestionIdx(prevQuestions.length > 0 ? prevQuestions.length - 1 : 0);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-white flex flex-col font-sans text-slate-900 border-t-8 border-rose-500">
        <TestNavbar durationMinutes={15} title="Speaking Practice" />

        {/* Top Header Section */}
        <div className="text-center py-4 border-b border-slate-100 shadow-sm sticky top-[60px] bg-white z-10">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Part {activePartIdx + 1}</p>
          <p className="text-sm font-bold text-slate-800 italic">Answer {activePartIdx === 1 ? 'the cue card topic' : `questions 1-${questions.length}`}</p>
        </div>

        <main className="flex-1 flex flex-col pt-12 px-6">
          <div className="max-w-5xl mx-auto w-full flex flex-col h-full">

            {/* Navigation Buttons Row */}
            <div className="flex items-center justify-between mb-12">
              <button
                onClick={goToPrev}
                disabled={activePartIdx === 0 && activeQuestionIdx === 0}
                className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-black uppercase transition-all disabled:opacity-30 border border-slate-200 shadow-sm active:scale-95"
              >
                <ChevronLeft className="w-4 h-4" /> Previous Question
              </button>
              <button
                onClick={goToNext}
                disabled={activePartIdx === parts.length - 1 && activeQuestionIdx === questions.length - 1}
                className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 hover:bg-black text-white rounded-lg text-xs font-black uppercase transition-all disabled:opacity-30 shadow-xl active:scale-95"
              >
                Next Question <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Main Question Display */}
            <div className="text-center space-y-4 mb-16">
              <h3 className="text-sm font-bold text-slate-400">Question {activeQuestionIdx + 1}:</h3>
              <h2 className="text-3xl font-black text-slate-900 leading-tight italic max-w-3xl mx-auto">
                {currentQuestion.label || currentQuestion.text || currentQuestion.content}
              </h2>
            </div>

            {/* Recording Interface */}
            <div className="flex-1 flex flex-col items-center">
              <div className="w-full max-w-3xl aspect-[3/1] bg-slate-50 rounded-[32px] border border-slate-200 shadow-inner flex flex-col items-center justify-center p-8 relative overflow-hidden group">
                <div className="absolute top-4 left-6 py-1 px-3 bg-white/50 rounded-full border border-slate-200">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Question {activeQuestionIdx + 1} Answer</p>
                </div>

                {!isRecording ? (
                  <div className="flex flex-col items-center gap-6">
                    <p className="text-slate-400 font-medium italic">Click the mic icon to start recording...</p>
                    <button
                      onClick={() => setIsRecording(true)}
                      className="w-20 h-20 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full flex items-center justify-center shadow-2xl shadow-emerald-500/30 transition-all hover:scale-110 active:scale-90"
                    >
                      <Mic className="w-8 h-8" />
                    </button>
                    <button className="flex items-center gap-2 px-6 py-2.5 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-900 transition-all shadow-lg active:scale-95">
                      Or upload an audio file <Upload className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-6">
                    <div className="flex items-center gap-1.5">
                      {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="w-1 bg-emerald-500 rounded-full animate-[pulse_1s_infinite]" style={{ height: `${Math.random() * 30 + 10}px`, animationDelay: `${i * 0.1}s` }} />
                      ))}
                    </div>
                    <p className="text-emerald-600 font-black uppercase tracking-[0.3em] text-[10px]">Recording Live...</p>
                    <button
                      onClick={() => setIsRecording(false)}
                      className="w-20 h-20 bg-rose-500 hover:bg-rose-600 text-white rounded-full flex items-center justify-center shadow-2xl shadow-rose-500/30 transition-all animate-pulse"
                    >
                      <div className="w-6 h-6 bg-white rounded-sm" />
                    </button>
                  </div>
                )}
              </div>

              <div className="w-full max-w-3xl mt-4 flex items-center justify-between px-2">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Speaking Time: {timer}s</p>
                <button
                  onClick={() => {
                    setIsRecording(false);
                    if (activeQuestionIdx < questions.length - 1 || activePartIdx < parts.length - 1) {
                      goToNext();
                    } else {
                      handleSubmit();
                    }
                  }}
                  className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-lg text-xs font-black uppercase hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 active:scale-95"
                >
                  Submit Answer <Send className="w-4 h-4" />
                </button>
              </div>
            </div>

          </div>
        </main>

        {/* Bottom Tab Navigation */}
        <div className="bg-slate-50 border-t border-slate-200 mt-auto p-4 flex items-center justify-center gap-4 fixed bottom-0 left-0 right-0 z-10 backdrop-blur-xl bg-white/80">
          <div className="flex gap-2 mr-6 border-r border-slate-200 pr-6">
            <button onClick={goToPrev} className="p-3 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-500 transition-all active:scale-90 border border-slate-200 shadow-sm"><ChevronLeft className="w-4 h-4" /></button>
            <button onClick={goToNext} className="p-3 bg-slate-900 hover:bg-black rounded-lg text-white transition-all active:scale-90 shadow-xl"><ChevronRight className="w-4 h-4" /></button>
          </div>

          <div className="flex items-center gap-8 overflow-x-auto no-scrollbar max-w-full">
            {/* Dynamic Parts */}
            {parts.map((p: any, pIdx: number) => {
              const qs = getQuestions(p);
              const isActive = activePartIdx === pIdx;

              return (
                <div key={pIdx} className={`flex items-center gap-3 px-6 py-3 rounded-2xl transition-all border shrink-0 ${isActive ? 'bg-rose-50 border-rose-100 shadow-sm' : 'bg-transparent border-transparent text-slate-400'}`}>
                  <span
                    onClick={() => { setActivePartIdx(pIdx); setActiveQuestionIdx(0); }}
                    className={`text-[10px] font-black uppercase whitespace-nowrap cursor-pointer hover:text-rose-500 transition-colors ${isActive ? 'text-rose-600' : ''}`}
                  >
                    Part {pIdx + 1}:
                  </span>

                  <div className="flex gap-1.5">
                    {qs.map((q: any, qIdx: number) => (
                      <button
                        key={qIdx}
                        onClick={() => { setActivePartIdx(pIdx); setActiveQuestionIdx(qIdx); }}
                        className={`w-7 h-7 flex items-center justify-center text-[10px] font-bold rounded-lg transition-all ${isActive && activeQuestionIdx === qIdx ? 'bg-rose-500 text-white shadow-md' : 'bg-white border border-slate-200 text-slate-400 hover:bg-slate-50'}`}
                      >
                        {qIdx + 1}
                      </button>
                    ))}
                    {qs.length === 0 && <span className="text-[10px] italic">0 questions</span>}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="ml-6 border-l border-slate-200 pl-6 shrink-0">
            <button
              onClick={handleSubmit}
              className="px-8 py-3 bg-slate-900 hover:bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl active:scale-95 transition-all"
            >
              Final Submit
            </button>
          </div>
        </div>

        <style jsx>{`
          .no-scrollbar::-webkit-scrollbar { display: none; }
          .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}</style>
      </div>
    </ProtectedRoute>
  );
}
