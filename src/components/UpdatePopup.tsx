"use client";

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase/config';
import { collection, query, where, orderBy, limit, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { Rocket, X, Check, ArrowRight } from 'lucide-react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

export default function UpdatePopup() {
  const [latestUpdate, setLatestUpdate] = useState<any>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [feedbackOption, setFeedbackOption] = useState('');
  const [customText, setCustomText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { user } = useAuth();
  const pathname = usePathname();

  const isTestPage = pathname?.includes('/listening/') ||
    pathname?.includes('/reading/') ||
    pathname?.includes('/writing/') ||
    pathname?.includes('/full-test/') ||
    pathname?.includes('/daily-challenge') || 
    pathname?.includes('/admin');

  useEffect(() => {
    if (isTestPage) return;

    async function checkLatestUpdate() {
      try {
        const q = query(
          collection(db, 'updates'),
          where('is_published', '==', true),
          orderBy('created_at', 'desc'),
          limit(1)
        );
        const snap = await getDocs(q);
        
        if (!snap.empty) {
          const updateData = { id: snap.docs[0].id, ...snap.docs[0].data() };
          
          // Check local storage
          const lastSeen = localStorage.getItem('last_seen_update');
          if (lastSeen !== updateData.id) {
            setLatestUpdate(updateData);
            
            // Short delay so it doesn't instantly block the page on load
            setTimeout(() => {
              setShowPopup(true);
            }, 1500);
          }
        }
      } catch (err) {
        // Fallback for missing indexes
        console.error("Popup check failed, skipping to avoid disruption", err);
      }
    }
    
    checkLatestUpdate();
  }, [isTestPage]);

  const handleClose = () => {
    if (latestUpdate?.id) {
      localStorage.setItem('last_seen_update', latestUpdate.id);
    }
    setShowPopup(false);
  };

  const handleSubmitFeedback = async () => {
    if (!feedbackOption) return;
    
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'update_feedback'), {
        update_id: latestUpdate.id,
        user_id: user?.uid || 'anonymous',
        selected_option: feedbackOption,
        custom_text: feedbackOption === 'Other' ? customText : '',
        created_at: serverTimestamp()
      });
      setSubmitted(true);
      
      // Auto close after success
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (err) {
      console.error("Feedback error", err);
    } finally {
      setSubmitting(false);
    }
  };

  if (!showPopup || !latestUpdate) return null;

  const feedbackOptions = [
    'More speaking tests',
    'Better AI feedback',
    'More listening tests',
    'Full mock exams',
    'Other'
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-primary-600 to-indigo-700 p-8 text-white relative">
          <button 
            onClick={handleClose} 
            className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md mb-6 shadow-inner ring-1 ring-white/30">
            <Rocket className="w-7 h-7 text-white" />
          </div>
          
          <h2 className="text-3xl font-black mb-2 tracking-tight">New Update Available!</h2>
          <p className="text-primary-100 font-medium">We've just released something new.</p>
        </div>

        {/* Content Body */}
        <div className="p-8">
          <div className="bg-slate-50 border border-slate-100 rounded-3xl p-6 mb-8 text-slate-800">
            <h3 className="font-black text-xl mb-3 tracking-tight leading-none">{latestUpdate.title}</h3>
            <p className="text-sm font-medium text-slate-500 leading-relaxed line-clamp-3 mb-4">
              {latestUpdate.ai_content}
            </p>
            <Link 
              href="/updates" 
              onClick={handleClose}
              className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-primary-600 hover:text-primary-700 transition-colors"
            >
              Read full changelog <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {submitted ? (
            <div className="text-center py-6 bg-emerald-50 rounded-3xl border border-emerald-100 flex flex-col items-center">
              <div className="w-12 h-12 bg-emerald-500 text-white rounded-full flex items-center justify-center mb-4">
                <Check className="w-6 h-6" />
              </div>
              <p className="font-black text-emerald-800 tracking-tight text-lg">Thanks for your feedback!</p>
              <p className="text-emerald-600 text-sm font-medium mt-1">We're already working on it.</p>
            </div>
          ) : (
            <>
              <h3 className="text-lg font-black text-slate-900 mb-4 tracking-tight">What would you like to see next?</h3>
              
              <div className="space-y-3 mb-8">
                {feedbackOptions.map(opt => (
                  <label key={opt} className={`flex items-center gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all ${feedbackOption === opt ? 'border-primary-500 bg-primary-50 shadow-sm' : 'border-slate-100 hover:border-slate-200'}`}>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${feedbackOption === opt ? 'border-primary-600 bg-primary-600' : 'border-slate-300'}`}>
                      {feedbackOption === opt && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                    <span className={`font-bold text-sm ${feedbackOption === opt ? 'text-primary-800' : 'text-slate-600'}`}>
                      {opt}
                    </span>
                  </label>
                ))}

                {feedbackOption === 'Other' && (
                  <textarea
                    autoFocus
                    value={customText}
                    onChange={e => setCustomText(e.target.value)}
                    placeholder="Tell us what you're wishing for..."
                    className="w-full mt-2 p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary-500 font-medium text-slate-700 h-24 resize-none"
                  />
                )}
              </div>

              <div className="flex items-center gap-4">
                <button 
                  onClick={handleClose} 
                  className="px-6 py-4 font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Dismiss
                </button>
                <button 
                  onClick={handleSubmitFeedback}
                  disabled={!feedbackOption || submitting}
                  className="flex-grow bg-slate-900 hover:bg-black text-white font-black py-4 rounded-xl shadow-xl shadow-slate-900/10 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? 'Submitting...' : 'Submit Feedback'}
                </button>
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
}
