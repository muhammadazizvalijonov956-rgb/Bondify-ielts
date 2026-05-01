"use client";

import { useEffect, useState, useRef, Suspense } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { db } from '@/lib/firebase/config';
import { doc, getDoc, setDoc, collection, query, where, getDocs, updateDoc, onSnapshot, deleteDoc } from 'firebase/firestore';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useAutoSave } from '@/lib/hooks/useAutoSave';
import { Mic, ArrowRight, Video, ChevronLeft, ChevronRight, Send, Upload, Clock, User, Sparkles, Users, Loader2 } from 'lucide-react';
import TestNavbar from '@/components/TestNavbar';

function SpeakingTestContent() {
  const [test, setTest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const router = useRouter();
  const params = useParams();
  const testId = params.id as string;
  const searchParams = useSearchParams();
  const fullTestId = searchParams.get('fullTestId');
  const sessionId = searchParams.get('session') || undefined;
  const { user, profile } = useAuth();
  const [sessionData, setSessionData] = useState<any>(null);

  // Navigation State
  const {
    answers,
    updateAnswer,
    activePartIndex: activePartIdx,
    updateActivePart: setActivePartIdx,
    saveStatus,
    showRecoverPrompt,
    handleRecover,
    markCompleted
  } = useAutoSave({
    testId,
    userId: user?.uid,
    section: 'speaking'
  });
  const [activeQuestionIdx, setActiveQuestionIdx] = useState(0);
  const [timer, setTimer] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [totalSpeakingTime, setTotalSpeakingTime] = useState(0);

  // New Modes
  const [sessionMode, setSessionMode] = useState<'none' | 'selecting' | 'human_matching' | 'human_room'>('none');
  const [humanPeer, setHumanPeer] = useState<any>(null);

  const matchTimeoutRef = useRef<any>(null);
  const queueDocRef = useRef<any>(null);
  const unsubscribeRef = useRef<any>(null);

  useEffect(() => {
    async function fetchTest() {
      if (!testId) return;
      try {
        const snap = await getDoc(doc(db, 'tests', testId));
        if (snap.exists()) setTest({ id: snap.id, ...snap.data() });
      } catch (err) {
        console.error("Error fetching speaking test:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchTest();

    if (sessionId) {
      getDoc(doc(db, 'test_sessions', sessionId)).then(snap => {
        if (snap.exists()) setSessionData(snap.data());
      });
    }
  }, [testId, sessionId]);

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

  useEffect(() => {
    return () => {
      // Cleanup matchmaking if user navigates away or unmounts
      if (unsubscribeRef.current) unsubscribeRef.current();
      if (matchTimeoutRef.current) clearTimeout(matchTimeoutRef.current);
      if (queueDocRef.current && sessionMode === 'human_matching') {
        deleteDoc(queueDocRef.current).catch(console.error);
      }
    };
  }, [sessionMode]);

  const startHumanMatching = async () => {
    setSessionMode('human_matching');
    if (!user) {
      alert("Please log in to practice with a partner.");
      return setSessionMode('selecting');
    }

    try {
      // 1. Look for someone already waiting for this specific test
      const q = query(
        collection(db, 'speaking_queue'),
        where('status', '==', 'waiting'),
        where('testId', '==', test.id)
      );

      const snap = await getDocs(q);
      const availableDocs = snap.docs.filter(d => d.data().userId !== user.uid);

      if (availableDocs.length > 0) {
        // Match found!
        const partnerDoc = availableDocs[0];
        const partnerData = partnerDoc.data();
        const roomId = `room_${Date.now()}`;

        // Update partner's doc to notify them
        await updateDoc(doc(db, 'speaking_queue', partnerDoc.id), {
          status: 'matched',
          partnerId: user.uid,
          partnerName: profile?.username || user.displayName || 'Student',
          roomId: roomId
        });

        setHumanPeer({ name: partnerData.userName || "Partner", band: "Estimated Band 6.5" });
        setSessionMode('human_room');
      } else {
        // 2. No one waiting, create my own queue doc
        const newQueueRef = doc(collection(db, 'speaking_queue'));
        queueDocRef.current = newQueueRef;

        await setDoc(newQueueRef, {
          userId: user.uid,
          userName: profile?.username || user.displayName || 'Student',
          testId: test.id,
          status: 'waiting',
          createdAt: new Date().toISOString()
        });

        // Listen for changes (someone finding me)
        const unsub = onSnapshot(newQueueRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.status === 'matched') {
              if (matchTimeoutRef.current) clearTimeout(matchTimeoutRef.current);
              setHumanPeer({ name: data.partnerName || "Partner", band: "Estimated Band 6.5" });
              setSessionMode('human_room');
              // cleanup my queue doc after entering room
              deleteDoc(newQueueRef).catch(console.error);
            }
          }
        });
        unsubscribeRef.current = unsub;

        // 3. Timeout fallback to AI mode (e.g. 10 seconds)
        const timeoutId = setTimeout(async () => {
          if (unsubscribeRef.current) unsubscribeRef.current();
          if (queueDocRef.current) {
            await deleteDoc(queueDocRef.current).catch(console.error);
            queueDocRef.current = null;
          }

          alert("No speaking partner found. Returning to solo practice.");
          setSessionMode('none');
        }, 10000);

        matchTimeoutRef.current = timeoutId;
      }
    } catch (err) {
      console.error("Matchmaking error:", err);
      setSessionMode('none');
    }
  };

  // Reset timer on question change
  useEffect(() => {
    setTimer(0);
    setIsRecording(false);
  }, [activePartIdx, activeQuestionIdx]);

  const handleSubmit = async (agentHistory?: any[]) => {
    if (!user || !test) return;
    if (!confirm("Are you sure you want to finish the entire Speaking test?")) return;
    setSubmitting(true);

    let finalUserId = user.uid;
    let finalEmail = user.email || "";
    let finalName = profile?.username || user.displayName || 'Anonymous Student';
    let isStaffSession = sessionData?.created_by_staff === true;
    let organization = sessionData?.organization || "Bondify";

    if (isStaffSession) {
      finalUserId = sessionId || "unknown_session";
      finalName = sessionData.student_name;
      finalEmail = sessionData.student_email || "";
    }

    const isSkipped = !agentHistory && totalSpeakingTime < 10;
    const estimatedBand = isSkipped ? 0.0 : 6.5;

    const attemptId = `att_speak_${Date.now()}`;
    const attempt = {
      id: attemptId,
      userId: finalUserId,
      testId: test.id,
      testTitle: test.title || '',
      section: 'speaking',
      startedAt: new Date().toISOString(),
      submittedAt: new Date().toISOString(),
      status: 'pending_evaluation',
      userDisplayName: finalName,
      userEmail: finalEmail,
      isStaffSession,
      organization,
      sessionId: sessionId || null,
      estimatedBand,
      normalizedScore: isSkipped ? 0 : 30,
      sessionMode: agentHistory ? 'ai_agent' : (sessionMode === 'human_room' ? 'human' : 'ai'),
      agentHistory: agentHistory || null
    };

    try {
      await setDoc(doc(db, 'attempts', attemptId), attempt);
      await markCompleted();

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
          userId: finalUserId,
          testId: fullTestId,
          testTitle: test.title || 'Full IELTS Practice Test',
          section: 'full-test',
          startedAt: new Date().toISOString(),
          submittedAt: new Date().toISOString(),
          status: 'pending_evaluation',
          userDisplayName: finalName,
          userEmail: finalEmail,
          estimatedBand: overall,
          listeningBand: lBand,
          readingBand: rBand,
          writingBand: wBand,
          speakingBand: estimatedBand,
          listeningAttemptId: searchL || null,
          readingAttemptId: searchR || null,
          writingAttemptId: searchW || null,
          speakingAttemptId: attemptId,
          isStaffSession,
          organization,
          sessionId: sessionId || null,
          fullTestId: fullTestId
        };
        await setDoc(doc(db, 'attempts', fullAttemptId), fullAttempt);

        // Trigger FINAL Consolidated Email
        if (finalEmail) {
          fetch('/api/send-result', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ attemptId: fullAttemptId, attempt: fullAttempt })
          }).catch(e => console.error("Final result delivery failed", e));
        }

        router.push(`/results/${fullAttemptId}`);
      } else {
        // Trigger Async Email Result - ONLY for individual speaking test
        if (finalEmail) {
          fetch('/api/send-result', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ attemptId, attempt })
          }).catch(e => console.error("Result delivery failed", e));
        }
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
        <TestNavbar durationMinutes={15} title="Speaking Practice" saveStatus={saveStatus} />

        {showRecoverPrompt && (
          <div className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full text-center">
              <h3 className="text-xl font-bold text-slate-900 mb-2">Unfinished Test Found</h3>
              <p className="text-sm text-slate-500 mb-6">You have a previous session for this test. Would you like to resume where you left off?</p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => handleRecover(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors"
                >
                  Restart Fresh
                </button>
                <button
                  onClick={() => handleRecover(true)}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 shadow-md shadow-blue-600/20 transition-all"
                >
                  Continue Test
                </button>
              </div>
            </div>
          </div>
        )}

        {/* --- INITIAL WAIT SCREEN --- */}
        {sessionMode === 'none' && (
          <div className="flex-1 flex items-center justify-center bg-slate-50">
            <div className="text-center max-w-md p-8 bg-white border border-slate-200 rounded-[2rem] shadow-xl">
              <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Mic className="w-10 h-10 text-rose-500" />
              </div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Speak Confidently</h1>
              <p className="text-slate-500 font-medium mb-8">Get ready to record your speaking test. You will need a functioning microphone.</p>
              <button
                onClick={() => setSessionMode('selecting')}
                className="w-full py-4 bg-slate-900 hover:bg-black text-white rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl active:scale-95 transition-all"
              >
                Start Speaking Test
              </button>
            </div>
          </div>
        )}

        {/* --- SELECTION MODAL --- */}
        {sessionMode === 'selecting' && (
          <div className="flex-1 flex items-center justify-center bg-slate-50 relative p-6">
            <div className="max-w-3xl w-full grid md:grid-cols-2 gap-8 z-10">



              {/* Practice with Human */}
              <div
                onClick={startHumanMatching}
                className="bg-white border-2 border-slate-200 hover:border-emerald-500 rounded-[2.5rem] p-10 cursor-pointer transition-all hover:-translate-y-2 hover:shadow-2xl hover:shadow-emerald-500/20 group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-20 transition-opacity">
                  <Users className="w-32 h-32 text-emerald-500" />
                </div>
                <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-8 border border-emerald-100 group-hover:bg-emerald-600 group-hover:text-white transition-colors shadow-sm">
                  <Users className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-3">Practice with Human</h3>
                <p className="text-slate-500 font-medium leading-relaxed mb-8">
                  Get matched with another online student. Both of you will answer the questions together in a live interactive room. We'll record both separately.
                </p>
                <div className="flex items-center text-emerald-600 font-bold text-sm tracking-widest uppercase gap-2 group-hover:translate-x-2 transition-transform">
                  Find a Partner <ArrowRight className="w-4 h-4" />
                </div>
              </div>

            </div>
          </div>
        )}

        {/* --- HUMAN MATCHING QUEUE --- */}
        {sessionMode === 'human_matching' && (
          <div className="flex-1 flex flex-col items-center justify-center bg-slate-900 text-white p-8">
            <div className="animate-spin mb-8">
              <Loader2 className="w-16 h-16 text-emerald-400" />
            </div>
            <h2 className="text-3xl font-black tracking-tight mb-2">Matching you with a partner...</h2>
            <p className="text-slate-400 font-medium">Please wait in the queue. You will be paired with a student of similar band target.</p>
          </div>
        )}

        {/* --- ACTIVE RECORDING INTERFACE (AI OR HUMAN) --- */}
        {(sessionMode === 'human_room') && (
          <>
            <div className="text-center py-4 border-b border-slate-100 shadow-sm sticky top-[60px] bg-white z-10 flex items-center justify-center gap-4">
              {sessionMode === 'human_room' && (
                <div className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest rounded-full border border-emerald-200 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Live Room
                </div>
              )}
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-0.5">Part {activePartIdx + 1}</p>
                <p className="text-sm font-bold text-slate-800 italic">Answer {activePartIdx === 1 ? 'the cue card topic' : `questions 1-${questions.length}`}</p>
              </div>
            </div>


            <>
              <main className="flex-1 flex flex-col pt-8 px-6 pb-24 relative">
                <div className={`max-w-[1400px] mx-auto w-full flex gap-8 h-full ${sessionMode === 'human_room' ? 'flex-col md:flex-row' : 'flex-col lg:max-w-5xl'}`}>

                  {/* Left Side: Question List (Only if not human room, or split layout) */}
                  <div className={`flex shrink-0 flex-col w-full ${sessionMode === 'human_room' ? 'md:w-1/2' : ''}`}>

                    <div className="flex flex-col h-full bg-white border border-slate-200 shadow-sm rounded-3xl p-8 mb-4 relative overflow-hidden">
                      {/* Navigation Buttons Row */}
                      <div className="flex items-center justify-between mb-8 z-10">
                        <button
                          onClick={goToPrev}
                          disabled={activePartIdx === 0 && activeQuestionIdx === 0}
                          className="flex items-center gap-2 px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-black uppercase transition-all disabled:opacity-30 border border-slate-200 shadow-sm active:scale-95"
                        >
                          <ChevronLeft className="w-4 h-4" /> Prev
                        </button>

                        <div className="px-4 py-2 bg-rose-50 border border-rose-200 text-rose-600 rounded-lg text-xs font-black tracking-widest">
                          {timer} SEC
                        </div>

                        <button
                          onClick={goToNext}
                          disabled={activePartIdx === parts.length - 1 && activeQuestionIdx === questions.length - 1}
                          className="flex items-center gap-2 px-5 py-2 bg-slate-900 hover:bg-black text-white rounded-lg text-xs font-black uppercase transition-all disabled:opacity-30 shadow-xl active:scale-95"
                        >
                          Next <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="text-center space-y-4 mb-auto z-10 mt-8">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Question {activeQuestionIdx + 1}</h3>
                        <h2 className={`font-black text-slate-900 leading-tight italic mx-auto ${sessionMode === 'human_room' ? 'text-2xl max-w-lg' : 'text-3xl max-w-3xl'}`}>
                          {currentQuestion.label || currentQuestion.text || currentQuestion.content}
                        </h2>
                      </div>
                    </div>
                  </div>

                  {/* Right Side: Media/Recording */}
                  <div className={`flex flex-col gap-4 w-full ${sessionMode === 'human_room' ? 'md:w-1/2' : ''}`}>

                    {/* Human Room Video Feeds */}
                    {sessionMode === 'human_room' && (
                      <div className="grid grid-cols-2 gap-4 h-48 mb-4">
                        <div className="bg-slate-900 rounded-3xl overflow-hidden relative border border-slate-800 shadow-inner group">
                          <video autoPlay muted playsInline className="absolute inset-0 w-full h-full object-cover opacity-80" />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent" />
                          <div className="absolute bottom-4 left-4 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-xs font-bold text-white">You</span>
                          </div>
                          {!isRecording && (
                            <div className="absolute top-4 right-4 bg-rose-500/20 px-2 py-0.5 rounded text-rose-500 text-[10px] font-bold uppercase backdrop-blur-md border border-rose-500/30">Muted</div>
                          )}
                        </div>
                        <div className={`bg-slate-900 rounded-3xl overflow-hidden relative border border-slate-800 shadow-inner group flex items-center justify-center`}>
                          <div className="absolute inset-0 mix-blend-overlay opacity-30 bg-indigo-500" />
                          <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-md">
                            <User className="w-8 h-8 text-white/50" />
                          </div>
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent" />
                          <div className="absolute bottom-4 left-4">
                            <span className="text-xs font-bold text-white block">{humanPeer?.name}</span>
                            <span className="text-[10px] text-slate-400 block">{humanPeer?.band}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Recording Interface Box */}
                    <div className="flex-1 bg-slate-50 border border-slate-200 rounded-3xl p-8 flex flex-col items-center justify-center shadow-inner relative min-h-[300px]">

                      {!isRecording ? (
                        <div className="flex flex-col items-center gap-6">
                          <button
                            onClick={() => setIsRecording(true)}
                            className="w-[100px] h-[100px] bg-rose-500 hover:bg-rose-600 text-white rounded-[2rem] flex items-center justify-center shadow-[0_0_40px_rgba(244,63,94,0.3)] transition-all hover:scale-105 active:scale-95 hover:rotate-3"
                          >
                            <Mic className="w-10 h-10" />
                          </button>
                          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mt-2">Tap to Record Answer</p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-8 w-full max-w-sm">
                          <div className="flex items-center gap-1.5 h-16 w-full justify-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                            {[...Array(16)].map((_, i) => (
                              <div key={i} className="w-1.5 bg-rose-500 rounded-full animate-[pulse_1s_infinite]" style={{ height: `${Math.random() * 30 + 10}px`, animationDelay: `${i * 0.05}s` }} />
                            ))}
                          </div>

                          <button
                            onClick={() => setIsRecording(false)}
                            className="w-[100px] h-[100px] bg-slate-900 hover:bg-black text-white rounded-[2rem] flex items-center justify-center shadow-2xl transition-all active:scale-95 group"
                          >
                            <div className="w-8 h-8 bg-white rounded-md group-hover:scale-90 transition-transform" />
                          </button>
                          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Tap to Stop Recording</p>
                        </div>
                      )}

                    </div>
                  </div>

                </div>
              </main>

              {/* Bottom Tab Navigation */}
              <div className="bg-white/90 backdrop-blur-xl border-t border-slate-200 fixed bottom-0 left-0 right-0 z-20 flex items-center justify-between p-4 px-6 md:px-12 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">

                <div className="flex items-center gap-6 overflow-x-auto no-scrollbar max-w-full">
                  {parts.map((p: any, pIdx: number) => {
                    const qs = getQuestions(p);
                    const isActive = activePartIdx === pIdx;

                    return (
                      <div key={pIdx} className={`flex items-center gap-3 px-5 py-2.5 rounded-2xl transition-all border shrink-0 ${isActive ? 'bg-slate-900 border-slate-800 text-white shadow-md' : 'bg-transparent border-transparent text-slate-500 hover:bg-slate-100'}`}>
                        <span
                          onClick={() => { setActivePartIdx(pIdx); setActiveQuestionIdx(0); }}
                          className={`text-[10px] font-black uppercase whitespace-nowrap cursor-pointer transition-colors ${isActive ? 'text-white' : ''}`}
                        >
                          Part {pIdx + 1}:
                        </span>

                        <div className="flex gap-1.5">
                          {qs.map((q: any, qIdx: number) => (
                            <button
                              key={qIdx}
                              onClick={() => { setActivePartIdx(pIdx); setActiveQuestionIdx(qIdx); }}
                              className={`w-6 h-6 flex items-center justify-center text-[10px] font-bold rounded-lg transition-all ${isActive && activeQuestionIdx === qIdx ? 'bg-white text-slate-900 shadow-sm' : 'bg-white border border-slate-200 text-slate-400 hover:text-slate-900'}`}
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

                <div className="shrink-0 flex items-center gap-4">
                  <button
                    onClick={() => handleSubmit()}
                    disabled={submitting}
                    className="px-8 py-3.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-xl shadow-rose-500/20 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2"
                  >
                    {submitting ? 'Submitting...' : 'Finish Test'}
                  </button>
                </div>
              </div>
            </>
            ){'}'}
          </>
        )}

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

export default function TakingSpeakingTest() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center font-bold text-slate-500 italic">
        Initializing Speaking Module...
      </div>
    }>
      <SpeakingTestContent />
    </Suspense>
  );
}
