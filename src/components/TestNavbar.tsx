"use client";

import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import Link from 'next/link';

interface TestNavbarProps {
  durationMinutes: number;
  onTimeUp?: () => void;
  title?: string;
  saveStatus?: string;
}

export default function TestNavbar({ durationMinutes, onTimeUp, title, saveStatus }: TestNavbarProps) {
  const [timeLeft, setTimeLeft] = useState(durationMinutes * 60);

  useEffect(() => {
    if (timeLeft <= 0) {
      if (onTimeUp) onTimeUp();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, onTimeUp]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full sticky top-0 z-50">
      {/* Top Red Bar - IDP/British Council Style */}
      <div className="h-1.5 w-full bg-[#E31E24]" />
      
      <nav className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2 group">
            <img 
              src="/logo.png" 
              alt="Bondify Logo" 
              className="w-8 h-8 object-contain transition-transform" 
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23E31E24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>';
              }}
            />
            <span className="text-xl font-black text-slate-900 tracking-tight">Bondify</span>
          </Link>
          {title && (
            <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block" />
          )}
          {title && (
            <span className="text-sm font-bold text-slate-600 hidden sm:block uppercase tracking-wider">
              {title}
            </span>
          )}
        </div>

        <div className="flex items-center gap-4">
          {saveStatus && (
            <span className="text-xs font-semibold text-slate-500 animate-pulse">
              {saveStatus}
            </span>
          )}
          <div className="flex items-center gap-2 px-4 py-1.5 bg-slate-50 rounded-full border border-slate-200">
            <Clock className="w-4 h-4 text-slate-500" />
          <span className="tabular-nums font-bold text-slate-800 tracking-tight">
            {formatTime(timeLeft)}
          </span>
          </div>
        </div>
      </nav>
    </div>
  );
}
