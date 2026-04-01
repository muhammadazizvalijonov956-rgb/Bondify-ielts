"use client";

import { useEffect, useState, useRef } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { db } from '@/lib/firebase/config';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useAutoSave } from '@/lib/hooks/useAutoSave';
import { ArrowRight } from 'lucide-react';
import TestNavbar from '@/components/TestNavbar';
import SelectionHighlighter from '@/components/SelectionHighlighter';
import { addToVault } from '@/lib/services/vault';
import VaultToast from '@/components/VaultToast';

function calculateReadingBandScore(rawScore: number) {
  if (rawScore <= 0) return 0.0;
  if (rawScore >= 39) return 9.0;
  if (rawScore >= 37) return 8.5;
  if (rawScore >= 35) return 8.0;
  if (rawScore >= 33) return 7.5;
  if (rawScore >= 30) return 7.0;
  if (rawScore >= 27) return 6.5;
  if (rawScore >= 23) return 6.0;
  if (rawScore >= 19) return 5.5;
  if (rawScore >= 15) return 5.0;
  if (rawScore >= 13) return 4.5;
  if (rawScore >= 10) return 4.0;
  if (rawScore >= 6) return 3.5;
  if (rawScore >= 4) return 3.0;
  return 2.5;
}

function getQuestionItemsFromPart(part: any): any[] {
  if (Array.isArray(part.items)) {
    const result: any[] = [];
    part.items.forEach((item: any) => {
      if (item.type === 'question') result.push(item);
      if (item.type === 'matching_group' && Array.isArray(item.questions)) {
        item.questions.forEach((q: any) => result.push({ ...q, type: 'question', _matchingGroup: item }));
      }
      if (item.type === 'table' && Array.isArray(item.tableQuestions)) {
        item.tableQuestions.forEach((q: any) => result.push({ ...q, type: 'question', _table: item }));
      }
    });
    return result;
  }
  if (Array.isArray(part.questions)) return part.questions;
  if (part.questions) return Object.values(part.questions);
  return [];
}

function getQuestionKey(q: any): string {
  if (Array.isArray(q.ids) && q.ids.length > 0) return String(q.ids[0]);
  return String(q.id);
}

function AnswerInput({
  qKey,
  answers,
  onAnswer,
}: {
  qKey: string;
  answers: Record<string, string>;
  onAnswer: (id: string, val: string) => void;
}) {
  return (
    <input
      type="text"
      value={answers[qKey] || ''}
      onChange={(e) => onAnswer(qKey, e.target.value)}
      className="inline-block align-middle mx-1 px-2 border-b-2 border-slate-800 bg-transparent focus:outline-none focus:border-blue-600 text-sm w-28 text-center font-semibold transition-colors"
      autoComplete="off"
      spellCheck={false}
    />
  );
}

