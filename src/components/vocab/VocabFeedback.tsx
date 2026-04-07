"use client";

import React from 'react';
import { VocabQuestion } from '@/types/vocab';
import { Check, X, ArrowRight, Lightbulb } from 'lucide-react';

interface VocabFeedbackProps {
  question: VocabQuestion;
  selectedAnswer: string;
  onNext: () => void;
}

export const VocabFeedback: React.FC<VocabFeedbackProps> = ({
  question,
  selectedAnswer,
  onNext
}) => {
  const isCorrect = selectedAnswer === question.correctAnswer;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 transition-all animate-in fade-in zoom-in duration-300">
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-8 relative border border-slate-200 dark:border-slate-800">
        
        <div className="flex flex-col items-center mb-8">
          <div className={`p-4 rounded-full mb-4 ${isCorrect ? 'bg-green-100 dark:bg-green-900/30 text-green-600' : 'bg-red-100 dark:bg-red-900/30 text-red-600'}`}>
            {isCorrect ? <Check className="w-12 h-12" /> : <X className="w-12 h-12" />}
          </div>
          <h2 className={`text-3xl font-extrabold ${isCorrect ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {isCorrect ? 'Outstanding!' : 'Not Quite!'}
          </h2>
        </div>

        {!isCorrect && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-100 dark:border-red-900/20">
            <span className="text-sm font-bold text-red-500 uppercase tracking-widest block mb-1">Correct Answer</span>
            <span className="text-xl font-bold text-red-700 dark:text-red-300">{question.correctAnswer}</span>
          </div>
        )}

        <div className="space-y-6">
          <div className="flex gap-4">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl shrink-0 h-fit">
              <Lightbulb className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white text-lg">Detailed Explanation</h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed italic">
                {question.explanation}
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-xl shrink-0 h-fit">
              <span className="text-xl">✍️</span>
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white text-lg">In Context</h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-semibold">
                "{question.exampleSentence}"
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={onNext}
          className="w-full mt-10 py-5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xl rounded-2xl flex items-center justify-center gap-3 transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-xl hover:shadow-blue-500/30"
        >
          Next Question
          <ArrowRight className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};
