"use client";

import React from 'react';
import { VocabQuestion } from '@/types/vocab';
import { Volume2 } from 'lucide-react';

interface VocabCardProps {
  question: VocabQuestion;
  onAnswer: (answer: string) => void;
  selectedAnswer?: string;
  isCorrect?: boolean;
}

export const VocabCard: React.FC<VocabCardProps> = ({ 
  question, 
  onAnswer, 
  selectedAnswer,
  isCorrect 
}) => {
  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 transition-all">
      <div className="flex justify-between items-start mb-6">
        <div>
          <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold rounded-full uppercase tracking-wider">
            {question.questionType.replace('_', ' ')}
          </span>
          <h2 className="text-3xl font-bold mt-2 text-slate-800 dark:text-white flex items-center gap-3">
            {question.word}
            <button 
              onClick={() => speak(question.word)}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
            >
              <Volume2 className="w-5 h-5 text-slate-400" />
            </button>
          </h2>
        </div>
        <div className="text-right">
          <span className="text-sm text-slate-400 font-medium">Difficulty Lvl {question.difficulty}</span>
        </div>
      </div>

      <div className="mb-8">
        <p className="text-xl text-slate-600 dark:text-slate-300 leading-relaxed italic">
          "{question.question}"
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {question.options.map((option, idx) => {
          let btnClass = "p-4 text-left rounded-2xl border-2 transition-all font-medium text-lg ";
          
          if (selectedAnswer === option) {
            if (isCorrect) {
              btnClass += "border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400";
            } else {
              btnClass += "border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400";
            }
          } else if (selectedAnswer && option === question.correctAnswer) {
            btnClass += "border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400";
          } else {
            btnClass += "border-slate-200 dark:border-slate-800 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10 text-slate-700 dark:text-slate-400";
          }

          return (
            <button
              key={idx}
              disabled={!!selectedAnswer}
              onClick={() => onAnswer(option)}
              className={btnClass}
            >
              <span className="mr-3 opacity-50 shrink-0">{String.fromCharCode(65 + idx)}.</span>
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
};
