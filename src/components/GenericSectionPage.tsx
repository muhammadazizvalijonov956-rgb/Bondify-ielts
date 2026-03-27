"use client";

import TestNavbar from '@/components/TestNavbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import Link from 'next/link';

export default function GenericSectionPage({ sectionName }: { sectionName: string }) {
  const durations: Record<string, number> = {
    'Reading': 60,
    'Writing': 60,
    'Listening': 30,
    'Full Length': 165
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#f8f9fa] flex flex-col font-sans">
        <TestNavbar durationMinutes={durations[sectionName] || 60} title={`${sectionName} Practice`} />
        
        <div className="flex-1 max-w-4xl mx-auto px-4 py-20 text-center">
          <div className="bg-white border border-slate-200 rounded-3xl p-12 shadow-sm">
            <h1 className="text-4xl font-extrabold text-slate-800 mb-6">{sectionName} Practice</h1>
            <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
              We are currently preparing the <span className="font-bold text-blue-600">{sectionName}</span> section. 
              Our team is working hard to bring you the highest quality practice material.
            </p>
            <Link
              href="/"
              className="inline-block bg-slate-900 hover:bg-black text-white font-bold py-4 px-10 rounded-2xl shadow-lg transition-all hover:-translate-y-0.5"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
