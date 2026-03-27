"use client";

import { useState, useEffect } from 'react';
import { BookMarked, Check } from 'lucide-react';

export default function VaultToast({ word, visible, onHide }: { word: string, visible: boolean, onHide: () => void }) {
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(onHide, 3000);
      return () => clearTimeout(timer);
    }
  }, [visible, onHide]);

  if (!visible) return null;

  return (
    <div className="fixed bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-slate-900/90 backdrop-blur-md text-white px-6 py-4 rounded-3xl shadow-2xl z-[9999] animate-in slide-in-from-bottom-5 duration-300">
      <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center">
        <BookMarked className="w-4 h-4 text-emerald-400" />
      </div>
      <div>
        <p className="text-[13px] font-bold">Word Vaulted!</p>
        <p className="text-[11px] text-white/50 font-medium italic">"{word}" added to your study list</p>
      </div>
      <Check className="w-5 h-5 text-emerald-400 ml-2" />
    </div>
  );
}
