"use client";

import React from 'react';
import { Flame, Trophy, Target } from 'lucide-react';

interface VocabStatsProps {
  score: number;
  total: number;
  streak: number;
  xp: number;
  level: number;
}

export const VocabStats: React.FC<VocabStatsProps> = ({
  score,
  total,
  streak,
  xp,
  level
}) => {
  const percentage = (score / total) * 100 || 0;

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto mb-8 animate-in slide-in-from-top duration-500">
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-6 rounded-3xl shadow-xl border border-white/20 dark:border-slate-800 grid grid-cols-2 md:grid-cols-4 gap-6">
        
        <div className="flex flex-col items-center justify-center space-y-1 group">
          <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-2xl group-hover:scale-110 transition-transform">
            <Flame className="w-6 h-6 text-red-500 fill-red-500" />
          </div>
          <span className="text-2xl font-black text-slate-800 dark:text-white">{streak}</span>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Streak 🔥</span>
        </div>

        <div className="flex flex-col items-center justify-center space-y-1 group">
          <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-2xl group-hover:scale-110 transition-transform">
            <Trophy className="w-6 h-6 text-yellow-500" />
          </div>
          <span className="text-2xl font-black text-slate-800 dark:text-white">{xp}</span>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Points 🏆</span>
        </div>

        <div className="flex flex-col items-center justify-center space-y-1 group">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-2xl group-hover:scale-110 transition-transform">
            <Target className="w-6 h-6 text-blue-500" />
          </div>
          <span className="text-2xl font-black text-slate-800 dark:text-white">{score}/{total}</span>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Session 📉</span>
        </div>

        <div className="flex flex-col items-center justify-center space-y-1 group">
          <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-2xl group-hover:scale-110 transition-transform">
            <span className="text-xl">🎓</span>
          </div>
          <span className="text-2xl font-black text-slate-800 dark:text-white">Lvl {level}</span>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Difficulty ⭐</span>
        </div>
      </div>

      <div className="relative h-4 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
        <div 
          className="absolute h-full bg-gradient-to-r from-blue-600 via-purple-500 to-indigo-500 transition-all duration-700 ease-out flex items-center justify-end pr-2"
          style={{ width: `${percentage}%` }}
        >
          <div className="h-2 w-2 bg-white rounded-full animate-pulse shadow-glow" />
        </div>
      </div>
    </div>
  );
};
