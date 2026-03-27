"use client";

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { db } from '@/lib/firebase/config';
import { doc, getDoc, setDoc, updateDoc, increment, collection, query, limit, getDocs } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import { Trophy, Star, ArrowRight, Zap, Target } from 'lucide-react';
import TestNavbar from '@/components/TestNavbar';

import { getDailyQuestions, DailyQuestion } from '@/lib/data/daily-questions';

export default function DailyChallengePage() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [questions, setQuestions] = useState<DailyQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState<{ score: number, streak: number } | null>(null);
  const [canRetry, setCanRetry] = useState(false);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setQuestions(getDailyQuestions(today));

    if (profile?.lastChallengeDate === today && !results) {
        setCanRetry(true);
    }
  }, [profile, results]);

  const handleRetryWithToken = async () => {
    if (!profile) return;
    if (profile.tokenBalance < 1) {
        alert("Not enough tokens!");
        return;
    }
    setSubmitting(true);
    try {
        await updateDoc(doc(db, 'users', profile.uid), {
            tokenBalance: increment(-1)
        });
        setCanRetry(false);
    } catch (err) {
        alert("Failed to use token.");
    }
    setSubmitting(false);
  };

  if (canRetry) {
    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
            <div className="bg-white rounded-[3rem] p-10 shadow-2xl border border-slate-100 max-w-md text-center">
                <div className="w-20 h-20 bg-amber-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                    <Zap className="w-10 h-10 text-amber-500 fill-amber-500" />
                </div>
                <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Challenge Done!</h2>
                <p className="text-slate-500 font-medium mb-8 leading-relaxed">
                    You've already secured your streak for today. Want to try again to improve your score?
                </p>
                <div className="space-y-3">
                    <button 
                        onClick={handleRetryWithToken}
                        disabled={submitting}
                        className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl hover:bg-black transition-all flex items-center justify-center gap-2"
                    >
                        {submitting ? 'Processing...' : 'Retry for 1 Token'}
                    </button>
                    <button 
                        onClick={() => router.push('/')}
                        className="w-full bg-slate-100 text-slate-600 font-bold py-4 rounded-2xl hover:bg-slate-200 transition-colors"
                    >
                        Back to Home
                    </button>
                </div>
            </div>
        </div>
    );
  }

  const handleSubmit = async () => {
    if (!user || !profile) return;
    setSubmitting(true);

    let correctCount = 0;
    questions.forEach(q => {
        if (answers[q.id]?.toLowerCase().trim() === q.correct.toLowerCase().trim()) {
            correctCount++;
        }
    });

    const today = new Date().toISOString().split('T')[0];
    const newStreak = (profile.currentStreak || 0) + 1;

    try {
        // Update User Profile
        await updateDoc(doc(db, 'users', user.uid), {
            lastChallengeDate: today,
            lastActiveDate: new Date().toISOString(),
            currentStreak: newStreak,
            tokenBalance: increment(5) // Reward for daily challenge
        });

        // Save Attempt
        const attemptId = `daily_${today}_${user.uid}`;
        await setDoc(doc(db, 'attempts', attemptId), {
            id: attemptId,
            userId: user.uid,
            section: 'daily_challenge',
            submittedAt: new Date().toISOString(),
            rawScore: correctCount,
            maxScore: questions.length,
            normalizedScore: Math.floor((correctCount / questions.length) * 40),
            estimatedBand: (correctCount / questions.length) * 9,
            userDisplayName: profile.username
        });

        setResults({ score: correctCount, streak: newStreak });
    } catch (err) {
        console.error("Failed to submit daily challenge", err);
        alert("Submission failed. Please try again.");
    } finally {
        setSubmitting(false);
    }
  };

  if (results) {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-full max-w-lg bg-white rounded-[3rem] p-12 shadow-2xl border border-slate-100 relative overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-amber-400 to-rose-500"></div>
                <Trophy className="w-20 h-20 text-amber-500 mx-auto mb-6 drop-shadow-lg" />
                <h1 className="text-4xl font-black text-slate-900 mb-2">Challenge Complete!</h1>
                <p className="text-slate-500 font-medium mb-8">You've mastered today's micro-tasks.</p>
                
                <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Score</p>
                        <p className="text-3xl font-black text-slate-900">{results.score} <span className="text-sm text-slate-400">/ {questions.length}</span></p>
                    </div>
                    <div className="bg-rose-50 p-6 rounded-3xl border border-rose-100">
                        <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-1">New Streak</p>
                        <p className="text-3xl font-black text-rose-600 flex items-center justify-center gap-2">
                           <Zap className="w-6 h-6 fill-rose-600" /> {results.streak}
                        </p>
                    </div>
                </div>

                <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 text-emerald-700 font-bold text-sm mb-8 flex items-center justify-center gap-2">
                    <Target className="w-4 h-4" /> REWARD: +5 TOKENS ADDED
                </div>

                <button 
                  onClick={() => router.push('/')}
                  className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl hover:bg-black transition-all flex items-center justify-center gap-2 group shadow-xl"
                >
                    Back to Dashboard <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
            </div>
        </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-white flex flex-col font-sans">
        <TestNavbar title="Daily Micro-Challenge" durationMinutes={5} />
        
        <div className="flex-1 max-w-3xl mx-auto w-full px-6 py-12">
            <div className="mb-12">
                <div className="flex items-center gap-2 text-primary-600 font-black text-xs uppercase tracking-widest mb-2">
                    <Star className="w-4 h-4 fill-primary-600" /> Today's Mission
                </div>
                <h1 className="text-4xl font-black text-slate-900 tracking-tight">Rapid Skills Check</h1>
                <p className="text-slate-500 font-medium mt-2">Finish all 10 questions to secure your streak bonus.</p>
            </div>

            <div className="space-y-8">
                {questions.map((q, idx) => (
                    <div key={q.id} className="p-8 rounded-[2rem] bg-slate-50 border border-slate-100 hover:border-primary-200 transition-colors">
                        <div className="flex items-start gap-4">
                            <span className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center font-black text-slate-400 shrink-0 shadow-sm">{idx + 1}</span>
                            <div className="flex-1">
                                <label className="text-lg font-bold text-slate-800 mb-4 block leading-snug">{q.label}</label>
                                <input 
                                    type="text"
                                    value={answers[q.id] || ''}
                                    onChange={(e) => setAnswers({...answers, [q.id]: e.target.value})}
                                    placeholder="Type your answer..."
                                    className="w-full px-6 py-4 bg-white border-2 border-slate-200 rounded-2xl focus:border-primary-500 outline-none transition-all font-bold text-slate-800 shadow-sm"
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <button 
                onClick={handleSubmit}
                disabled={submitting || Object.keys(answers).length < questions.length}
                className="mt-12 w-full bg-primary-600 text-white font-black py-5 rounded-[2rem] text-xl shadow-2xl shadow-primary-500/30 hover:bg-primary-700 hover:-translate-y-1 active:translate-y-0 transition-all disabled:opacity-50 disabled:translate-y-0 disabled:shadow-none"
            >
                {submitting ? 'Verifying Results...' : 'Submit Challenge'}
            </button>
        </div>
      </div>
    </ProtectedRoute>
  );
}
