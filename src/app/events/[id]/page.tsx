"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db } from '@/lib/firebase/config';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { useAuth } from '@/lib/contexts/AuthContext';
import { Event } from '@/types';
import { ArrowLeft, PlayCircle, Lock, Calendar, Clock, Award } from 'lucide-react';
import Link from 'next/link';

export default function EventOverviewPage() {
  const params = useParams();
  const router = useRouter();
  const { user, profile } = useAuth();
  
  const [event, setEvent] = useState<Event | null>(null);
  const [eventTests, setEventTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadEventData() {
      if (!params?.id) return;
      
      try {
        // Fetch Event Details
        const eventDoc = await getDoc(doc(db, 'events', params.id as string));
        if (eventDoc.exists()) {
          setEvent({ id: eventDoc.id, ...eventDoc.data() } as Event);
        }

        // Fetch Tests linked to this Event
        const q = query(collection(db, 'tests'), where('eventId', '==', params.id));
        const testsSnap = await getDocs(q);
        const fetchedTests = testsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setEventTests(fetchedTests);
        
      } catch (err) {
        console.error("Error loading event data:", err);
      } finally {
        setLoading(false);
      }
    }

    loadEventData();
  }, [params?.id]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-slate-50">
        <div className="animate-spin w-12 h-12 border-4 border-slate-200 border-t-primary-600 rounded-full mb-6"></div>
        <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Loading Event Arena...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-8">
        <div className="bg-white p-16 rounded-[3rem] shadow-xl border border-slate-200 text-center max-w-xl w-full">
           <h2 className="text-3xl font-black text-slate-800 mb-4 tracking-tight">Event Not Found</h2>
           <p className="text-slate-500 font-medium mb-8">This event might have been removed or the URL is invalid.</p>
           <button onClick={() => router.push('/events')} className="bg-slate-900 text-white font-bold py-4 px-8 rounded-2xl">Return to Events</button>
        </div>
      </div>
    );
  }

  // Security check: Only premium users can access premium-only events
  const isPremiumUser = profile && ['go', 'plus', 'pro'].includes(profile.accountTier);
  const canAccess = event.eligibility === 'public' || isPremiumUser;

  if (!canAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-8">
        <div className="bg-white p-16 rounded-[3rem] shadow-xl border border-slate-200 text-center max-w-xl w-full">
           <div className="w-24 h-24 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6">
             <Lock className="w-10 h-10 text-amber-500" />
           </div>
           <h2 className="text-3xl font-black text-slate-800 mb-4 tracking-tight">Premium Only</h2>
           <p className="text-slate-500 font-medium mb-8">This event is restricted to premium scholars. Upgrade your account to participate.</p>
           <button onClick={() => router.push('/pricing')} className="bg-primary-600 text-white font-bold py-4 px-8 rounded-2xl w-full">Unlock Premium</button>
        </div>
      </div>
    );
  }

  // Helper func to render appropriate test icon/color
  const getTestStyles = (section: string) => {
    switch (section?.toLowerCase()) {
      case 'listening': return 'text-indigo-600 bg-indigo-50 border-indigo-200';
      case 'reading': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      case 'writing': return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'speaking': return 'text-rose-600 bg-rose-50 border-rose-200';
      default: return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <button 
        onClick={() => router.push('/events')}
        className="flex items-center gap-2 text-slate-400 hover:text-slate-800 font-bold mb-8 transition-colors group text-sm uppercase tracking-widest"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> All Events
      </button>

      {/* Header */}
      <div className="bg-white rounded-[3rem] p-10 shadow-2xl shadow-slate-200/50 border border-slate-100 flex flex-col md:flex-row gap-10 items-center overflow-hidden relative mb-12">
        {event.bannerImageUrl && (
          <div className="absolute inset-x-0 top-0 h-40 opacity-20 pointer-events-none" style={{ backgroundImage: `url(${event.bannerImageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(10px)' }}></div>
        )}
        
        <div className="w-full md:w-3/4 flex flex-col justify-center relative z-10">
          <div className="flex items-center gap-3 mb-4">
             <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${event.status === 'active' ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-600'}`}>
               {event.status}
             </span>
             {event.eligibility === 'premium-only' && (
               <span className="px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-amber-400 text-amber-900 flex items-center gap-1">
                 <Lock className="w-3 h-3" /> VIP
               </span>
             )}
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-4 uppercase leading-none">{event.title}</h1>
          <p className="text-slate-500 font-medium text-lg leading-relaxed max-w-2xl">{event.description}</p>
        </div>

        <div className="w-full md:w-1/4 flex flex-col gap-4 relative z-10">
           <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100 text-center">
             <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Prize Pool</div>
             <div className="text-xl font-black text-emerald-600">{event.prizePool}</div>
           </div>
           
           <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100 flex items-center justify-center gap-2">
             <Clock className="w-4 h-4 text-slate-400" />
             <span className="text-sm font-bold text-slate-600">{event.duration} Mins</span>
           </div>
        </div>
      </div>

      {/* Tests Section */}
      <h2 className="text-2xl font-black text-slate-900 mb-8 tracking-tight uppercase border-b border-slate-200 pb-4">Event Challenges</h2>
      
      {eventTests.length === 0 ? (
        <div className="text-center py-24 bg-white border-2 border-dashed border-slate-200 rounded-[3rem]">
          <Award className="w-16 h-16 text-slate-200 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-800 mb-2">Tests being prepared</h3>
          <p className="text-slate-500 font-medium max-w-md mx-auto">The administrators haven't attached any specific challenges to this event yet. Check back soon!</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {eventTests.map((test) => {
            const isCompleted = false; // We could fetch user submissions here to check if they completed it
            const sectionClass = getTestStyles(test.section || test.type);
            
            return (
              <div key={test.id} className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm flex flex-col hover:shadow-xl hover:-translate-y-1 transition-all group">
                <div className={`w-fit px-3 py-1 pb-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest mb-6 border ${sectionClass}`}>
                  {test.section || test.type || 'Full Test'}
                </div>
                
                <h3 className="text-xl font-bold text-slate-800 mb-3 group-hover:text-primary-600 transition-colors uppercase tracking-tight">{test.title}</h3>
                <p className="text-sm font-medium text-slate-500 mb-8 line-clamp-2 flex-grow">{test.instructions || 'Follow the typical IELTS instructions for this section.'}</p>
                
                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="bg-slate-50 p-3 rounded-2xl flex flex-col">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Duration</span>
                    <span className="text-sm font-bold text-slate-700">{test.duration || '40'} mins</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-2xl flex flex-col">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Difficulty</span>
                    <span className="text-sm font-bold text-slate-700 capitalize">{test.difficulty || 'Mixed'}</span>
                  </div>
                </div>

                <Link
                  href={`/${test.section || test.type || 'taking'}/${test.id}`}
                  className="w-full flex items-center justify-center gap-2 py-4 bg-slate-900 hover:bg-black text-white font-black text-sm uppercase tracking-widest rounded-xl transition-colors shadow-lg shadow-slate-900/10"
                >
                  <PlayCircle className="w-4 h-4" />
                  Start Challenge
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
