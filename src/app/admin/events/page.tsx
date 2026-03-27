"use client";

import { useEffect, useState } from 'react';
import { collection, getDocs, deleteDoc, doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Calendar, Plus, Edit, Trash2, CalendarClock, Users, CheckCircle, Clock } from 'lucide-react';

export default function AdminEventsPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  
  // Create State
  const [formData, setFormData] = useState({
    id: '', title: '', description: '', status: 'scheduled', 
    prizePool: '100 Tokens', maxParticipants: '1000'
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'events'));
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setEvents(list);
    } catch (err) {
      console.error("Failed to load events", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.id.trim()) return alert('Event ID required');
    try {
      await setDoc(doc(db, 'events', formData.id), {
        ...formData,
        createdAt: new Date().toISOString()
      });
      setShowForm(false);
      setFormData({id: '', title: '', description: '', status: 'scheduled', prizePool: '', maxParticipants: ''});
      fetchEvents();
    } catch (err) {
      alert("Failed to save event");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete event permanently?')) return;
    try {
      await deleteDoc(doc(db, 'events', id));
      setEvents(events.filter(e => e.id !== id));
    } catch (err) {
      alert("Failed to delete");
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Event Management</h1>
          <p className="text-slate-500 font-medium mt-1">Schedule and manage competitive tests and giveaways.</p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-colors flex items-center gap-2"
        >
          {showForm ? 'Cancel Creation' : <><Plus className="w-5 h-5"/> Schedule Event</>}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSaveEvent} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 mb-8 animate-in fade-in slide-in-from-top-4">
          <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            <CalendarClock className="w-5 h-5 text-primary-500"/>
            New Event Configuration
          </h2>
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-bold text-slate-600 mb-2">Event ID</label>
              <input required type="text" value={formData.id} onChange={e => setFormData({...formData, id: e.target.value})} placeholder="e.g. spring_sprint_2026" className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 font-mono text-sm"/>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-600 mb-2">Event Title</label>
              <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="e.g. The Global Reading Challenge" className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500"/>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-600 mb-2">Description</label>
              <textarea required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm h-20"/>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-600 mb-2">Prize Pool</label>
              <input type="text" value={formData.prizePool} onChange={e => setFormData({...formData, prizePool: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500"/>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-600 mb-2">Status</label>
              <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 bg-slate-50 font-bold text-slate-700">
                <option value="draft">Draft</option>
                <option value="scheduled">Scheduled</option>
                <option value="live">Live (Active)</option>
                <option value="ended">Ended</option>
              </select>
            </div>
          </div>
          <button type="submit" className="bg-slate-900 hover:bg-black text-white px-8 py-3 rounded-xl font-bold shadow-sm w-full md:w-auto">
            Save and Distribute Event
          </button>
        </form>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {loading ? (
          <div className="md:col-span-2 p-12 text-center text-slate-500 font-bold">Loading scheduled events...</div>
        ) : events.length === 0 ? (
          <div className="md:col-span-2 p-12 bg-white rounded-3xl border border-slate-200 text-center text-slate-500 font-bold flex flex-col items-center">
            <Calendar className="w-16 h-16 text-slate-200 mb-4" />
            No events scheduled yet. Create one to engage premium users.
          </div>
        ) : (
          events.map(event => (
            <div key={event.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col relative overflow-hidden group hover:border-primary-200 transition-colors">
              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase flex items-center gap-1.5 ${
                  event.status === 'live' ? 'bg-emerald-100 text-emerald-700 animate-pulse' :
                  event.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                  event.status === 'ended' ? 'bg-rose-100 text-rose-700' :
                  'bg-slate-100 text-slate-500'
                }`}>
                  {event.status === 'live' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>}
                  {event.status}
                </div>
                <div className="flex gap-2">
                  <button className="text-slate-400 hover:text-primary-600"><Edit className="w-4 h-4"/></button>
                  <button onClick={() => handleDelete(event.id)} className="text-slate-400 hover:text-rose-600"><Trash2 className="w-4 h-4"/></button>
                </div>
              </div>
              
              <h3 className="text-xl font-black text-slate-900 mb-2 relative z-10">{event.title}</h3>
              <p className="text-sm font-medium text-slate-500 mb-6 flex-1 relative z-10">{event.description}</p>
              
              <div className="grid grid-cols-2 gap-4 mt-auto pt-4 border-t border-slate-100 relative z-10">
                <div>
                  <div className="text-xs font-bold text-slate-400 uppercase mb-1 flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5"/> Reward</div>
                  <div className="text-sm font-bold text-emerald-600">{event.prizePool}</div>
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-400 uppercase mb-1 flex items-center gap-1"><Users className="w-3.5 h-3.5"/> Participants</div>
                  <div className="text-sm font-bold text-slate-700">0 / {event.maxParticipants}</div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
}
