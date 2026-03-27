"use client";

import { useEffect, useState, useRef } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { db } from '@/lib/firebase/config';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import { ArrowRight, Volume2 } from 'lucide-react';
import TestNavbar from '@/components/TestNavbar';
import SelectionHighlighter from '@/components/SelectionHighlighter';

function calculateBandScore(rawScore: number) {
  if (rawScore <= 0) return 0.0;
  if (rawScore >= 39) return 9.0;
  if (rawScore >= 37) return 8.5;
  if (rawScore >= 35) return 8.0;
  if (rawScore >= 32) return 7.5;
  if (rawScore >= 30) return 7.0;
  if (rawScore >= 26) return 6.5;
  if (rawScore >= 23) return 6.0;
  if (rawScore >= 18) return 5.5;
  if (rawScore >= 16) return 5.0;
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
  questionRefs: React.MutableRefObject<{ [key: string]: HTMLDivElement | null }>
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
                      {checked && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 12 12"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
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
              className="px-2 py-0.5 border border-slate-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-bold text-blue-700 min-w-[80px]"
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
                      {/* Handle [q:number] placeholders in cell content */}
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

function renderOldQuestion(q: any, answers: Record<string, string>, onAnswer: (id: string, val: string) => void, questionRefs: React.MutableRefObject<{ [key: string]: HTMLDivElement | null }>) {
  const qKey = getQuestionKey(q);
  if (!q.text) return null;
  const parts = q.text.split('[blank]');
  const InputEl = () => (
    <span className="inline-flex items-center mx-1 align-middle">
      <span className="inline-flex items-center justify-center w-[1.375rem] h-[1.375rem] border border-black text-[11px] font-bold bg-white -mr-px z-10">{q.number}</span>
      <input type="text" value={answers[qKey] || ''} onChange={(e) => onAnswer(qKey, e.target.value)} className="px-2 py-[2px] border border-black w-32 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm h-[1.375rem]" autoComplete="off" />
    </span>
  );
  if (parts.length > 1) {
    return (
      <span className="text-[13px] text-black">
        {parts.map((partText: string, idx: number) => <span key={idx}>{partText}{idx < parts.length - 1 && <InputEl />}</span>)}
      </span>
    );
  }
  return (
    <div ref={(el) => { questionRefs.current[qKey] = el; }} className="mb-4">
      <div className="text-[13px] mb-2 flex items-start gap-2">
        <span className="inline-flex items-center justify-center min-w-[1.375rem] h-[1.375rem] border border-black text-[11px] font-bold bg-white mt-0.5">{q.number}</span>
        {q.text}
      </div>
      {q.type === 'multiple_choice' ? (
        <div className="space-y-1 ml-7">
          {q.options?.map((opt: string, i: number) => (
            <label key={i} className="flex items-center gap-2 cursor-pointer text-[13px]">
              <input type="radio" name={`q_${qKey}`} value={opt} checked={answers[qKey] === opt} onChange={(e) => onAnswer(qKey, e.target.value)} className="w-3.5 h-3.5 border-black text-black" />
              <span>{opt}</span>
            </label>
          ))}
        </div>
      ) : (
        <input type="text" value={answers[qKey] || ''} onChange={(e) => onAnswer(qKey, e.target.value)} className="ml-7 px-2 py-1 border border-black w-64 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm h-7" />
      )}
    </div>
  );
}

export default function TakingListeningTest() {
  const [test, setTest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [activePartIndex, setActivePartIndex] = useState(0);
  const router = useRouter();
  const params = useParams();
  const { user, profile } = useAuth();
  const searchParams = useSearchParams();
  const fullTestId = searchParams.get('fullTestId');
  const [fullTestComps, setFullTestComps] = useState<any>(null);
  const questionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchTest() {
      const id = params.id as string;
      if (!id) return;
      try {
        const snap = await getDoc(doc(db, 'tests', id));
        if (snap.exists()) setTest({ id: snap.id, ...snap.data() });
      } catch (err) {
        console.error("Error fetching test:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchTest();
  }, [params.id]);

  useEffect(() => {
    if (fullTestId) {
      const fetchFullConfig = async () => {
        const snap = await getDoc(doc(db, 'tests', fullTestId as string));
        if (snap.exists()) setFullTestComps(snap.data().fullTestComponents);
      };
      fetchFullConfig();
    }
  }, [fullTestId]);

  const handleAnswer = (qId: string, value: string) => { setAnswers(prev => ({ ...prev, [qId]: value })); };

  const handleSubmit = async () => {
    if (!user || !test) return;
    if (!confirm("Are you sure you want to finish the test?")) return;
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
          // Support multiple correct options separated by slash
          const validAnswers = correctAnswer.split('/').map((a: string) => a.trim().toLowerCase());
          const isCorrect = validAnswers.includes(userAnswer.toLowerCase());
          
          if (isCorrect) correctCount++;
          questionResults.push({ id: key, number: q.id ?? q.number, label: q.label || q.text || '', userAnswer, correctAnswer, isCorrect, partTitle: part.title || '' });
        }
      });
    });

    const normalizedRawScore = maxScore > 0 ? Math.floor((correctCount / maxScore) * 40) : 0;
    const band = calculateBandScore(normalizedRawScore);
    const attemptId = `att_${Date.now()}`;
    const attempt = { 
      id: attemptId, 
      userId: user.uid, 
      testId: test.id, 
      testTitle: test.title || '', 
      section: 'listening', 
      startedAt: new Date().toISOString(), 
      submittedAt: new Date().toISOString(), 
      rawScore: correctCount, 
      maxScore, 
      normalizedScore: normalizedRawScore, 
      estimatedBand: band, 
      questionResults,
      userDisplayName: profile?.username || user.displayName || 'Anonymous Student',
      userPhoto: profile?.profilePhotoUrl || user.photoURL || ''
    };
    try {
      await setDoc(doc(db, 'attempts', attemptId), attempt);
      
      if (fullTestComps?.reading) {
        router.push(`/reading/${fullTestComps.reading}?fullTestId=${fullTestId}&l=${attemptId}`);
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

  if (loading) return <ProtectedRoute><div className="min-h-screen flex items-center justify-center font-bold text-slate-500">Loading Test Environment...</div></ProtectedRoute>;
  if (!test) return <ProtectedRoute><div className="min-h-screen flex items-center justify-center font-bold text-slate-500">Test not found.</div></ProtectedRoute>;

  const safeParts = Array.isArray(test.parts) ? test.parts : (test.parts ? Object.values(test.parts) : []);
  const activePart: any = safeParts[activePartIndex] || {};
  const isNewSchema = Array.isArray(activePart.items);
  const questionItems = getQuestionItemsFromPart(activePart);
  const questionNumbers = questionItems.map((q: any) => q.id ?? q.number).filter(Boolean);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#f8f9fa] flex flex-col font-sans selection:bg-blue-200">
        <TestNavbar durationMinutes={30} title="Listening Practice" />
        <div className="bg-white border-b border-slate-200 sticky top-[60px] z-40 w-full px-6 py-2.5 shadow-sm">
          <div className="w-full max-w-6xl mx-auto flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="text-[13px] font-bold text-slate-800">
                <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">{activePart.title || `Part ${activePartIndex + 1}`}</span>
                {questionNumbers.length > 0 && <span className="text-slate-500 font-medium ml-2">Questions {questionNumbers[0]}–{questionNumbers[questionNumbers.length - 1]}</span>}
              </div>
            </div>
            {(activePart.audioUrl || test.audioUrl) && (
              <div className="w-full relative rounded-xl border border-slate-200 bg-slate-50/50 flex items-center overflow-hidden">
                <audio key={activePart.audioUrl || activePartIndex} controls className="w-full h-[36px] outline-none" controlsList="nodownload" src={activePart.audioUrl || test.audioUrl} />
              </div>
            )}
          </div>
        </div>
        <div className="flex-1 w-full max-w-6xl mx-auto px-6 py-6 pb-32">
          {(activePart.instruction || activePart.instructions || test.instructions) && (
            <div className="mb-5">
              <p className="italic text-[13px] text-slate-600 mb-1">{activePart.instruction || activePart.instructions || test.instructions}</p>
              <p className="font-bold text-[13px] text-black">Write ONE WORD AND/OR A NUMBER for each answer.</p>
            </div>
          )}
          <div className="bg-white border border-slate-300 rounded-sm p-8 min-h-[500px] relative" ref={contentRef}>
            <SelectionHighlighter containerRef={contentRef} />
            {isNewSchema ? renderItems(activePart.items, answers, handleAnswer, questionRefs) : (
              <>
                {activePart.topic && <h2 className="font-bold text-[15px] text-black mb-6">{activePart.topic}</h2>}
                <div className="space-y-4">{questionItems.map((q: any) => <div key={getQuestionKey(q)} className="leading-relaxed">{renderOldQuestion(q, answers, handleAnswer, questionRefs)}</div>)}</div>
              </>
            )}
          </div>
        </div>
        <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-slate-200/50 shadow-[0_-8px_30px_-10px_rgba(0,0,0,0.1)] p-4 z-50">
          <div className="max-w-6xl w-full mx-auto flex items-center justify-between gap-6">
            <div className="flex items-center gap-3 overflow-x-auto p-1 flex-1">
              {safeParts.map((part: any, idx: number) => {
                const isActive = activePartIndex === idx;
                const pNumbers = getQuestionItemsFromPart(part).map((q: any) => q.id ?? q.number).filter(Boolean);
                if (isActive) {
                  return (
                    <div key={idx} className="flex items-center gap-3 bg-white px-5 py-2.5 rounded-2xl shadow-sm border border-slate-100 ring-1 ring-slate-200 shrink-0">
                      <span className="font-extrabold text-sm text-slate-800 shrink-0">{part.title || `Part ${idx + 1}`}</span>
                      <div className="flex gap-1.5 flex-wrap">
                        {pNumbers.map((num: any) => {
                          const qKey = String(num);
                          const isAnswered = answers[qKey] && answers[qKey].trim() !== '';
                          return <button key={qKey} onClick={() => scrollToQuestion(qKey)} className={`w-8 h-8 flex items-center justify-center text-[13px] font-bold rounded-xl transition-all duration-200 hover:scale-105 ${isAnswered ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 border border-blue-600' : 'bg-slate-50 text-slate-500 border border-slate-200 hover:bg-slate-100 hover:text-slate-800'}`}>{num}</button>;
                        })}
                      </div>
                    </div>
                  );
                }
                return <button key={idx} onClick={() => setActivePartIndex(idx)} className="flex items-center gap-2 bg-transparent hover:bg-white px-5 py-2.5 rounded-2xl transition-all duration-300 border border-transparent hover:border-slate-200 hover:shadow-sm text-slate-500 hover:text-slate-800 group shrink-0"><span className="font-bold text-sm">{part.title || `Part ${idx + 1}`}</span><span className="text-xs font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">{pNumbers.length} Qs</span></button>;
              })}
            </div>
            <div className="shrink-0 flex items-center gap-4">
              <div className="w-px h-8 bg-slate-200 hidden md:block"></div>
              <button onClick={handleSubmit} disabled={submitting} className="bg-slate-900 hover:bg-black text-white font-bold text-sm px-8 py-3.5 rounded-xl shadow-lg shadow-slate-900/20 flex items-center gap-2 group transition-all duration-300 disabled:opacity-50 hover:-translate-y-0.5">
                {submitting ? 'Submitting...' : (
                  <>
                    {fullTestComps?.reading ? "Reading" : "Submit Test"} 
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
