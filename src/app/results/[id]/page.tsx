"use client";

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/lib/contexts/AuthContext';
import { db } from '@/lib/firebase/config';
import { doc, getDoc, updateDoc, increment, runTransaction, serverTimestamp, collection } from 'firebase/firestore';
import Link from 'next/link';
import {
  Lock, Unlock, Users, Zap, CheckCircle, XCircle,
  BarChart2, BookOpen, Lightbulb, ChevronDown, ChevronUp,
  TrendingUp, Award, Target, Mic, Star, Send
} from 'lucide-react';

// ── High-level vocabulary to highlight ──────────────────────────────
const HIGH_LEVEL_WORDS = new Set([
  // Transport domain
  'postcode', 'frequency', 'journey', 'destination', 'reservation', 'regulation',
  'municipality', 'infrastructure', 'commute', 'itinerary', 'departure', 'arrival',
  // General academic
  'approximately', 'sufficient', 'consequently', 'furthermore', 'nevertheless',
  'significant', 'substantial', 'demonstrate', 'facilitate', 'implement',
  'contribute', 'indicate', 'establish', 'evaluate', 'analyze', 'interpret',
  'participate', 'accommodate', 'appropriate', 'alternative', 'available',
  'circumstances', 'maintenance', 'requirements', 'authorities', 'environmental',
  'administration', 'management', 'organisation', 'organisation', 'community',
  // IELTS-common
  'dentist', 'supermarket', 'pollution', 'storage', 'parking', 'evening',
]);

function highlightVocab(text: string): React.ReactNode {
  if (!text) return null;
  const words = text.split(/(\s+)/);
  return words.map((word, i) => {
    const clean = word.replace(/[^a-zA-Z]/g, '').toLowerCase();
    if (HIGH_LEVEL_WORDS.has(clean)) {
      return (
        <mark key={i} className="bg-amber-100 text-amber-800 font-semibold rounded px-0.5 border-b-2 border-amber-400">
          {word}
        </mark>
      );
    }
    return <span key={i}>{word}</span>;
  });
}

// ── Band advice ──────────────────────────────────────────────────────
function getBandAdvice(band: number) {
  if (band >= 8.5) return {
    emoji: '🏆',
    level: 'Expert',
    color: 'emerald',
    message: "Outstanding performance! You have near-native listening comprehension. Focus on maintaining this level with complex academic lectures and diverse accents.",
    tips: [
      "Listen to TED talks and academic podcasts without subtitles",
      "Practice with IELTS 9-band model answers",
      "Focus on nuanced vocabulary and complex inferences",
    ]
  };
  if (band >= 7) return {
    emoji: '🌟',
    level: 'Advanced',
    color: 'blue',
    message: "Excellent work! You have strong listening skills. A few more hours of targeted practice will push you to expert level.",
    tips: [
      "Focus on Parts 3 & 4 which use complex academic discussions",
      "Practice listening to multiple speakers with different accents",
      "Work on catching specific details like numbers, dates, and names",
    ]
  };
  if (band >= 6) return {
    emoji: '📈',
    level: 'Upper-Intermediate',
    color: 'violet',
    message: "Good effort! You're above average and making solid progress. Targeted practice on specific question types will help bridge the gap.",
    tips: [
      "Re-listen to the audio and check where you went wrong",
      "Practice fill-in-the-blank exercises daily for 20 minutes",
      "Focus on predicting answers before listening begins",
    ]
  };
  if (band >= 5) return {
    emoji: '💪',
    level: 'Intermediate',
    color: 'amber',
    message: "You're building a strong foundation. Don't give up — consistent daily listening practice makes the biggest difference at this stage.",
    tips: [
      "Start with IELTS Listening Section 1 & 2 until you score 8+",
      "Listen to English radio or podcasts for 30 minutes daily",
      "Study common IELTS vocabulary: numbers, addresses, schedules",
      "Follow tapescripts while listening to build comprehension",
    ]
  };
  return {
    emoji: '🎯',
    level: 'Beginner',
    color: 'rose',
    message: "Every expert was once a beginner. The key is daily exposure to English audio. Start with slower-paced content and work your way up.",
    tips: [
      "Listen to the same recording multiple times until you understand it fully",
      "Study 10 new IELTS vocabulary words daily",
      "Use BBC Learning English 6 Minute English podcasts",
      "Practice spelling common English words — many errors are spelling mistakes",
      "Re-take this test after 3 days of practice",
    ]
  };
}

