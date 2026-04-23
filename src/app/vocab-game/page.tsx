"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { VocabCard } from '@/components/vocab/VocabCard';
import { VocabFeedback } from '@/components/vocab/VocabFeedback';
import { VocabStats } from '@/components/vocab/VocabStats';
import { DailySession, VocabQuestion } from '@/types/vocab';
import { getDailySession, saveDailySession, getWeakWords, getReviewQueue, updateWordProgress, getUserVocabLevel, completeDailySession } from '@/lib/firebase/vocab-db';
import { Loader2, Sparkles, Trophy, ArrowRight, RefreshCcw } from 'lucide-react';

export default function VocabGamePage() {
  const { user, profile, loading: authLoading } = useAuth();
  const [session, setSession] = useState<DailySession | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedAnswer, setSelectedAnswer] = useState<string | undefined>(undefined);
  const [showFeedback, setShowFeedback] = useState(false);
  const [streak, setStreak] = useState(0);
  const [xp, setXp] = useState(0);

  useEffect(() => {
    if (!authLoading && user) {
      loadOrCreateSession();
    }
  }, [user, authLoading]);

  const loadOrCreateSession = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      let currentSession = await getDailySession(user.uid, today);

      if (!currentSession) {
        // Build session logic
        const level = await getUserVocabLevel(user.uid);
        const weakWords = await getWeakWords(user.uid, 10);
        const reviewWords = await getReviewQueue(user.uid, 5);
        
        const count = level === 1 ? 25 : level === 2 ? 35 : 45;
        
        // Call API to generate questions
        const response = await fetch('/api/vocab/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    count, 
    level, 
    weakWords: [...weakWords, ...reviewWords],
    sessionId: `${user.uid}_${today}` 
  })
});

const data = await response.json(); // ONLY ONE OF THESE

