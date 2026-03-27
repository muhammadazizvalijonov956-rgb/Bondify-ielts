"use client";

import { useEffect, useState, useRef } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { db } from '@/lib/firebase/config';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import TestNavbar from '@/components/TestNavbar';
import SelectionHighlighter from '@/components/SelectionHighlighter';

function countWords(text: string) {
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

export default function TakingWritingTest() {
  const [test, setTest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [responses, setResponses] = useState<Record<number, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [activePartIndex, setActivePartIndex] = useState(0);
  const router = useRouter();
  const params = useParams();
  const { user, profile } = useAuth();
  const searchParams = useSearchParams();
  const fullTestId = searchParams.get('fullTestId');
  const [fullTestComps, setFullTestComps] = useState<any>(null);
  const instructionRef = useRef<HTMLDivElement>(null);

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
      const id = params.id as string;
      if (!id) return;
      try {
        const snap = await getDoc(doc(db, 'tests', id));
        if (snap.exists()) {
          const data = { id: snap.id, ...snap.data() };
          setTest(data);
        }
      } catch (err) {
        console.error("Error fetching test:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchTest();
  }, [params.id]);

  const handleResponseChange = (partIdx: number, value: string) => {
    setResponses(prev => ({ ...prev, [partIdx]: value }));
  };

  const handleSubmit = async () => {
    if (!user || !test) return;
    if (!confirm("Are you sure you want to finish the test?")) return;
    setSubmitting(true);

    const safeParts = Array.isArray(test.parts) ? test.parts : (test.parts ? Object.values(test.parts) : []);
    let totalWords = 0;
    const writingResults = safeParts.map((part: any, idx: number) => {
      const wCount = countWords(responses[idx] || "");
      totalWords += wCount;
      return {
        partTitle: part.title || `Part ${idx + 1}`,
        response: responses[idx] || "",
        wordCount: wCount,
        targetWords: part.targetWords || 0
      };
    });

    const isSkipped = totalWords < 20;
    const estimatedBand = isSkipped ? 0.0 : 6.0;

    const attemptId = `att_write_${Date.now()}`;
    const attempt = {
      id: attemptId,
      userId: user.uid,
      testId: test.id,
      testTitle: test.title || '',
      section: 'writing',
      startedAt: new Date().toISOString(),
      submittedAt: new Date().toISOString(),
      writingResults,
      status: 'pending_evaluation', // Writing needs manual or AI evaluation
      userDisplayName: profile?.username || user.displayName || 'Anonymous Student',
      userPhoto: profile?.profilePhotoUrl || user.photoURL || '',
      estimatedBand,
      normalizedScore: isSkipped ? 0 : 27
    };

    
    try {
      await setDoc(doc(db, 'attempts', attemptId), attempt);
      
      if (fullTestComps?.speaking) {
        let url = `/speaking/${fullTestComps.speaking}?fullTestId=${fullTestId}&w=${attemptId}`;
        const searchL = searchParams.get('l');
        const searchR = searchParams.get('r');
        if (searchL) url += `&l=${searchL}`;
        if (searchR) url += `&r=${searchR}`;
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

  if (loading) return <ProtectedRoute><div className="min-h-screen flex items-center justify-center font-bold text-slate-500">Loading Writing Test...</div></ProtectedRoute>;
  if (!test) return <ProtectedRoute><div className="min-h-screen flex items-center justify-center font-bold text-slate-500">Test not found.</div></ProtectedRoute>;

  const safeParts = Array.isArray(test.parts) ? test.parts : (test.parts ? Object.values(test.parts) : []);
  const activePart: any = safeParts[activePartIndex] || {};
  const currentResponse = responses[activePartIndex] || "";
  const wordCount = countWords(currentResponse);

  return (
    <ProtectedRoute>
      <div className="h-screen bg-[#f1f2f3] flex flex-col font-sans selection:bg-fuchsia-200 overflow-hidden">
        <TestNavbar durationMinutes={60} title="Writing Practice" />
        
        {/* Sticky Sub-header */}
        <div className="bg-white border-b border-slate-200 px-6 py-2.5 shadow-sm shrink-0">
          <div className="w-full flex items-center justify-between">
            <div className="text-[13px] font-bold text-slate-800">
              <span className="text-fuchsia-600 bg-fuchsia-50 px-2.5 py-1 rounded border border-fuchsia-100">{activePart.title || `Part ${activePartIndex + 1}`}</span>
              {activePart.targetWords && <span className="text-slate-500 font-medium ml-2">Target: at least {activePart.targetWords} words</span>}
            </div>
            <div className="flex gap-2">
               {safeParts.map((_: any, idx: number) => (
                 <button 
                  key={idx} 
                  onClick={() => setActivePartIndex(idx)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activePartIndex === idx ? 'bg-fuchsia-600 text-white shadow-md shadow-fuchsia-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                 >
                   Task {idx + 1}
                 </button>
               ))}
               <button 
                onClick={handleSubmit} 
                disabled={submitting}
                className="bg-slate-900 text-white px-6 py-1.5 rounded-lg text-xs font-bold hover:bg-black transition-colors disabled:opacity-50 ml-4 whitespace-nowrap"
               >
                {submitting ? 'Saving...' : (fullTestComps?.speaking ? "Speaking" : "Finish Test")}
               </button>
            </div>
          </div>
        </div>

        {/* Main Split View */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel: Prompt */}
          <div className="w-1/2 overflow-y-auto bg-white border-r border-slate-300 p-10 custom-scrollbar relative" ref={instructionRef}>
            <SelectionHighlighter containerRef={instructionRef} />
            
            {activePart.description && (
              <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl mb-8 text-[14px] text-slate-600 leading-relaxed font-medium">
                {activePart.description}
              </div>
            )}

            <div className="space-y-6">
              {(activePart.items || []).map((item: any, idx: number) => {
                const key = `item-${idx}`;
                if (item.type === 'heading') return <h2 key={key} className="text-xl font-bold text-slate-900 mt-6">{item.content}</h2>;
                if (item.type === 'section') return <h3 key={key} className="text-lg font-bold text-slate-700 underline underline-offset-4 mt-4">{item.content}</h3>;
                if (item.type === 'text') return <p key={key} className="text-[15px] text-slate-800 leading-[1.7]">{item.content}</p>;
                if (item.type === 'image') return (
                  <div key={key} className="my-8 space-y-3">
                    <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 shadow-inner">
                      <img src={item.imageUrl} alt={item.imageCaption || "Visual Aid"} className="max-w-full mx-auto" />
                    </div>
                    {item.imageCaption && <p className="text-center text-sm font-bold text-slate-500 italic">{item.imageCaption}</p>}
                  </div>
                );
                return null;
              })}
            </div>
          </div>

          {/* Right Panel: Editor */}
          <div className="w-1/2 flex flex-col bg-[#f8f9fa] p-10 overflow-hidden">
            <div className="flex-1 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col overflow-hidden">
              <textarea
                value={currentResponse}
                onChange={(e) => handleResponseChange(activePartIndex, e.target.value)}
                placeholder="Write your response here..."
                className="flex-1 w-full p-8 text-[16px] leading-[1.8] outline-none resize-none font-serif text-slate-800"
                spellCheck={true}
              />
              <div className="bg-slate-50 border-t border-slate-100 px-6 py-3 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-[14px] font-bold text-slate-700">
                    Word count: <span className="text-fuchsia-600 tabular-nums">{wordCount}</span>
                  </div>
                </div>
                {activePart.targetWords && wordCount < activePart.targetWords && (
                  <div className="text-[11px] font-bold text-rose-500 bg-rose-50 px-2 py-1 rounded border border-rose-100">
                    {activePart.targetWords - wordCount} more words needed
                  </div>
                )}
                {activePart.targetWords && wordCount >= activePart.targetWords && (
                  <div className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-100">
                    Minimum target met
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