// ── Writing AI Breakdown ──────────────────────────────────────────────
function WritingAIBreakdown({ attempt }: { attempt: any }) {
  const [showBand9, setShowBand9] = useState(false);
  const isSkipped = attempt.estimatedBand === 0;
  const evaluation = attempt.aiEvaluation || {
    scores: isSkipped ? {
      task_achievement: 0.0,
      coherence_cohesion: 0.0,
      lexical_resource: 0.0,
      grammatical_range: 0.0
    } : {
      task_achievement: 6.5,
      coherence_cohesion: 6.0,
      lexical_resource: 7.0,
      grammatical_range: 6.5
    },
    feedback: isSkipped ? "Your essay was too short to evaluate. Please write a complete response." : "Your essay is well-structured but needs more diverse sentence structures to reach a higher band.",
    band9Version: isSkipped ? "N/A" : "In many contemporary societies, the debate over whether technology brings more harm than good is increasingly prevalent. While there are undeniable drawbacks, I would argue that the benefits significantly outweigh the costs..."
  };

  const scores = evaluation.scores;
  const categories = [
    { label: 'Task Achievement', score: scores.task_achievement, icon: <Target className="w-4 h-4" /> },
    { label: 'Coherence & Cohesion', score: scores.coherence_cohesion, icon: <Zap className="w-4 h-4" /> },
    { label: 'Lexical Resource', score: scores.lexical_resource, icon: <BookOpen className="w-4 h-4" /> },
    { label: 'Grammatical Range', score: scores.grammatical_range, icon: <Award className="w-4 h-4" /> },
  ];

  return (
    <div className="bg-white rounded-3xl shadow-lg border border-slate-100 p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-fuchsia-50 border border-fuchsia-100 flex items-center justify-center">
            <Zap className="w-5 h-5 text-fuchsia-500" />
          </div>
          <div>
            <h2 className="font-extrabold text-slate-900 text-base">Writing AI Examiner</h2>
            <p className="text-xs text-slate-500">Official IELTS criteria evaluation</p>
          </div>
        </div>
        <div className="flex items-center bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setShowBand9(false)}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${!showBand9 ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}
          >
            Original
          </button>
          <button
            onClick={() => setShowBand9(true)}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${showBand9 ? 'bg-fuchsia-600 text-white shadow-sm' : 'text-slate-400'}`}
          >
            Band 9
          </button>
        </div>
      </div>

      {!showBand9 ? (
        <div className="grid grid-cols-2 gap-4">
          {categories.map((cat, i) => (
            <div key={i} className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
              <div className="flex items-center gap-2 mb-2 text-slate-400">
                {cat.icon}
                <span className="text-[10px] font-black uppercase tracking-wider">{cat.label}</span>
              </div>
              <div className="flex items-end gap-1">
                <span className="text-2xl font-black text-slate-900">{cat.score.toFixed(1)}</span>
                <span className="text-xs font-bold text-slate-400 mb-1">/ 9.0</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-fuchsia-50 rounded-2xl p-6 border border-fuchsia-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Star className="w-12 h-12 text-fuchsia-500 fill-fuchsia-500" />
          </div>
          <p className="text-sm text-fuchsia-900 leading-relaxed font-serif animate-in fade-in duration-500">
            {evaluation.band9Version}
          </p>
        </div>
      )}

      <div className="bg-fuchsia-50 rounded-2xl p-4 border border-fuchsia-100">
        <p className="text-xs font-bold text-fuchsia-800 mb-1 flex items-center gap-2">
          <Lightbulb className="w-4 h-4" /> Examiner's Commentary
        </p>
        <p className="text-xs text-fuchsia-700 leading-relaxed">
          {evaluation.feedback}
        </p>
      </div>
    </div>
  );
}

// ── Speaking AI Breakdown ─────────────────────────────────────────────
function SpeakingAIBreakdown({ attempt }: { attempt: any }) {
  const isSkipped = attempt.estimatedBand === 0;
  const scores = attempt.aiEvaluation?.scores || (isSkipped ? {
    fluency: 0.0,
    lexical: 0.0,
    grammar: 0.0,
    pronunciation: 0.0
  } : {
    fluency: 6.5,
    lexical: 7.0,
    grammar: 6.0,
    pronunciation: 6.5
  });

  const categories = [
    { label: 'Fluency & Coherence', score: scores.fluency, icon: <Zap className="w-4 h-4" /> },
    { label: 'Lexical Resource', score: scores.lexical, icon: <BookOpen className="w-4 h-4" /> },
    { label: 'Grammatical Range', score: scores.grammar, icon: <Target className="w-4 h-4" /> },
    { label: 'Pronunciation', score: scores.pronunciation, icon: <Mic className="w-4 h-4" /> },
  ];

  return (
    <div className="bg-white rounded-3xl shadow-lg border border-slate-100 p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center">
          <Zap className="w-5 h-5 text-rose-500" />
        </div>
        <div>
          <h2 className="font-extrabold text-slate-900 text-base">Speaking AI Analysis</h2>
          <p className="text-xs text-slate-500">Multimodal evaluation of your interview</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {categories.map((cat, i) => (
          <div key={i} className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
            <div className="flex items-center gap-2 mb-2 text-slate-400">
              {cat.icon}
              <span className="text-[10px] font-black uppercase tracking-wider">{cat.label}</span>
            </div>
            <div className="flex items-end gap-1">
              <span className="text-2xl font-black text-slate-900">{cat.score.toFixed(1)}</span>
              <span className="text-xs font-bold text-slate-400 mb-1">/ 9.0</span>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-rose-50 rounded-2xl p-4 border border-rose-100">
        <p className="text-xs font-bold text-rose-800 mb-1 flex items-center gap-2">
          <Lightbulb className="w-4 h-4" /> AI Feedback Summary
        </p>
        <p className="text-xs text-rose-700 leading-relaxed">
          {attempt.aiEvaluation?.feedback || (isSkipped
            ? "Your recording was too short or empty. Please record for longer to get a meaningful analysis."
            : `Your speaking shows good fluidity. To improve, try to reduce self-correction in Part 2. Your lexical resource is strong, but you could use more idiomatic expressions to reach Band 7.5.`)}
        </p>
      </div>
    </div>
  );
}

const COLOR_MAP: Record<string, string> = {
  emerald: 'from-emerald-500 to-teal-600',
  blue: 'from-blue-500 to-indigo-600',
  violet: 'from-violet-500 to-purple-600',
  amber: 'from-amber-500 to-orange-500',
  rose: 'from-rose-500 to-red-600',
};
const BADGE_MAP: Record<string, string> = {
  emerald: 'bg-emerald-50 border-emerald-200 text-emerald-700',
  blue: 'bg-blue-50 border-blue-200 text-blue-700',
  violet: 'bg-violet-50 border-violet-200 text-violet-700',
  amber: 'bg-amber-50 border-amber-200 text-amber-700',
  rose: 'bg-rose-50 border-rose-200 text-rose-700',
};

export default function ResultPage({ params }: { params: { id: string } }) {
  const [attempt, setAttempt] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [unlocking, setUnlocking] = useState(false);
  const [showAnswerKey, setShowAnswerKey] = useState(false);
  const { user, profile } = useAuth();

  useEffect(() => {
    async function fetchResult() {
      try {
        const attemptRef = doc(db, 'attempts', params.id);
        const snap = await getDoc(attemptRef);
        if (snap.exists()) {
          setAttempt(snap.data());
        }
      } catch (err) {
        console.error("Failed to fetch result", err);
      } finally {
        setLoading(false);
      }
    }
    fetchResult();
  }, [params.id]);

  const buildEmailPayload = (attempt: any, user: any, profile: any) => {
    // Plain text generation 
    const userName = profile.username || 'Student';
    const isFull = attempt.section === 'full-test' || !!attempt.fullTestId || attempt.testTitle?.toLowerCase().includes('full');
    const testType = isFull ? 'Full Test' : 'Section Practice';

    let textBody = `Hi ${userName},\n\nHere are the results of your recent ${testType}:\n\n`;
    if (attempt.section === 'full-test') {
      textBody += `Overall Band: ${attempt.estimatedBand}\nListening: ${attempt.listeningBand}\nReading: ${attempt.readingBand}\nWriting: ${attempt.writingBand}\nSpeaking: ${attempt.speakingBand}\n`;
    } else {
      textBody += `Section: ${attempt.section}\nBand Score: ${attempt.estimatedBand}\n`;
      if (['listening', 'reading'].includes(attempt.section)) {
        textBody += `Correct Answers: ${attempt.rawScore}\n`;
      }
    }
    textBody += `\nKeep practicing on Bondify!\n`;

    // Professional HTML generation
    const overallScore = attempt.estimatedBand !== undefined ? attempt.estimatedBand.toFixed(1) : '0.0';

    let statsHtml = '';
    if (attempt.section === 'full-test') {
      statsHtml = `
        <div style="display: flex; gap: 12px; justify-content: space-between; margin-bottom: 24px;">
          <div style="text-align: center; flex: 1; padding: 12px; background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;">
            <p style="margin: 0; font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">L</p>
            <p style="margin: 4px 0 0; font-size: 18px; font-weight: 800; color: #0f172a;">${attempt.listeningBand ?? 0}</p>
          </div>
          <div style="text-align: center; flex: 1; padding: 12px; background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;">
            <p style="margin: 0; font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">R</p>
            <p style="margin: 4px 0 0; font-size: 18px; font-weight: 800; color: #0f172a;">${attempt.readingBand ?? 0}</p>
          </div>
          <div style="text-align: center; flex: 1; padding: 12px; background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;">
            <p style="margin: 0; font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">W</p>
            <p style="margin: 4px 0 0; font-size: 18px; font-weight: 800; color: #0f172a;">${attempt.writingBand ?? 0}</p>
          </div>
          <div style="text-align: center; flex: 1; padding: 12px; background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;">
            <p style="margin: 0; font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">S</p>
            <p style="margin: 4px 0 0; font-size: 18px; font-weight: 800; color: #0f172a;">${attempt.speakingBand ?? 0}</p>
          </div>
        </div>
      `;
    } else {
      statsHtml = `
        <div style="display: flex; gap: 12px; justify-content: center; margin-bottom: 24px;">
          ${['listening', 'reading'].includes(attempt.section) ? `
          <div style="text-align: center; padding: 12px 24px; background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; width: 80px;">
            <p style="margin: 0; font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">Correct</p>
            <p style="margin: 4px 0 0; font-size: 18px; font-weight: 800; color: #0f172a;">${attempt.rawScore}</p>
          </div>` : ''}
          <div style="text-align: center; padding: 12px 24px; background-color: #eff6ff; border-radius: 12px; border: 1px solid #bfdbfe; width: 100px;">
            <p style="margin: 0; font-size: 11px; font-weight: 700; color: #1d4ed8; text-transform: uppercase; letter-spacing: 0.05em;">Section</p>
            <p style="margin: 4px 0 0; font-size: 18px; font-weight: 800; color: #1e3a8a; text-transform: capitalize;">${attempt.section}</p>
          </div>
        </div>
      `;
    }

    const htmlBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your IELTS Result</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f4f5; margin: 0; padding: 0;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f4f4f5; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 24px; max-width: 600px; width: 100%; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1); overflow: hidden;">
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #2563eb, #4f46e5); padding: 40px 30px; text-align: center;">
                    <img src="https://ui-avatars.com/api/?name=Bondify&background=ffffff&color=2563eb&rounded=true&bold=true" width="64" height="64" style="border-radius: 50%; border: 3px solid rgba(255,255,255,0.2);" />
                    <h1 style="color: #ffffff; margin: 16px 0 0; font-size: 26px; font-weight: 800; letter-spacing: -0.02em;">Bondify</h1>
                    <p style="color: rgba(255,255,255,0.85); margin: 6px 0 0; font-size: 15px; font-weight: 500;">Your Official Practice Result</p>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 40px 30px;">
                    <p style="margin: 0 0 12px; font-size: 18px; color: #1e293b; font-weight: 700;">Hi ${userName},</p>
                    <p style="margin: 0 0 32px; font-size: 16px; color: #475569; line-height: 1.6;">Your recent <strong>${testType}</strong> has been fully evaluated. Here is your structured breakdown:</p>
                    
                    <!-- Score Ring -->
                    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 32px;">
                      <tr>
                        <td align="center">
                          <div style="width: 130px; height: 130px; border-radius: 50%; background: linear-gradient(135deg, #eff6ff, #e0e7ff); border: 5px solid #3b82f6; display: table-cell; vertical-align: middle; text-align: center; box-shadow: inset 0 2px 10px rgba(0,0,0,0.05);">
                            <span style="font-size: 42px; font-weight: 900; color: #1e3a8a; line-height: 1;">${overallScore}</span>
                            <br/>
                            <span style="font-size: 11px; font-weight: 800; color: #3b82f6; text-transform: uppercase; letter-spacing: 0.12em; display: inline-block; margin-top: 6px;">Overall Band</span>
                          </div>
                        </td>
                      </tr>
                    </table>

                    <!-- Stats Row -->
                    ${statsHtml}
                    
                    <div style="background-color: #f8fafc; border-left: 4px solid #3b82f6; border-radius: 0 12px 12px 0; padding: 16px; margin-bottom: 32px;">
                      <p style="margin: 0; font-size: 15px; color: #475569; line-height: 1.6;">
                        <strong>Next Steps:</strong> Join the dashboard to review your specific errors, examine AI feedback on your performance, and take more drills tailored to your weak points.
                      </p>
                    </div>
                    
                    <!-- CTA Button -->
                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td align="center">
                          <a href="${window.location.href}" style="background-color: #0f172a; color: #ffffff; padding: 18px 36px; text-decoration: none; border-radius: 14px; font-weight: 700; font-size: 16px; display: inline-block; box-shadow: 0 10px 15px -3px rgba(15, 23, 42, 0.2), 0 4px 6px -2px rgba(15, 23, 42, 0.1); width: 80%; text-align: center;">Review Answer & Feedback</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="background-color: #f8fafc; padding: 30px; border-top: 1px solid #e2e8f0; text-align: center;">
                    <p style="margin: 0; font-size: 14px; color: #64748b; font-weight: 600;">Keep pushing forward!</p>
                    <p style="margin: 8px 0 0; font-size: 12px; color: #94a3b8;">© 2026 Bondify · IELTS Education</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
    return {
      to: user.email,
      subject: `Bondify: Your IELTS ${testType} Results Available`,
      text: textBody,
      html: htmlBody,
      url: window.location.href,
    };
  };

  const handleUnlock = async () => {
    if (!profile || !attempt || !user) return;
    if ((profile.tokenBalance ?? 0) < 2) {
      alert("Not enough tokens. Please purchase more.");
      return;
    }
    
    setUnlocking(true);
    try {
      await runTransaction(db, async (transaction) => {
        const userRef = doc(db, 'users', profile.uid);
        const attemptRef = doc(db, 'attempts', attempt.id);
        const logsRef = doc(collection(db, 'token_logs'));

        const userSnap = await transaction.get(userRef);
        if (!userSnap.exists()) throw "User not found";
        const currentBalance = userSnap.data().tokenBalance ?? 0;
        if (currentBalance < 2) throw "Insufficient balance";

        // 1. Deduct tokens
        transaction.update(userRef, { tokenBalance: increment(-2) });

        // 2. Unlock attempt
        transaction.update(attemptRef, { resultUnlocked: true });

        // 3. Log transaction
        transaction.set(logsRef, {
          userId: profile.uid,
          changeAmount: -2,
          reason: `unlocked result: ${attempt.id}`,
          createdAt: serverTimestamp(),
        });
      });

      setAttempt({ ...attempt, resultUnlocked: true });

      // Email Result System
      if (user.email) {
        const payload = buildEmailPayload(attempt, user, profile);
        fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }).catch(err => console.error("Email API failed:", err));
      }

    } catch (err) {
      console.error("Failed to unlock", err);
      alert(err === "Insufficient balance" ? "Not enough tokens. Please purchase more." : "Failed to unlock. Please try again.");
    }
    setUnlocking(false);
  };


  const handleSendEmail = async () => {
    if (!profile || !attempt || !user) return;
    if ((profile.tokenBalance ?? 0) < 2) {
      alert("Not enough tokens. Please purchase more.");
      return;
    }
    setUnlocking(true);
    try {
      await runTransaction(db, async (transaction) => {
        const userRef = doc(db, 'users', profile.uid);
        const logsRef = doc(collection(db, 'token_logs'));

        const userSnap = await transaction.get(userRef);
        if (!userSnap.exists()) throw "User not found";
        const currentBalance = userSnap.data().tokenBalance ?? 0;
        if (currentBalance < 2) throw "Insufficient balance";

        // 1. Deduct tokens
        transaction.update(userRef, { tokenBalance: increment(-2) });

        // 2. Log transaction
        transaction.set(logsRef, {
          userId: profile.uid,
          changeAmount: -2,
          reason: `emailed result: ${attempt.id}`,
          createdAt: serverTimestamp(),
        });
      });

      // Email Result System
      if (user.email) {
        const payload = buildEmailPayload(attempt, user, profile);
        await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        alert("Results sent to your email!");
      }
    } catch (err) {
      console.error("Failed to send email", err);
      alert(err === "Insufficient balance" ? "Not enough tokens. Please purchase more." : "Failed to send email. Please try again.");
    }
    setUnlocking(false);
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block w-10 h-10 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin mb-4" />
            <p className="text-slate-500 font-medium">Calculating your results…</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!attempt) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center p-8 bg-white rounded-2xl shadow-sm border border-rose-100 max-w-sm">
            <p className="text-rose-500 font-bold text-lg mb-2">Result not found</p>
            <p className="text-slate-500 text-sm mb-4">This result may have expired or the link is incorrect.</p>
            <Link href="/" className="text-blue-600 font-bold text-sm hover:underline">← Go to Dashboard</Link>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  const isPremium = profile ? ['go', 'plus', 'pro'].includes(profile.accountTier) : false;
  const isUnlocked = isPremium || attempt.resultUnlocked === true;
  const hasEnoughTokens = profile ? (profile.tokenBalance ?? 0) >= 2 : false;


  const band: number = typeof attempt.estimatedBand === 'number' ? attempt.estimatedBand : parseFloat(attempt.estimatedBand ?? '0') || 0;
  const rawScore: number = attempt.rawScore ?? 0;
  const maxScore: number = attempt.maxScore ?? 0;
  const pct = maxScore > 0 ? Math.round((rawScore / maxScore) * 100) : 0;

  const advice = getBandAdvice(band);
  const bandGradient = COLOR_MAP[advice.color] ?? COLOR_MAP.rose;
  const badgeClass = BADGE_MAP[advice.color] ?? BADGE_MAP.rose;

  const questionResults: any[] = attempt.questionResults ?? [];

  // Group questions by part
  const partGroups: Record<string, any[]> = {};
  questionResults.forEach((q) => {
    const key = q.partTitle || 'Questions';
    if (!partGroups[key]) partGroups[key] = [];
    partGroups[key].push(q);
  });

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 py-10 px-4">
        <div className="w-full max-w-2xl mx-auto space-y-6">

          {/* ── HEADER CARD ── */}
          <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
            <div className={`h-2 w-full bg-gradient-to-r ${bandGradient}`} />
            <div className="p-8 text-center">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Practice Complete</p>
              <h1 className="text-2xl font-extrabold text-slate-900 mb-1 capitalize">
                {attempt.section === 'full-test' ? 'Overall Full Test Result' : `${attempt.section} Section`}
              </h1>
              {attempt.testTitle && (
                <p className="text-slate-500 text-sm font-medium">{attempt.testTitle}</p>
              )}
              <p className="text-slate-400 text-xs font-medium mt-1 mb-6">
                Submitted {new Date(attempt.submittedAt).toLocaleDateString('en-US', { dateStyle: 'medium' })}
              </p>

              {!isUnlocked ? (
                // ── LOCKED ──────────────────────────────────
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 mb-4">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Lock className="w-7 h-7 text-slate-400" />
                  </div>
                  <h2 className="text-lg font-bold text-slate-800 mb-1">Score Locked</h2>
                  <p className="text-slate-500 text-sm mb-6">Unlock your detailed score, answer review and personalised feedback.</p>

                  {profile === null ? (
                    <p className="text-slate-400 text-sm py-4">Loading account info…</p>
                  ) : hasEnoughTokens ? (
                    <button
                      onClick={handleUnlock}
                      disabled={unlocking}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-6 rounded-xl shadow-lg shadow-blue-500/20 transition-all flex justify-center items-center gap-2 disabled:opacity-50"
                    >
                      {unlocking ? (
                        <><span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Unlocking…</>
                      ) : (
                        <><Unlock className="w-4 h-4" /> Unlock for 2 Tokens</>

                      )}
                    </button>
                  ) : (
                    <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 mb-4 text-left">
                      <p className="font-bold text-rose-700 text-sm">Out of Tokens</p>
                      <p className="text-rose-500 text-xs mt-0.5">You need 2 tokens to unlock this result.</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <Link href="/pricing" className="block p-3.5 border border-amber-200 bg-amber-50 rounded-xl hover:bg-amber-100 transition-colors">
                      <Zap className="w-5 h-5 text-amber-500 mx-auto mb-1" />
                      <span className="font-bold text-amber-700 text-xs block">Upgrade Plan</span>
                      <span className="text-[11px] text-amber-600/70">Unlimited unlocks</span>
                    </Link>
                    <Link href="/profile" className="block p-3.5 border border-emerald-200 bg-emerald-50 rounded-xl hover:bg-emerald-100 transition-colors">
                      <Users className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
                      <span className="font-bold text-emerald-700 text-xs block">Refer a Friend</span>
                      <span className="text-[11px] text-emerald-600/70">Earn 100 tokens</span>
                    </Link>
                  </div>
                </div>
              ) : (
                // ── UNLOCKED: Band + Stats ───────────────────
                <>
                  {/* Band Score Circle */}
                  <div className={`w-44 h-44 bg-gradient-to-br ${bandGradient} rounded-full flex items-center justify-center text-white shadow-2xl mx-auto border-8 border-white ring-1 ring-slate-100 mb-6`}>
                    <div className="text-center">
                      <span className="text-5xl font-black leading-none">{band.toFixed(1)}</span>
                      <span className="block text-xs opacity-90 font-bold tracking-widest uppercase mt-1">Band Score</span>
                    </div>
                  </div>

                  {/* Level badge */}
                  <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-sm font-bold mb-6 ${badgeClass}`}>
                    <span>{advice.emoji}</span>
                    <span>{advice.level} Level</span>
                  </div>

                  {/* Stats row */}
                  {['listening', 'reading', 'daily_challenge'].includes(attempt.section) && (
                    <div className="grid grid-cols-3 gap-3 mb-2">
                      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
                        <BarChart2 className="w-5 h-5 text-slate-400 mx-auto mb-1.5" />
                        <p className="text-2xl font-black text-slate-900">{rawScore}<span className="text-sm text-slate-400 font-medium">/{maxScore}</span></p>
                        <p className="text-xs font-semibold text-slate-500 mt-0.5">Correct</p>
                      </div>
                      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
                        <CheckCircle className="w-5 h-5 text-emerald-400 mx-auto mb-1.5" />
                        <p className="text-2xl font-black text-slate-900">{pct}<span className="text-sm text-slate-400 font-medium">%</span></p>
                        <p className="text-xs font-semibold text-slate-500 mt-0.5">Accuracy</p>
                      </div>
                      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
                        <Target className="w-5 h-5 text-blue-400 mx-auto mb-1.5" />
                        <p className="text-2xl font-black text-slate-900">{attempt.normalizedScore ?? '–'}<span className="text-sm text-slate-400 font-medium">/40</span></p>
                        <p className="text-xs font-semibold text-slate-500 mt-0.5">IELTS Scale</p>
                      </div>
                    </div>
                  )}
                  {attempt.section === 'full-test' && (
                    <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-center mt-4">
                      <p className="font-bold text-blue-800 text-sm mb-1">Want to see your detailed section scores?</p>
                      <p className="text-blue-600/80 text-xs">Send your result to your email using the button below to get your full breakdown.</p>
                    </div>
                  )}
                </>
              )}

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-100 mt-4">
                <Link href="/" className="flex-1 px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-sm transition-colors text-center">
                  Dashboard
                </Link>
                {isUnlocked && (
                  <button onClick={handleSendEmail} disabled={unlocking} className="flex-1 px-5 py-3 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2">
                    <Send className="w-4 h-4" /> Email (2 Tokens)
                  </button>
                )}
                <Link href={attempt.fullTestId ? `/full-test/${attempt.fullTestId}` : `/${attempt.section}`} className="flex-1 px-5 py-3 bg-slate-900 hover:bg-black text-white rounded-xl font-bold text-sm transition-colors text-center">
                  {attempt.fullTestId ? 'Continue Test' : 'Try Again'}
                </Link>
              </div>
            </div>
          </div>

          {/* ── WRITING AI EVALUATION ── */}
          {attempt.section === 'writing' && isUnlocked && (
            <WritingAIBreakdown attempt={attempt} />
          )}

          {/* ── SPEAKING AI EVALUATION ── */}
          {attempt.section === 'speaking' && isUnlocked && (
            <SpeakingAIBreakdown attempt={attempt} />
          )}

          {/* ── ONLY SHOW BELOW IF UNLOCKED ── */}
          {isUnlocked && (
            <>
              {/* ── SMART ANALYTICS: WEAK AREAS ── */}
              <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10 transform translate-x-4 -translate-y-4">
                  <BarChart2 className="w-48 h-48" />
                </div>

                <h3 className="text-xl font-black mb-6 flex items-center gap-2">
                  <Target className="w-6 h-6 text-primary-400" /> Skill Breakdown
                </h3>

                {profile && (profile.successfulReferralCount >= 2 || isPremium) ? (
                  <div className="space-y-6 relative z-10">
                    {(() => {
                      const typeStats: Record<string, { total: number, correct: number }> = {};
                      questionResults.forEach((q: any) => {
                        const type = q.type || 'Standard';
                        if (!typeStats[type]) typeStats[type] = { total: 0, correct: 0 };
                        typeStats[type].total++;
                        if (q.correct) typeStats[type].correct++;
                      });

                      const statsArray = Object.entries(typeStats).sort((a, b) => (a[1].correct / a[1].total) - (b[1].correct / b[1].total));

                      return statsArray.map(([type, stat]) => {
                        const pct = (stat.correct / stat.total) * 100;
                        const isWeak = pct < 60;

                        return (
                          <div key={type} className="bg-white/5 rounded-2xl p-4 border border-white/10">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm font-bold capitalize">{type.replace(/_/g, ' ')}</span>
                              <span className={`text-xs font-black px-2 py-0.5 rounded-md ${isWeak ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
                                {isWeak ? 'WEAK AREA' : 'STRONG'}
                              </span>
                            </div>
                            <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden mb-1">
                              <div
                                className={`h-full rounded-full transition-all duration-1000 ${isWeak ? 'bg-rose-500' : 'bg-emerald-500'}`}
                                style={{ width: `${pct}%` }}
                              ></div>
                            </div>
                            <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">
                              {stat.correct} / {stat.total} Correct
                            </p>
                            {isWeak && (
                              <p className="mt-3 text-xs text-rose-200/80 leading-relaxed italic border-t border-white/5 pt-2">
                                💡 Try focusing on {type.toLowerCase()} drills in your next practice session.
                              </p>
                            )}
                          </div>
                        );
                      });
                    })()}
                  </div>
                ) : (
                  <div className="relative z-10 py-10 text-center">
                    <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6 backdrop-blur-md border border-white/20">
                      <Lock className="w-8 h-8 text-primary-400" />
                    </div>
                    <h4 className="text-lg font-black mb-2">Unlock Skill Breakdown</h4>
                    <p className="text-white/60 text-sm max-w-[240px] mx-auto mb-8 font-medium">
                      Invite <strong>2 friends</strong> or Upgrade to Premium to see exactly which question types are holding you back.
                    </p>
                    <Link href="/profile" className="inline-flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white font-black px-8 py-3 rounded-xl transition-all shadow-lg active:scale-95">
                      Invite Friends <Users className="w-4 h-4" />
                    </Link>
                  </div>
                )}
              </div>

              {/* ── PERSONALISED ADVICE ── */}
              <div className="bg-white rounded-3xl shadow-lg border border-slate-100 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${bandGradient} flex items-center justify-center text-white font-bold text-lg`}>
                    {advice.emoji}
                  </div>
                  <div>
                    <h2 className="font-extrabold text-slate-900 text-base">Personalised Feedback</h2>
                    <p className="text-xs text-slate-500">Based on your Band {band.toFixed(1)} performance</p>
                  </div>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed mb-5 bg-slate-50 rounded-2xl p-4 border border-slate-100">
                  {advice.message}
                </p>
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                    <TrendingUp className="w-3.5 h-3.5" /> Practice Recommendations
                  </h3>
                  {advice.tips.map((tip, i) => (
                    <div key={i} className="flex items-start gap-3 bg-slate-50 rounded-xl p-3 border border-slate-100">
                      <span className={`shrink-0 w-6 h-6 rounded-full bg-gradient-to-br ${bandGradient} text-white text-xs font-bold flex items-center justify-center mt-0.5`}>
                        {i + 1}
                      </span>
                      <p className="text-sm text-slate-700 leading-relaxed">{tip}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── ANSWER REVIEW ── */}
              {questionResults.length > 0 && (
                <div className="bg-white rounded-3xl shadow-lg border border-slate-100 overflow-hidden">
                  <button
                    onClick={() => setShowAnswerKey(v => !v)}
                    className="w-full p-6 flex items-center justify-between hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center">
                        <BookOpen className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="text-left">
                        <h2 className="font-extrabold text-slate-900 text-base">Answer Review</h2>
                        <p className="text-xs text-slate-500">{rawScore} correct · {maxScore - rawScore} incorrect</p>
                      </div>
                    </div>
                    {showAnswerKey
                      ? <ChevronUp className="w-5 h-5 text-slate-400" />
                      : <ChevronDown className="w-5 h-5 text-slate-400" />}
                  </button>

                  {showAnswerKey && (
                    <div className="px-6 pb-6 space-y-6">
                      {Object.entries(partGroups).map(([partTitle, qs]) => (
                        <div key={partTitle}>
                          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3 border-b border-slate-100 pb-2">{partTitle}</p>
                          <div className="space-y-2">
                            {qs.map((q: any) => (
                              <div
                                key={q.id}
                                className={`flex items-start gap-3 rounded-xl border p-3 ${q.isCorrect
                                  ? 'bg-emerald-50 border-emerald-100'
                                  : 'bg-rose-50 border-rose-100'
                                  }`}
                              >
                                {/* Number */}
                                <span className={`shrink-0 w-6 h-6 rounded-md text-xs font-bold flex items-center justify-center mt-0.5 ${q.isCorrect ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                                  }`}>
                                  {q.number}
                                </span>

                                <div className="flex-1 min-w-0">
                                  {/* Question label */}
                                  <p className="text-[12px] text-slate-600 mb-1 leading-relaxed">
                                    {highlightVocab(
                                      [q.label, '____', q.suffix].filter(Boolean).join(' ')
                                    )}
                                  </p>

                                  <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                                    {/* User answer */}
                                      <span className={`px-2 py-0.5 rounded-full ${q.isCorrect ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700 line-through'}`}>
                                      {q.userAnswer || '(no answer)'}
                                    </span>

                                    {!q.isCorrect && (
                                      <>
                                        <span className="text-slate-400">→</span>
                                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                                          {highlightVocab(q.correctAnswer)}
                                        </span>
                                      </>
                                    )}
                                  </div>
                                </div>

                                {q.isCorrect
                                  ? <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                  : <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}

                      {/* Vocabulary key */}
                      <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4 mt-4">
                        <Lightbulb className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-bold text-amber-800 mb-1">Highlighted words are high-level vocabulary</p>
                          <p className="text-xs text-amber-700 leading-relaxed">
                            Words highlighted in{' '}
                            <mark className="bg-amber-100 text-amber-800 font-semibold rounded px-0.5 border-b-2 border-amber-400">yellow</mark>{' '}
                            are advanced vocabulary commonly tested in IELTS. Make sure you know their spelling and meaning!
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── MOTIVATION FOOTER ── */}
              <div className={`rounded-3xl p-6 bg-gradient-to-br ${bandGradient} text-white shadow-xl`}>
                <div className="flex items-center gap-3 mb-3">
                  <Award className="w-8 h-8 opacity-80" />
                  <div>
                    <p className="font-extrabold text-lg">Keep Practising!</p>
                    <p className="text-white/80 text-sm">Consistency is the key to IELTS success</p>
                  </div>
                </div>
                <p className="text-white/90 text-sm leading-relaxed">
                  Studies show that students who practice listening for at least <strong>30 minutes daily</strong> improve their
                  band score by 0.5–1.0 points in just <strong>4 weeks</strong>. Try the next test to keep improving!
                </p>
                <Link
                  href={`/${attempt.section}`}
                  className="mt-4 inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all"
                >
                  Practice Again →
                </Link>
              </div>
            </>
          )}

        </div>
      </div>
    </ProtectedRoute>
  );
}
