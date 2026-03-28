"use client";

import { useEffect, useState } from 'react';
import { collection, getDocs, deleteDoc, doc, setDoc, query, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import {
  Calendar, Plus, Edit, Trash2, CalendarClock, Users, CheckCircle,
  Clock, Image as ImageIcon, Shield, HelpCircle, X, Save
} from 'lucide-react';
import { Event } from '@/types';

export default function AdminEventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<'reading' | 'listening' | 'writing' | 'speaking'>('reading');

  // Comprehensive Form State
  const [formData, setFormData] = useState<Partial<Event>>({
    id: '',
    title: '',
    description: '',
    bannerImageUrl: '',
    eligibility: 'public',
    prizePool: '100 Tokens',
    startDate: new Date().toISOString().slice(0, 16),
    endDate: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
    duration: 60,
    status: 'upcoming',
    questions: [],
    reading: [],
    listening: [],
    writing: [],
    speaking: [],
    participants: [],
    winners: []
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const qry = query(collection(db, 'events'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(qry);
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Event[];
      setEvents(list);
    } catch (err) {
      console.error("Failed to load events", err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (event: Event) => {
    setFormData({
      ...event,
      startDate: event.startDate?.slice(0, 16) || new Date().toISOString().slice(0, 16),
      endDate: event.endDate?.slice(0, 16) || new Date().toISOString().slice(0, 16),
    });
    setIsEditing(true);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setIsEditing(false);
    setActiveTab('reading');
    setFormData({
      id: '', title: '', description: '', status: 'upcoming',
      prizePool: '100 Tokens', eligibility: 'public', duration: 60,
      questions: [], reading: [], listening: [], writing: [], speaking: [], bannerImageUrl: '',
      startDate: new Date().toISOString().slice(0, 16),
      endDate: new Date(Date.now() + 86400000).toISOString().slice(0, 16)
    });
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.id?.trim()) return alert('Event ID required');

    try {
      const eventToSave = {
        ...formData,
        createdAt: isEditing ? (formData.createdAt || new Date().toISOString()) : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        participants: formData.participants || [],
        winners: formData.winners || [],
        questions: formData.questions || [],
        reading: formData.reading || [],
        listening: formData.listening || [],
        writing: formData.writing || [],
        speaking: formData.speaking || []
      };

      await setDoc(doc(db, 'events', formData.id), eventToSave);
      alert(isEditing ? "Event updated successfully!" : "Event created and published!");
      handleCancel();
      fetchEvents();
    } catch (err) {
      console.error(err);
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

  // Question Management
  const addQuestion = (section: 'reading' | 'listening' | 'writing' | 'speaking') => {
    const list = formData[section] || [];
    const newQ = {
      id: list.length + 1,
      text: '',
      type: 'multiple_choice',
      options: ['', '', '', ''],
      correctAnswer: ''
    };
    setFormData({ ...formData, [section]: [...list, newQ] });
  };

  const removeQuestion = (section: 'reading' | 'listening' | 'writing' | 'speaking', index: number) => {
    const list = [...(formData[section] || [])];
    list.splice(index, 1);
    setFormData({ ...formData, [section]: list });
  };

  const updateQuestion = (section: 'reading' | 'listening' | 'writing' | 'speaking', index: number, field: string, value: any) => {
    const list = [...(formData[section] || [])];
    list[index] = { ...list[index], [field]: value };
    setFormData({ ...formData, [section]: list });
  };
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Event Management</h1>
          <p className="text-slate-500 font-medium mt-1">Control high-stakes tests, competitions, and user prizes.</p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-3.5 px-8 rounded-2xl shadow-xl shadow-primary-500/20 transition-all flex items-center gap-2"
          >
            <Plus className="w-5 h-5" /> Schedule New Event
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSaveEvent} className="bg-white rounded-[2rem] shadow-2xl border border-slate-200 p-8 mb-12 animate-in fade-in zoom-in duration-300">
          <div className="flex justify-between items-center mb-10">
            <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
              <div className="p-3 bg-primary-100 rounded-2xl">
                <CalendarClock className="w-6 h-6 text-primary-600" />
              </div>
              {isEditing ? `Editing: ${formData.title}` : 'Configure New Event'}
            </h2>
            <button type="button" onClick={handleCancel} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {/* Basic Info */}
              <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100">
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <Plus className="w-4 h-4" /> General Information
                </h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-black text-slate-500 mb-2 uppercase ml-1">Event Title</label>
                    <input required type="text" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="e.g. Master IELTS Challenge: March Edition" className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all font-bold text-slate-800 placeholder:text-slate-300 shadow-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-500 mb-2 uppercase ml-1">Event ID (Unique Slug)</label>
                    <input required type="text" disabled={isEditing} value={formData.id} onChange={e => setFormData({ ...formData, id: e.target.value.toLowerCase().replace(/\s+/g, '_') })} placeholder="march_challenge_2026" className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all font-mono text-sm disabled:bg-slate-100 disabled:text-slate-400 shadow-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-500 mb-2 uppercase ml-1">Banner Image URL</label>
                    <div className="relative">
                      <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                      <input type="url" value={formData.bannerImageUrl || ''} onChange={e => setFormData({ ...formData, bannerImageUrl: e.target.value })} placeholder="https://..." className="w-full pl-11 pr-5 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all text-sm shadow-sm" />
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-black text-slate-500 mb-2 uppercase ml-1">Description</label>
                    <textarea required value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Describe the event, rules, and rules for participants..." className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all text-slate-700 min-h-[120px] shadow-sm" />
                  </div>
                </div>
              </div>

              {/* Sections Builder */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <HelpCircle className="w-4 h-4" /> Event Sections
                  </h3>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6 border-b border-slate-100 pb-4 overflow-x-auto custom-scrollbar">
                  {(['reading', 'listening', 'writing', 'speaking'] as const).map(tab => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActiveTab(tab)}
                      className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-primary-600 text-white shadow-md shadow-primary-500/20' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                <div className="flex items-center justify-between mb-6">
                  <h4 className="text-xs font-bold text-slate-600 uppercase tracking-widest">{activeTab} Questions</h4>
                  <button type="button" onClick={() => addQuestion(activeTab)} className="text-primary-600 font-bold text-xs bg-primary-50 px-4 py-2 rounded-xl hover:bg-primary-100 transition-colors">
                    + Add Question
                  </button>
                </div>

                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar lg:min-h-[300px]">
                  {!(formData[activeTab]?.length) ? (
                    <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-2xl text-slate-400 text-sm font-bold bg-slate-50/30 w-full flex flex-col items-center justify-center">
                      <HelpCircle className="w-8 h-8 mb-3 text-slate-200" />
                      No questions configured for {activeTab}.
                    </div>
                  ) : (
                    formData[activeTab]?.map((q, idx) => (
                      <div key={idx} className="p-6 bg-slate-50 rounded-2xl border border-slate-100 relative group animate-in slide-in-from-bottom-2 fade-in duration-200">
                        <button type="button" onClick={() => removeQuestion(activeTab, idx)} className="absolute top-4 right-4 text-slate-300 hover:text-rose-500 transition-colors bg-white hover:bg-rose-50 p-1.5 rounded-lg shadow-sm border border-slate-100">
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <div className="grid gap-5">
                          <div className="flex items-center gap-4 pr-12">
                            <span className="w-8 h-8 shrink-0 rounded-full bg-slate-900 text-white flex items-center justify-center font-black text-xs shadow-md shadow-slate-900/20">{idx + 1}</span>
                            <input required type="text" value={q.text || ''} onChange={e => updateQuestion(activeTab, idx, 'text', e.target.value)} placeholder={`Enter ${activeTab} question text...`} className="flex-1 bg-transparent border-b-2 border-slate-200 focus:border-primary-500 py-2 outline-none font-bold text-slate-800 text-lg transition-colors placeholder:text-slate-300" />
                          </div>

                          {activeTab !== 'writing' && activeTab !== 'speaking' && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2 pl-12">
                              {q.options?.map((opt: string, oi: number) => (
                                <div key={oi} className="flex gap-2 items-center bg-white p-1 pr-2 rounded-xl border border-slate-200 focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-500/10 transition-all">
                                  <span className="w-6 h-6 shrink-0 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-500 ml-1">{String.fromCharCode(65 + oi)}</span>
                                  <input required type="text" value={opt || ''} onChange={e => {
                                    let opts = q.options ? [...q.options] : ['', '', '', ''];
                                    opts[oi] = e.target.value;
                                    updateQuestion(activeTab, idx, 'options', opts);
                                  }} placeholder={`Option ${String.fromCharCode(65 + oi)}`} className="flex-1 px-2 py-2 bg-transparent text-sm outline-none font-medium text-slate-700 placeholder:text-slate-300" />
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="mt-2 pl-12 flex items-center justify-between border-t border-slate-100 pt-4">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> Correct Answer
                            </label>
                            {activeTab !== 'writing' && activeTab !== 'speaking' ? (
                              <input required maxLength={1} type="text" value={q.correctAnswer || ''} onChange={e => updateQuestion(activeTab, idx, 'correctAnswer', e.target.value.toUpperCase())} placeholder="A" className="w-16 h-12 text-center bg-emerald-50 border-2 border-emerald-100 rounded-xl font-black text-emerald-600 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 outline-none transition-all placeholder:text-emerald-200 text-lg uppercase shadow-inner" />
                            ) : (
                              <textarea value={q.correctAnswer || ''} onChange={e => updateQuestion(activeTab, idx, 'correctAnswer', e.target.value)} placeholder="Guidelines / Suggested answer" className="flex-1 ml-4 h-12 bg-emerald-50 border-2 border-emerald-100 rounded-xl font-medium text-emerald-700 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 outline-none transition-all placeholder:text-emerald-200 text-sm px-4 py-3" />
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-8">
              {/* Configuration */}
              <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-900/40 sticky top-8">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-8 flex items-center gap-2">
                  <Shield className="w-4 h-4" /> Logistics & Security
                </h3>

                <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-tight">Prize Pool</label>
                    <input type="text" value={formData.prizePool} onChange={e => setFormData({ ...formData, prizePool: e.target.value })} className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-5 py-3 text-emerald-400 font-black outline-none focus:ring-2 focus:ring-emerald-500/30" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-tight">Start Date</label>
                      <input required type="datetime-local" value={formData.startDate} onChange={e => setFormData({ ...formData, startDate: e.target.value })} className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3 text-xs font-bold outline-none focus:ring-2 focus:ring-primary-500/30" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-tight">End Date</label>
                      <input required type="datetime-local" value={formData.endDate} onChange={e => setFormData({ ...formData, endDate: e.target.value })} className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3 text-xs font-bold outline-none focus:ring-2 focus:ring-primary-500/30" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-tight flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-amber-500" /> Duration (Minutes)
                    </label>
                    <input required type="number" value={formData.duration} onChange={e => setFormData({ ...formData, duration: parseInt(e.target.value) })} className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-5 py-3 text-amber-400 font-black outline-none focus:ring-2 focus:ring-amber-500/30" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-tight">Eligibility</label>
                      <select value={formData.eligibility} onChange={e => setFormData({ ...formData, eligibility: e.target.value as any })} className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3 text-xs font-black outline-none">
                        <option value="public">Public</option>
                        <option value="premium-only">Premium Only</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-tight">Set Status</label>
                      <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value as any })} className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3 text-xs font-black outline-none">
                        <option value="upcoming">Upcoming</option>
                        <option value="active">Active (LIVE)</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-slate-800 flex flex-col gap-3">
                    <button type="submit" className="w-full bg-primary-500 hover:bg-primary-600 text-white font-black py-4 rounded-[1.25rem] shadow-lg shadow-primary-500/20 transition-all flex items-center justify-center gap-2">
                      <Save className="w-5 h-5" />
                      {isEditing ? 'UPDATE EVENT' : 'PUBLISH EVENT'}
                    </button>
                    <button type="button" onClick={handleCancel} className="w-full bg-transparent hover:bg-slate-800 text-slate-400 font-bold py-3 text-sm transition-all rounded-xl">
                      Discard Changes
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* Events List */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {loading ? (
          <div className="md:col-span-3 p-24 text-center">
            <div className="animate-spin w-10 h-10 border-4 border-slate-200 border-t-primary-600 rounded-full mx-auto mb-6"></div>
            <p className="text-slate-500 font-black uppercase tracking-widest text-xs">Fetching Event Registry...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="md:col-span-3 p-24 bg-white rounded-[3rem] border border-slate-200 text-center flex flex-col items-center">
            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
              <Calendar className="w-10 h-10 text-slate-200" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-2">Registry Empty</h3>
            <p className="text-slate-500 font-medium max-w-sm mb-8">No events have been created. Click "Schedule New Event" to get started.</p>
          </div>
        ) : (
          events.map(event => (
            <div key={event.id} className="bg-white rounded-[2.5rem] shadow-sm border-2 border-slate-100 hover:border-primary-100 p-8 flex flex-col relative overflow-hidden group transition-all hover:shadow-2xl hover:shadow-slate-200/50 hover:-translate-y-2">
              <div className="flex justify-between items-start mb-6 relative z-10">
                <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase flex items-center gap-2 ${event.status === 'active' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 ring-4 ring-emerald-500/10' :
                    event.status === 'upcoming' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                      event.status === 'completed' ? 'bg-slate-50 text-slate-500 border border-slate-100' :
                        'bg-slate-100 text-slate-500'
                  }`}>
                  {event.status === 'active' && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>}
                  {event.status}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(event)} className="p-2.5 bg-slate-50 hover:bg-primary-50 text-slate-400 hover:text-primary-600 rounded-2xl transition-all shadow-sm">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(event.id)} className="p-2.5 bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-2xl transition-all shadow-sm">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <h3 className="text-2xl font-black text-slate-900 mb-3 leading-tight group-hover:text-primary-600 transition-colors uppercase tracking-tight">{event.title}</h3>
              <p className="text-sm font-medium text-slate-500 mb-8 flex-1 line-clamp-3 leading-relaxed">{event.description}</p>

              <div className="grid grid-cols-2 gap-6 mt-auto pt-6 border-t border-slate-50 relative z-10 bg-slate-50/50 -mx-8 -mb-8 p-8">
                <div>
                  <div className="text-[10px] font-black text-slate-400 uppercase mb-2 flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5" /> Reward</div>
                  <div className="text-lg font-black text-emerald-600 tracking-tight">{event.prizePool}</div>
                </div>
                <div>
                  <div className="text-[10px] font-black text-slate-400 uppercase mb-2 flex items-center gap-1.5"><HelpCircle className="w-3.5 h-3.5" /> Questions</div>
                  <div className="text-lg font-black text-slate-800 tracking-tight">{(event.reading?.length || 0) + (event.listening?.length || 0) + (event.writing?.length || 0) + (event.speaking?.length || 0) || (event.questions?.length || 0)} ITEMS</div>
                </div>
                <div className="col-span-2 pt-2">
                  <div className="text-[10px] font-black text-slate-400 uppercase mb-2 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Schedule</div>
                  <div className="text-xs font-bold text-slate-700">
                    {new Date(event.startDate).toLocaleDateString()} — {new Date(event.endDate).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
}
