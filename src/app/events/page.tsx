"use client";

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase/config';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { Event } from '@/types';
import { Calendar, DollarSign, Users, Award, Lock, ExternalLink } from 'lucide-react';
import { useAuth } from '@/lib/contexts/AuthContext';

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();

  useEffect(() => {
    async function fetchEvents() {
      try {
        const q = query(collection(db, 'events'), orderBy('startDate', 'asc'));
        const snap = await getDocs(q);
        const fetchedEvents: Event[] = [];
        snap.forEach(doc => {
          fetchedEvents.push(doc.data() as Event);
        });
        setEvents(fetchedEvents);
      } catch (err) {
        console.error("Error fetching events", err);
      } finally {
        setLoading(false);
      }
    }
    fetchEvents();
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">Bondify Events & Competitions</h1>
        <p className="text-slate-600 text-lg max-w-2xl mx-auto">
          Participate in exclusive events, compete for real cash prizes, and improve your IELTS skills under pressure.
        </p>
      </div>

      {loading ? (
        <div className="text-center text-slate-500 py-12">Loading upcoming events...</div>
      ) : events.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center text-slate-500 font-medium">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4"/>
          No events scheduled right now. Check back soon!
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-8">
          {events.map((evt) => {
            const isPremiumUser = profile && ['go', 'plus', 'pro'].includes(profile.accountTier);
            const canAccess = evt.eligibility === 'public' || isPremiumUser;

            return (
              <div key={evt.id} className="bg-white rounded-3xl shadow-lg border border-slate-200 overflow-hidden flex flex-col transition-transform hover:-translate-y-1">
                {/* Banner Placeholder */}
                <div className="h-48 bg-gradient-to-br from-primary-600 to-indigo-800 relative">
                  {evt.bannerImageUrl && <img src={evt.bannerImageUrl} alt={evt.title} className="w-full h-full object-cover opacity-80 mix-blend-overlay" />}
                  <div className="absolute top-4 right-4 bg-yellow-400 text-slate-900 font-bold px-3 py-1 rounded-full text-xs shadow-md">
                    {evt.status.toUpperCase()}
                  </div>
                  <div className="absolute bottom-4 left-4 flex gap-2">
                    {evt.eligibility === 'premium-only' && (
                      <span className="bg-amber-500 text-white font-bold px-3 py-1 rounded flex items-center gap-1 text-xs shadow-sm">
                        <Lock className="w-3 h-3"/> Premium Only
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-8 flex flex-col flex-grow">
                  <h2 className="text-2xl font-bold text-slate-900 mb-3">{evt.title}</h2>
                  <p className="text-slate-600 mb-6 flex-grow">{evt.description}</p>
                  
                  <div className="space-y-3 mb-8 bg-slate-50 p-4 rounded-xl border border-slate-100 font-medium text-sm text-slate-700">
                    <div className="flex items-center gap-3"><Calendar className="w-4 h-4 text-primary-500"/> Starts: {new Date(evt.startDate).toLocaleDateString()}</div>
                    <div className="flex items-center gap-3"><Users className="w-4 h-4 text-primary-500"/> Participants: {evt.participants.length} / 100</div>
                    <div className="flex items-center gap-3"><DollarSign className="w-4 h-4 text-emerald-500"/> Prize Pool: <span className="text-emerald-600 font-bold">${evt.prizePool}</span></div>
                  </div>

                  <button 
                    disabled={!canAccess || evt.status !== 'upcoming'} 
                    className={`w-full font-bold py-3 rounded-xl transition-all shadow-sm flex justify-center items-center gap-2 ${
                      !canAccess ? 'bg-slate-100 text-slate-400 cursor-not-allowed' :
                      evt.status !== 'upcoming' ? 'bg-slate-200 text-slate-500 cursor-not-allowed' :
                      'bg-primary-600 hover:bg-primary-700 text-white hover:shadow-md'
                    }`}
                  >
                    {!canAccess ? <><Lock className="w-4 h-4" /> Upgrade to Join</> :
                     evt.status === 'completed' ? <><Award className="w-4 h-4"/> View Results</> :
                     evt.status === 'active' ? 'Event In Progress' : 
                     'Register Now'}
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
