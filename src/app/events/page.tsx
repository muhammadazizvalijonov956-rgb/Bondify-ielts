"use client";

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase/config';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { Event } from '@/types';
import { Calendar, DollarSign, Users, Award, Lock, Clock, HelpCircle } from 'lucide-react';
import { useAuth } from '@/lib/contexts/AuthContext';

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();

  useEffect(() => {
    async function fetchEvents() {
      try {
        // We use orderBy('startDate') which requires the field to exist.
        // New events created via updated admin panel will have this.
        const q = query(collection(db, 'events'), orderBy('startDate', 'asc'));
        const snap = await getDocs(q);
        const fetchedEvents: Event[] = [];
        snap.forEach(doc => {
          fetchedEvents.push({ id: doc.id, ...doc.data() } as Event);
        });
        setEvents(fetchedEvents);
      } catch (err) {
        console.error("Error fetching events", err);
        // Fallback: fetch all without sorting if index or field is missing
        try {
          const snap = await getDocs(collection(db, 'events'));
          const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Event));
          setEvents(list);
        } catch (e) {
          console.error("Critical error fetching events", e);
        }
      } finally {
        setLoading(false);
      }
    }
    fetchEvents();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-6 py-16">
      <div className="text-center mb-16 space-y-4">
        <h1 className="text-5xl font-black text-slate-900 tracking-tight">Bondify Events</h1>
        <p className="text-slate-500 text-xl max-w-2xl mx-auto font-medium leading-relaxed">
          The ultimate arena for IELTS mastery. Compete, win, and level up.
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-4">
          <div className="animate-spin w-12 h-12 border-4 border-slate-200 border-t-primary-600 rounded-full"></div>
          <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Synchronizing Events...</p>
        </div>
      ) : events.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-[3rem] p-24 text-center flex flex-col items-center">
          <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
            <Calendar className="w-10 h-10 text-slate-200" />
          </div>
          <h3 className="text-2xl font-black text-slate-900 mb-2">Silence in the Arena</h3>
          <p className="text-slate-500 font-medium max-w-sm">No events are currently scheduled. Join our Discord to stay updated!</p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-10">
          {events.map((evt) => {
            const isPremiumUser = profile && ['go', 'plus', 'pro'].includes(profile.accountTier);
            const canAccess = evt.eligibility === 'public' || isPremiumUser;
            const participantsCount = Array.isArray(evt.participants) ? evt.participants.length : 0;
            const questionCount = Array.isArray(evt.questions) ? evt.questions.length : 0;

            return (
              <div key={evt.id} className="bg-white rounded-[3rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden flex flex-col transition-all hover:-translate-y-2 hover:shadow-2xl">
                <div className="h-64 relative">
                  {evt.bannerImageUrl ? (
                    <img src={evt.bannerImageUrl} alt={evt.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary-600 to-indigo-900 flex items-center justify-center">
                       <Award className="w-20 h-20 text-white/20" />
                    </div>
                  )}
                  <div className="absolute top-6 right-6 flex flex-col gap-2">
                    <span className={`font-black px-4 py-1.5 rounded-full text-[10px] shadow-lg uppercase tracking-wider backdrop-blur-md border ${
                      evt.status === 'active' ? 'bg-emerald-500/90 text-white border-white/20' :
                      evt.status === 'upcoming' ? 'bg-primary-500/90 text-white border-white/20' :
                      'bg-slate-900/90 text-white border-white/10'
                    }`}>
                      {evt.status}
                    </span>
                    {evt.eligibility === 'premium-only' && (
                      <span className="bg-amber-400 text-slate-900 font-black px-4 py-1.5 rounded-full flex items-center gap-1.5 text-[10px] shadow-lg border border-white/20 uppercase tracking-wider">
                        <Lock className="w-3 h-3"/> Premium
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-10 flex flex-col flex-grow">
                  <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight leading-tight uppercase">{evt.title}</h2>
                  <p className="text-slate-500 mb-10 font-medium leading-relaxed flex-grow line-clamp-3">{evt.description}</p>
                  
                  <div className="grid grid-cols-2 gap-4 mb-10">
                    <div className="bg-slate-50 p-5 rounded-[2rem] border border-slate-100">
                       <div className="text-[10px] font-black text-slate-400 uppercase mb-2 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5"/> Date</div>
                       <div className="text-sm font-black text-slate-800">{new Date(evt.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                    </div>
                    <div className="bg-slate-50 p-5 rounded-[2rem] border border-slate-100">
                       <div className="text-[10px] font-black text-slate-400 uppercase mb-2 flex items-center gap-1.5"><Users className="w-3.5 h-3.5"/> Joined</div>
                       <div className="text-sm font-black text-slate-800">{participantsCount} Scholars</div>
                    </div>
                    <div className="bg-emerald-50 p-5 rounded-[2rem] border border-emerald-100">
                       <div className="text-[10px] font-black text-emerald-400 uppercase mb-2 flex items-center gap-1.5"><DollarSign className="w-3.5 h-3.5"/> Prize</div>
                       <div className="text-sm font-black text-emerald-600">{evt.prizePool}</div>
                    </div>
                    <div className="bg-amber-50 p-5 rounded-[2rem] border border-amber-100">
                       <div className="text-[10px] font-black text-amber-500 uppercase mb-2 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5"/> Setup</div>
                       <div className="text-sm font-black text-amber-700">{evt.duration}m / {questionCount} Qs</div>
                    </div>
                  </div>

                  <button 
                    disabled={!canAccess || evt.status === 'completed'} 
                    className={`w-full font-black py-4 rounded-2xl transition-all shadow-xl flex justify-center items-center gap-2 text-sm tracking-widest uppercase ${
                      !canAccess ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none' :
                      evt.status === 'completed' ? 'bg-slate-900 text-white cursor-not-allowed' :
                      evt.status === 'active' ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20' : 
                      'bg-primary-600 hover:bg-primary-700 text-white shadow-primary-500/20'
                    }`}
                  >
                    {!canAccess ? <><Lock className="w-4 h-4" /> Unlock Premium</> :
                     evt.status === 'completed' ? <><Award className="w-4 h-4"/> Event Ended</> :
                     evt.status === 'active' ? 'Enter Live Event' : 
                     'Register & Remind Me'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
