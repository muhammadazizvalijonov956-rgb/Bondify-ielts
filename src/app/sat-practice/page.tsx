"use client";

import React from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { BookOpen, Calculator, ExternalLink, Sparkles, GraduationCap, ChevronRight, Layout, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function SATPracticePage() {
  const { user, loading: authLoading } = useAuth();

  const tests = [
    {
      id: 'rw-march-2026',
      title: 'RW TEST — MARCH 2026',
      questions: 469,
      type: 'Reading & Writing',
      icon: <BookOpen className="w-6 h-6 text-blue-500" />,
      color: 'blue',
      url: 'https://bluebooky.com/' // Direct links might be session based, so linking to main site
    },
    {
      id: 'math-march-2026',
      title: 'MATH TEST — MARCH 2026',
      questions: 204,
      type: 'Mathematics',
      icon: <Calculator className="w-6 h-6 text-indigo-500" />,
      color: 'indigo',
      url: 'https://bluebooky.com/'
    },
    {
      id: 'rw-dec-2025',
      title: 'RW TEST — DECEMBER 2025',
      questions: 420,
      type: 'Reading & Writing',
      icon: <BookOpen className="w-6 h-6 text-blue-500" />,
      color: 'blue',
      url: 'https://bluebooky.com/'
    }
  ];

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20">
      {/* Hero Section */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-sm font-semibold mb-4">
                <Sparkles className="w-4 h-4 fill-blue-500" />
                Adaptive SAT Training
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-4">
                Master the Digital SAT with <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Bluebooky</span>
              </h1>
              <p className="text-lg text-slate-600 font-medium">
                Access premium adaptive mock exams, section-specific tests, and a comprehensive question bank.
                Everything you need to boost your score to the 1500+ range.
              </p>
            </div>
            <div className="hidden lg:block">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative bg-white p-6 rounded-2xl border border-slate-200 shadow-xl flex items-center gap-4">
                  <div className="bg-green-100 p-3 rounded-xl">
                    <GraduationCap className="w-8 h-8 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-500 uppercase">Avg. Improvement</p>
                    <p className="text-2xl font-black text-slate-900">+180 Points</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900">Available Practice Tests</h2>
            <p className="text-slate-500 font-medium">Latest adaptive exams for 2025-2026</p>
          </div>
          <a
            href="https://bluebooky.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-blue-600 font-bold hover:text-blue-700 transition-colors"
          >
            Visit Full Platform <ExternalLink className="w-4 h-4" />
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {tests.map((test) => (
            <div
              key={test.id}
              className="group bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all duration-300 overflow-hidden flex flex-col"
            >
              <div className="p-6 flex-1">
                <div className="flex items-start justify-between mb-6">
                  <div className="p-3 bg-slate-50 rounded-xl group-hover:bg-blue-50 transition-colors">
                    {test.icon}
                  </div>
                  <span className="bg-slate-100 text-slate-700 text-[10px] px-2.5 py-1 rounded-md font-black uppercase tracking-wider border border-slate-200">
                    {test.questions} Questions
                  </span>
                </div>

                <h3 className="text-xl font-extrabold text-slate-900 mb-2 leading-tight">
                  {test.title}
                </h3>
                <p className="text-slate-500 text-sm font-bold uppercase tracking-wide mb-6">
                  {test.type}
                </p>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    Adaptive Questioning
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    Instant Score Report
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    Detailed Explanations
                  </div>
                </div>
              </div>

              <div className="p-6 pt-0">
                <a
                  href={test.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-200"
                >
                  {test.id.includes('rw') ? 'RESUME EXAM' : 'START EXAM'}
                  <ChevronRight className="w-5 h-5" />
                </a>
              </div>
            </div>
          ))}

          {/* Custom Card for More */}
          <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl p-8 flex flex-col justify-between text-white shadow-xl">
            <div>
              <Layout className="w-12 h-12 mb-6 opacity-80" />
              <h3 className="text-2xl font-black mb-2">Need More?</h3>
              <p className="text-indigo-100 font-medium">
                Bluebooky offers 50+ adaptive tests for all SAT sections including full-length simulations.
              </p>
            </div>
            <a
              href="https://bluebooky.com"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 bg-white/10 hover:bg-white/20 border border-white/20 py-4 rounded-xl font-bold text-center transition-all backdrop-blur-sm"
            >
              Browse All Tests
            </a>
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-16 bg-blue-900 rounded-[2.5rem] p-8 md:p-12 text-white overflow-hidden relative">
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-black mb-6">Why Practice SAT on Bluebooky?</h2>
              <ul className="space-y-4">
                {[
                  "Official-style adaptive algorithm",
                  "Up-to-date 2026 test patterns",
                  "Cross-platform compatibility",
                  "Comprehensive performance analytics"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 font-semibold text-blue-100">
                    <div className="w-6 h-6 rounded-full bg-blue-500/30 flex items-center justify-center text-blue-300">
                      {i + 1}
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
              <p className="italic text-lg text-blue-100 mb-4">
                "The adaptive nature of these tests perfectly mirrors the real Digital SAT experience. It's the best resource I've found for consistent practice."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center font-bold">JD</div>
                <div>
                  <p className="font-bold">James D.</p>
                  <p className="text-xs text-blue-300">Scored 1560</p>
                </div>
              </div>
            </div>
          </div>

          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600 blur-[100px] -mr-32 -mt-32 opacity-20"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-600 blur-[100px] -ml-32 -mb-32 opacity-20"></div>
        </div>
      </div>
    </div>
  );
}