function renderItems(
  items: any[],
  answers: Record<string, string>,
  onAnswer: (id: string, val: string) => void,
  questionRefs: React.MutableRefObject<{ [key: string]: HTMLElement | null }>
) {
  return items.map((item: any, idx: number) => {
    const key = `item-${idx}`;
    if (item.type === 'heading') return <h2 key={key} className="font-bold text-[15px] text-black mb-4 mt-2">{item.content}</h2>;
    if (item.type === 'section') return <h3 key={key} className="font-bold text-[13px] text-black mt-6 mb-2 uppercase tracking-wide border-b border-slate-200 pb-1">{item.content}</h3>;
    if (item.type === 'text') return <p key={key} className="text-[13px] text-black mb-1">{item.content}</p>;
    if (item.type === 'question') {
      const qKey = getQuestionKey(item);
      const answerType = item.answer_type ?? 'blank';

      if (answerType === 'multi_select') {
        const selectedKeys: string[] = (answers[qKey] ?? '').split(',').map((s: string) => s.trim()).filter(Boolean);
        const ids: number[] = item.ids ?? [item.id ?? 0];
        const maxSel: number = item.maxSelections ?? ids.length;

        const toggleOption = (letter: string) => {
          const already = selectedKeys.includes(letter);
          let next = already ? selectedKeys.filter(x => x !== letter) : (selectedKeys.length < maxSel ? [...selectedKeys, letter] : selectedKeys);
          onAnswer(qKey, next.join(', '));
        };

        return (
          <div key={key} ref={(el) => { ids.forEach(id => { questionRefs.current[String(id)] = el; }); }} className="mb-6">
            <div className="flex items-start gap-2 flex-wrap mb-3">
              {ids.map((n: number) => <span key={n} className="inline-flex items-center justify-center min-w-[1.375rem] h-[1.375rem] border border-slate-700 text-[10px] font-bold bg-white rounded-sm shrink-0">{n}</span>)}
              <span className="text-[13px] font-medium text-black flex-1">{item.label}</span>
            </div>
            <div className="space-y-2 ml-1">
              {(item.options ?? []).map((opt: string, i: number) => {
                const letter = String.fromCharCode(65 + i);
                const checked = selectedKeys.includes(letter);
                return (
                  <label key={i} className={`flex items-center gap-3 cursor-pointer text-[13px] group select-none`}>
                    <span className="w-6 h-6 rounded-full border-2 border-slate-400 flex items-center justify-center text-[11px] font-bold text-slate-600 shrink-0">{letter}</span>
                    <span className={`w-4 h-4 border-2 rounded flex items-center justify-center shrink-0 transition-colors ${checked ? 'bg-blue-600 border-blue-600' : 'border-slate-400 bg-white group-hover:border-blue-400'}`}>
                      {checked && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 12 12"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                    </span>
                    <input type="checkbox" checked={checked} onChange={() => toggleOption(letter)} className="sr-only" />
                    <span className={checked ? 'font-semibold text-black' : 'text-black'}>{opt}</span>
                  </label>
                );
              })}
            </div>
          </div>
        );
      }

      if (answerType === 'multiple_choice') {
        return (
          <div key={key} ref={(el) => { questionRefs.current[qKey] = el; }} className="mb-5">
            <div className="flex items-start gap-2 mb-2">
              <span className="inline-flex items-center justify-center min-w-[1.375rem] h-[1.375rem] border border-slate-700 text-[10px] font-bold bg-white rounded-sm shrink-0 mt-0.5">{item.id}</span>
              <span className="text-[13px] text-black font-medium">{item.label}</span>
            </div>
            <div className="space-y-2 ml-8">
              {(item.options ?? []).map((opt: string, i: number) => {
                const letter = String.fromCharCode(65 + i);
                const selected = answers[qKey] === opt;
                return (
                  <label key={i} className="flex items-center gap-3 cursor-pointer text-[13px] group select-none">
                    <span className="w-6 h-6 rounded-full border-2 border-slate-400 flex items-center justify-center text-[11px] font-bold text-slate-600 shrink-0">{letter}</span>
                    <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${selected ? 'bg-blue-600 border-blue-600' : 'border-slate-400 bg-white group-hover:border-blue-400'}`}>
                      {selected && <span className="w-2 h-2 rounded-full bg-white inline-block" />}
                    </span>
                    <input type="radio" name={`q_${qKey}`} checked={selected} onChange={() => onAnswer(qKey, opt)} className="sr-only" />
                    <span className={selected ? 'font-semibold text-black' : 'text-black'}>{opt}</span>
                  </label>
                );
              })}
            </div>
          </div>
        );
      }

      if (answerType === 'dropdown') {
        return (
          <div key={key} ref={(el) => { questionRefs.current[qKey] = el; }} className="flex items-center gap-2 text-[13px] text-black mb-3 leading-relaxed flex-wrap">
            <span className="inline-flex items-center justify-center min-w-[1.375rem] h-[1.375rem] border border-slate-700 text-[10px] font-bold bg-white rounded-sm shrink-0">{item.id}</span>
            {item.label && <span className="font-medium mr-1">{item.label}</span>}
            <select
              value={answers[qKey] ?? ''}
              onChange={e => onAnswer(qKey, e.target.value)}
              className="px-2 py-0.5 border border-slate-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-bold text-emerald-700 min-w-[80px]"
            >
              <option value="">—</option>
              {(item.options ?? []).map((opt: string) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            {item.suffix && <span className="font-medium ml-1">{item.suffix}</span>}
          </div>
        );
      }

      return (
        <div key={key} ref={(el) => { questionRefs.current[qKey] = el; }} className="flex items-center gap-1 text-[13px] text-black mb-2 leading-relaxed flex-wrap">
          <span className="inline-flex items-center justify-center min-w-[1.375rem] h-[1.375rem] border border-slate-700 text-[10px] font-bold bg-white rounded-sm shrink-0">{item.id}</span>
          {item.label && <span className="font-medium">{item.label}</span>}
          <AnswerInput qKey={qKey} answers={answers} onAnswer={onAnswer} />
          {item.suffix && <span className="font-medium">{item.suffix}</span>}
        </div>
      );
    }

    if (item.type === 'matching_group') {
      const letters = (item.matchOptions ?? []).map((o: any) => o.letter);
      return (
        <div key={key} className="mb-6">
          {item.optionsTitle && <p className="font-bold text-[13px] text-black mb-2">{item.optionsTitle}</p>}
          <div className="mb-4 space-y-0.5">{(item.matchOptions ?? []).map((o: any) => <p key={o.letter} className="text-[13px] text-black"><span className="font-bold mr-1">{o.letter}</span>{o.text}</p>)}</div>
          {item.title && <p className="font-bold text-[13px] text-black mb-2 mt-3">{item.title}</p>}
          <div className="space-y-2">
            {(item.questions ?? []).map((q: any) => {
              const qKey = String(q.id);
              return (
                <div key={q.id} ref={(el) => { questionRefs.current[qKey] = el; }} className="flex items-center gap-2 text-[13px] text-black flex-wrap">
                  <span className="inline-flex items-center justify-center min-w-[1.375rem] h-[1.375rem] border border-slate-700 text-[10px] font-bold bg-white rounded-sm shrink-0">{q.id}</span>
                  <span className="font-medium">{q.label}</span>
                  <select value={answers[qKey] ?? ''} onChange={e => onAnswer(qKey, e.target.value)} className="border border-slate-400 rounded px-1.5 py-0.5 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-500">
                    <option value="">—</option>
                    {letters.map((l: string) => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    if (item.type === 'table') {
      const headers = item.headers ?? [];
      const rows = item.rows ?? [];
      return (
        <div key={key} className="mb-6 overflow-x-auto">
          <table className="w-full border-collapse border border-slate-300 text-[13px]">
            <thead>
              <tr className="bg-slate-50">
                {headers.map((h: string, i: number) => (
                  <th key={i} className="border border-slate-300 px-3 py-2 text-left font-bold text-black uppercase tracking-tight">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row: any, ri: number) => (
                <tr key={ri}>
                  {row.cells.map((cell: any, ci: number) => (
                    <td key={ci} className="border border-slate-300 px-3 py-2 text-black align-top">
                      {(() => {
                        const content = cell.content || "";
                        const parts = content.split(/(\[q:\d+\])/g);
                        return parts.map((part: string, pi: number) => {
                          const match = part.match(/\[q:(\d+)\]/);
                          if (match) {
                            const qId = match[1];
                            return (
                              <span key={pi} ref={(el) => { if (el) questionRefs.current[qId] = el as any; }} className="inline-flex items-center mx-1 flex-wrap whitespace-nowrap">
                                <span className="inline-flex items-center justify-center min-w-[1.25rem] h-[1.25rem] border border-slate-700 text-[9px] font-bold bg-white rounded-sm shrink-0 mr-1">{qId}</span>
                                <AnswerInput qKey={qId} answers={answers} onAnswer={onAnswer} />
                              </span>
                            );
                          }
                          return <span key={pi}>{part}</span>;
                        });
                      })()}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    return null;
  });
}

export default function TakingReadingTest() {
  const [test, setTest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [sessionData, setSessionData] = useState<any>(null);
  const [showEmailPrompt, setShowEmailPrompt] = useState(false);
  const [publicEmail, setPublicEmail] = useState('');
  
  const router = useRouter();
  const params = useParams();
  const testId = params.id as string;
  const { user, profile } = useAuth();
  
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session') || undefined;
  
  const {
    answers,
    updateAnswer: handleAnswer,
    activePartIndex,
    updateActivePart: setActivePartIndex,
    saveStatus,
    showRecoverPrompt,
    handleRecover,
    markCompleted
  } = useAutoSave({
    testId,
    userId: user?.uid,
    section: 'reading',
    sessionId
  });
  
  const fullTestId = searchParams.get('fullTestId');
  const [fullTestComps, setFullTestComps] = useState<any>(null);
  const questionRefs = useRef<{ [key: string]: HTMLElement | null }>({});
  const [vaultedWord, setVaultedWord] = useState<string>('');
  const [showVaultToast, setShowVaultToast] = useState(false);
  const passageRef = useRef<HTMLDivElement>(null);

  const handleDoubleClick = async () => {
    if (typeof window === 'undefined' || !user) return;
    const selection = window.getSelection();
    const word = selection?.toString().trim();
    if (word && word.length > 1 && word.split(/\s+/).length === 1) {
        setVaultedWord(word);
        setShowVaultToast(true);
        await addToVault(user.uid, word);
    }
  };

  useEffect(() => {
    if (fullTestId) {
      const fetchFullConfig = async () => {
        const snap = await getDoc(doc(db, 'tests', fullTestId as string));
        if (snap.exists()) setFullTestComps(snap.data().fullTestComponents);
      };
      fetchFullConfig();
    }
  }, [fullTestId]);

  useEffect(() => {
    async function fetchTest() {
      if (!testId) return;
      try {
        const snap = await getDoc(doc(db, 'tests', testId));
        if (snap.exists()) setTest({ id: snap.id, ...snap.data() });
      } catch (err) {
        console.error("Error fetching test:", err);
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


  const handleSubmit = async () => {
    if (!test) return;

    // Determine student info
    let finalUserId = user?.uid || "";
    let finalEmail = user?.email || "";
    let finalName = profile?.username || user?.displayName || 'Anonymous Student';
    let isStaffSession = sessionData?.created_by_staff === true;
    let organization = sessionData?.organization || "Bondify";

    if (isStaffSession) {
      finalUserId = sessionId || "unknown_session";
      finalName = sessionData.student_name;
      finalEmail = sessionData.student_email || "";
    } else if (!user) {
      setShowEmailPrompt(true);
      return;
    }

    if (!confirm("Are you sure you want to finish the test?")) return;
    performSubmit(finalUserId, finalName, finalEmail, isStaffSession, organization);
  };

  const performSubmit = async (finalUserId: string, finalName: string, finalEmail: string, isStaffSession: boolean, organization: string) => {
    setSubmitting(true);
    let correctCount = 0, maxScore = 0;
    const safeParts = Array.isArray(test.parts) ? test.parts : (test.parts ? Object.values(test.parts) : []);
    const questionResults: any[] = [];
    const normalizeMulti = (s: string) => s.split(',').map(x => x.trim().toUpperCase()).sort().join(',');

    safeParts.forEach((part: any) => {
      getQuestionItemsFromPart(part).forEach((q: any) => {
        const correctAnswer = (q.correctAnswer || q.answer || "").trim();
        if (!correctAnswer) return;
        const key = getQuestionKey(q);
        const userAnswer = answers[key]?.trim() || "";

        if (q.answer_type === 'multi_select') {
          const ids = q.ids ?? [q.id ?? 0];
          const isCorrect = normalizeMulti(userAnswer) === normalizeMulti(correctAnswer);
          maxScore += ids.length;
          if (isCorrect) correctCount += ids.length;
          ids.forEach((id: number) => {
            questionResults.push({ id: String(id), number: id, label: q.label || '', userAnswer, correctAnswer, isCorrect, partTitle: part.title || '' });
          });
        } else {
          maxScore++;
          // Support exact match, case insensitive, multiple possible answers separated by "/"
          const validAnswers = correctAnswer.split('/').map((a: string) => a.trim().toLowerCase());
          const isCorrect = validAnswers.includes(userAnswer.toLowerCase());
          
          if (isCorrect) correctCount++;
          questionResults.push({ id: key, number: q.id ?? q.number, label: q.label || q.text || '', userAnswer, correctAnswer, isCorrect, partTitle: part.title || '' });
        }
      });
    });

    const normalizedRawScore = maxScore > 0 ? Math.floor((correctCount / maxScore) * 40) : 0;
    const band = calculateReadingBandScore(normalizedRawScore);
    const attemptId = `att_${Date.now()}`;
    const attempt = {
      id: attemptId,
      userId: finalUserId,
      testId: test.id,
      testTitle: test.title || '',
      section: 'reading',
      startedAt: new Date().toISOString(),
      submittedAt: new Date().toISOString(),
      rawScore: correctCount,
      maxScore,
      normalizedScore: normalizedRawScore,
      estimatedBand: band,
      questionResults,
      userDisplayName: finalName,
      userEmail: finalEmail,
      isStaffSession,
      organization,
      sessionId: sessionId || null
    };

    try {
      await setDoc(doc(db, 'attempts', attemptId), attempt);
      await markCompleted();

      // Trigger Async Email Result
      if (finalEmail) {
        fetch('/api/send-result', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ attemptId, attempt })
        }).catch(e => console.error("Result delivery failed", e));
      }

      if (fullTestComps?.writing) {
        let url = `/writing/${fullTestComps.writing}?fullTestId=${fullTestId}&r=${attemptId}${sessionId ? `&session=${sessionId}` : ''}`;
        const searchL = searchParams.get('l');
        if (searchL) url += `&l=${searchL}`;
        router.push(url);
      } else {
        router.push(`/results/${attemptId}`);
      }
    } catch (err) {
      console.error("Failed to save attempt", err);
      alert("Failed to submit test. Please try again.");
      setSubmitting(false);
    }
  };

  const scrollToQuestion = (qKey: string) => {
    const el = questionRefs.current[qKey];
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  if (loading) return <ProtectedRoute><div className="min-h-screen flex items-center justify-center font-bold text-slate-500">Loading Reading Test...</div></ProtectedRoute>;
  if (!test) return <ProtectedRoute><div className="min-h-screen flex items-center justify-center font-bold text-slate-500">Test not found.</div></ProtectedRoute>;

  const safeParts = Array.isArray(test.parts) ? test.parts : (test.parts ? Object.values(test.parts) : []);
  const activePart: any = safeParts[activePartIndex] || {};
  const questionItems = getQuestionItemsFromPart(activePart);
  const questionNumbers = questionItems.map((q: any) => q.id ?? q.number).filter(Boolean);

  return (
    <ProtectedRoute>
      <div className="h-screen bg-[#f1f2f3] flex flex-col font-sans selection:bg-emerald-200 overflow-hidden">
        <TestNavbar durationMinutes={60} title="Reading Practice" saveStatus={saveStatus} />

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

        {/* Sticky Sub-header */}
        <div className="bg-white border-b border-slate-200 px-6 py-2.5 shadow-sm shrink-0">
          <div className="w-full flex items-center justify-between">
            <div className="text-[13px] font-bold text-slate-800">
              <span className="text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-100">{activePart.title || `Passage ${activePartIndex + 1}`}</span>
              {questionNumbers.length > 0 && <span className="text-slate-500 font-medium ml-2">Questions {questionNumbers[0]}–{questionNumbers[questionNumbers.length - 1]}</span>}
            </div>
            <div className="flex gap-2">
              {safeParts.map((_: any, idx: number) => (
                <button
                  key={idx}
                  onClick={() => setActivePartIndex(idx)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activePartIndex === idx ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                >
                  Passage {idx + 1}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Split View */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel: Passage */}
          <div 
            key={`passage-panel-${activePartIndex}`}
            className="w-1/2 overflow-y-auto bg-white border-r border-slate-300 p-10 custom-scrollbar relative" 
            ref={passageRef}
            onDoubleClick={handleDoubleClick}
          >
            <SelectionHighlighter containerRef={passageRef} />
            {activePart.topic && <h2 className="text-3xl font-black text-slate-900 mb-8 tracking-tight">{activePart.topic}</h2>}
            <div
              className="prose prose-slate max-w-none text-[16px] leading-[1.8] text-slate-800 font-serif"
              dangerouslySetInnerHTML={{ __html: activePart.passage || '<p>No passage content available.</p>' }}
            />
          </div>

          {/* Right Panel: Questions */}
          <div key={`questions-panel-${activePartIndex}`} className="w-1/2 overflow-y-auto bg-[#f8f9fa] p-10 custom-scrollbar">
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-8 min-h-full">
              {Array.isArray(activePart.items) ? renderItems(activePart.items, answers, handleAnswer, questionRefs) : <p className="text-slate-400 italic">No questions configured for this passage.</p>}
            </div>
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="bg-white/90 backdrop-blur-md border-t border-slate-200 p-4 shrink-0 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
          <div className="max-w-full mx-auto flex items-center justify-between gap-6 px-4">
            <div className="flex items-center gap-2 overflow-x-auto p-1 flex-1 no-scrollbar">
              {safeParts.map((part: any, idx: number) => {
                const isActive = activePartIndex === idx;
                const pNumbers = getQuestionItemsFromPart(part).map((q: any) => q.id ?? q.number).filter(Boolean);
                if (isActive) {
                  return (
                    <div key={idx} className="flex items-center gap-3 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100 shadow-sm shrink-0">
                      <span className="font-bold text-xs text-emerald-700">Passage {idx + 1}</span>
                      <div className="flex gap-1">
                        {pNumbers.map((num: any) => {
                          const qKey = String(num);
                          const isAnswered = answers[qKey] && answers[qKey].trim() !== '';
                          return <button key={qKey} onClick={() => scrollToQuestion(qKey)} className={`w-7 h-7 flex items-center justify-center text-[11px] font-bold rounded-lg transition-all ${isAnswered ? 'bg-emerald-600 text-white shadow-sm' : 'bg-white text-slate-500 border border-slate-200 hover:border-emerald-300 hover:text-emerald-600 font-medium'}`}>{num}</button>;
                        })}
                      </div>
                    </div>
                  );
                }
                return (
                  <button key={idx} onClick={() => setActivePartIndex(idx)} className="flex items-center gap-2 bg-transparent hover:bg-slate-100 px-4 py-2 rounded-xl transition-all text-slate-500 shrink-0">
                    <span className="font-bold text-xs whitespace-nowrap">Passage {idx + 1}</span>
                  </button>
                );
              })}
            </div>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-slate-900 hover:bg-black text-white font-bold text-sm px-8 py-3 rounded-xl shadow-lg flex items-center gap-2 transition-all disabled:opacity-50 shrink-0"
            >
              {submitting ? 'Submitting...' : (
                <>
                  {fullTestComps?.writing ? "Writing" : "Submit Test"}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
        
        {/* Public Guest Email Prompt */}
        {showEmailPrompt && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowEmailPrompt(false)} />
            <div className="relative bg-white rounded-[2.5rem] p-10 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
               <h3 className="text-2xl font-black text-slate-800 mb-2">Finish & Receive Results</h3>
               <p className="text-slate-500 font-medium mb-8">Enter your email to receive your band score and detailed feedback.</p>
               
               <div className="space-y-4">
                 <div>
                    <label className="block text-xs font-black uppercase text-slate-400 tracking-widest ml-1 mb-2">Your Email Address</label>
                    <input 
                      type="email"
                      required
                      placeholder="e.g. john@student.com"
                      value={publicEmail}
                      onChange={(e) => setPublicEmail(e.target.value)}
                      className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none transition-all font-bold"
                    />
                 </div>
                 <button 
                  onClick={() => {
                    if (publicEmail.includes('@') && publicEmail.includes('.')) {
                      setShowEmailPrompt(false);
                      performSubmit(`guest_${Date.now()}`, 'Guest Student', publicEmail, false, 'Bondify');
                    } else {
                      alert('Please enter a valid email address.');
                    }
                  }}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 rounded-2xl shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
                 >
                   Send My Results <ArrowRight className="w-5 h-5" />
                 </button>
               </div>
            </div>
          </div>
        )}

        <style jsx>{`
          .no-scrollbar::-webkit-scrollbar { display: none; }
          .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
          .custom-scrollbar::-webkit-scrollbar { width: 8px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 4px; }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
        `}</style>
        <VaultToast 
            word={vaultedWord} 
            visible={showVaultToast} 
            onHide={() => setShowVaultToast(false)} 
        />
      </div>
    </ProtectedRoute>
  );
}