if (!response.ok || !data.questions) {
  throw new Error(data.error || "AI generation failed");
}
        
        currentSession = {
          id: `${user.uid}_${today}`,
          userId: user.uid,
          date: today,
          questions: data.questions,
          currentIndex: 0,
          score: 0,
          completed: false,
          level: level,
          weakWordsGenerated: weakWords
        };
        
        await saveDailySession(currentSession);
      }

      setSession(currentSession);
      setStreak(profile?.currentStreak || 0);
      setXp(profile?.tokenBalance || 0); // Using tokens as XP for demo
    } catch (error) {
      console.error("Error loading session:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = async (answer: string) => {
    if (!session || selectedAnswer) return;

    setSelectedAnswer(answer);
    const question = session.questions[session.currentIndex];
    const isCorrect = answer === question.correctAnswer;

    // Update session locally
    const updatedSession = { ...session };
    if (isCorrect) {
      updatedSession.score += 1;
      setStreak(s => s + 1);
      setXp(x => x + 10);
    } else {
      setStreak(0);
    }

    // Update Firestore progress for the word
    await updateWordProgress(user!.uid, question.word, isCorrect, question.difficulty);
    
    setSession(updatedSession);
    setShowFeedback(true);
  };

  const handleNext = async () => {
    if (!session) return;

    const nextIndex = session.currentIndex + 1;
    const isCompleted = nextIndex >= session.questions.length;

    const updatedSession = {
       ...session,
       currentIndex: nextIndex,
       completed: isCompleted
    };

    setSession(updatedSession);
    if (isCompleted) {
      await completeDailySession(updatedSession);
    } else {
      await saveDailySession(updatedSession);
    }
    
    setSelectedAnswer(undefined);
    setShowFeedback(false);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
        <Loader2 className="w-16 h-16 text-blue-600 animate-spin mb-4" />
        <h2 className="text-3xl font-black text-slate-800 dark:text-white animate-pulse">Personalizing Your Daily Session...</h2>
        <p className="text-slate-400 font-medium mt-4">AI is selecting words for your current level</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
        <h2 className="text-2xl font-bold mb-4">Please log in to play the Vocabulary Game</h2>
        <a href="/login" className="px-6 py-3 bg-blue-600 text-white rounded-xl">Go to Login</a>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
        <RefreshCcw className="w-12 h-12 text-slate-400 mb-4 cursor-pointer" onClick={loadOrCreateSession} />
        <h2 className="text-2xl font-bold">Failed to load session</h2>
        <button onClick={loadOrCreateSession} className="mt-4 text-blue-500">Try Again</button>
      </div>
    );
  }

  if (session.completed) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col p-4">
        <div className="flex-1 flex flex-col items-center justify-center max-w-4xl mx-auto w-full">
          <div className="bg-white dark:bg-slate-900 p-12 rounded-[3rem] shadow-2xl border border-slate-200 dark:border-slate-800 text-center w-full transform hover:scale-[1.01] transition-all">
            <div className="w-24 h-24 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce">
              <Trophy className="w-12 h-12 text-yellow-600" />
            </div>
            <h1 className="text-5xl font-black text-slate-800 dark:text-white mb-2">Daily Session Complete!</h1>
            <p className="text-xl text-slate-400 mb-10 font-medium uppercase tracking-widest">You're getting smarter every day</p>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-12">
               <div className="bg-slate-100 dark:bg-slate-800/50 p-6 rounded-3xl">
                  <span className="block text-sm font-bold text-slate-400 uppercase mb-1">Score</span>
                  <span className="text-4xl font-black text-blue-600 dark:text-blue-400">{session.score}/{session.questions.length}</span>
               </div>
               <div className="bg-slate-100 dark:bg-slate-800/50 p-6 rounded-3xl">
                  <span className="block text-sm font-bold text-slate-400 uppercase mb-1">XP Earned</span>
                  <span className="text-4xl font-black text-purple-600 dark:text-purple-400">+{session.score * 10}</span>
               </div>
               <div className="bg-slate-100 dark:bg-slate-800/50 p-6 rounded-3xl col-span-2 md:col-span-1">
                  <span className="block text-sm font-bold text-slate-400 uppercase mb-1">Accuracy</span>
                  <span className="text-4xl font-black text-green-600 dark:text-green-400">{Math.round((session.score / session.questions.length) * 100)}%</span>
               </div>
            </div>

            <button 
              onClick={() => window.location.href = '/learn'}
              className="px-12 py-6 bg-slate-800 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-2xl flex items-center justify-center gap-4 mx-auto hover:opacity-90 transition-all shadow-xl"
            >
              Back to Dashboard
              <ArrowRight className="w-8 h-8" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = session.questions[session.currentIndex];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      
      <main className="flex-1 p-4 md:p-12 overflow-y-auto">
        <div className="max-w-4xl mx-auto flex flex-col h-full">
          
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
             <div>
                <h1 className="text-4xl font-black text-slate-800 dark:text-white flex items-center gap-3">
                  AI Vocab Builder <Sparkles className="text-yellow-500 fill-yellow-500" />
                </h1>
                <p className="text-slate-400 font-bold uppercase tracking-widest text-sm mt-1">Adaptive Learning Engine</p>
             </div>
             <div className="bg-blue-600 text-white px-6 py-2 rounded-2xl font-black shadow-lg shadow-blue-500/30">
               Question {session.currentIndex + 1} of {session.questions.length}
             </div>
          </header>

          <VocabStats 
            score={session.score} 
            total={session.questions.length} 
            streak={streak} 
            xp={xp} 
            level={session.level}
          />

          <div className="flex-1 flex items-center justify-center py-8">
            <VocabCard 
              question={currentQuestion} 
              onAnswer={handleAnswer} 
              selectedAnswer={selectedAnswer}
              isCorrect={selectedAnswer === currentQuestion.correctAnswer}
            />
          </div>

          {showFeedback && selectedAnswer && (
            <VocabFeedback 
              question={currentQuestion}
              selectedAnswer={selectedAnswer}
              onNext={handleNext}
            />
          )}

        </div>
      </main>
    </div>
  );
}
