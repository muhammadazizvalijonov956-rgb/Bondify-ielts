"use client";

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase/config';
import { collection, query, orderBy, getDocs, doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { Plus, Trash2, Edit, Sparkles, Wand2, Globe, FileText, CheckCircle2 } from 'lucide-react';

export default function AdminUpdatesPage() {
  const [updates, setUpdates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [id, setId] = useState('');
  const [title, setTitle] = useState('');
  const [type, setType] = useState('improvement'); // "new", "improvement", "fix", "announcement"
  const [shortNote, setShortNote] = useState('');
  const [aiContent, setAiContent] = useState('');
  const [isPublished, setIsPublished] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchUpdates();
  }, []);

  const fetchUpdates = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'updates'), orderBy('created_at', 'desc'));
      const snap = await getDocs(q);
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUpdates(list);
    } catch (err) {
      console.error("Error fetching updates", err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAI = async () => {
    if (!title || !shortNote) {
      alert("Please enter a Title and Short Note first.");
      return;
    }
    
    setGenerating(true);
    try {
      const res = await fetch('/api/updates/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, type, short_note: shortNote })
      });
      const data = await res.json();
      if (data.ai_content) {
        setAiContent(data.ai_content);
      } else {
        alert("Failed to generate content.");
      }
    } catch (err) {
      console.error("AI Generation Error", err);
      alert("Error generating content.");
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !type || !aiContent) {
      alert("Title, Type, and AI Content are required.");
      return;
    }

    const updateId = id || `update_${Date.now()}`;
    const payload = {
      title,
      type,
      short_note: shortNote,
      ai_content: aiContent,
      is_published: isPublished,
      created_at: id && isEditing ? undefined : serverTimestamp(), 
      updated_at: serverTimestamp()
    };

    try {
      await setDoc(doc(db, 'updates', updateId), payload, { merge: true });
      setShowForm(false);
      resetForm();
      fetchUpdates();
    } catch (err) {
      console.error("Save error", err);
      alert("Failed to save update.");
    }
  };

  const handleEdit = (update: any) => {
    setId(update.id);
    setTitle(update.title);
    setType(update.type);
    setShortNote(update.short_note || '');
    setAiContent(update.ai_content || '');
    setIsPublished(update.is_published || false);
    setIsEditing(true);
    setShowForm(true);
  };

  const handleDelete = async (deleteId: string) => {
    if (!confirm("Are you sure you want to delete this update?")) return;
    try {
      await deleteDoc(doc(db, 'updates', deleteId));
      fetchUpdates();
    } catch (err) {
      console.error("Delete error", err);
      alert("Failed to delete.");
    }
  };

  const resetForm = () => {
    setId('');
    setTitle('');
    setType('improvement');
    setShortNote('');
    setAiContent('');
    setIsPublished(false);
    setIsEditing(false);
  };

  // Bonus: Auto-suggest type based on title keywords
  const handleTitleChange = (val: string) => {
    setTitle(val);
    const lower = val.toLowerCase();
    if (lower.includes('fix') || lower.includes('bug') || lower.includes('resolve')) {
      setType('fix');
    } else if (lower.includes('new') || lower.includes('launch') || lower.includes('introduce')) {
      setType('new');
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between border-b border-slate-200 pb-6 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Updates Manager</h1>
          <p className="text-slate-500 font-medium mt-1">Manage changelogs and broadcast system updates.</p>
        </div>
        {!showForm && (
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-colors flex items-center gap-2"
          >
            <Plus className="w-5 h-5" /> Create Update
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSave} className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xl mb-12 animate-in fade-in slide-in-from-top-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-black text-slate-800">{isEditing ? 'Edit Update' : 'Draft New Update'}</h2>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                <input 
                  type="checkbox" 
                  checked={isPublished} 
                  onChange={(e) => setIsPublished(e.target.checked)}
                  className="w-5 h-5 rounded border-slate-300 text-primary-600 focus:ring-primary-600"
                />
                Publish Target
              </label>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Left: Input */}
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Title</label>
                <input 
                  required 
                  type="text" 
                  value={title} 
                  onChange={(e) => handleTitleChange(e.target.value)} 
                  placeholder="e.g. New Speaking Test Evaluation Engine" 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 font-bold text-slate-900" 
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Type</label>
                <select 
                  value={type} 
                  onChange={(e) => setType(e.target.value)} 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 font-medium text-slate-800"
                >
                  <option value="new">🆕 New Feature</option>
                  <option value="improvement">📈 Improvement</option>
                  <option value="fix">🛠️ Bug Fix</option>
                  <option value="announcement">📢 Announcement</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Short Note (Context for AI)</label>
                <textarea 
                  required 
                  value={shortNote} 
                  onChange={(e) => setShortNote(e.target.value)} 
                  placeholder="Raw notes. e.g. 'Added AI feedback for speaking test. Uses voice chunks. Way faster.'" 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 font-medium text-slate-700 h-28 resize-none" 
                />
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleGenerateAI}
                  disabled={generating || !title || !shortNote}
                  className="w-full bg-slate-900 hover:bg-black text-white font-black py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 transition-all"
                >
                  {generating ? (
                    <><Sparkles className="w-5 h-5 animate-spin" /> Analyzing & Generating...</>
                  ) : (
                    <><Wand2 className="w-5 h-5 text-amber-400" /> Generate with AI</>
                  )}
                </button>
              </div>
            </div>

            {/* Right: AI Output */}
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 flex flex-col">
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center justify-between">
                <span>AI Generated Content</span>
                <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded text-[10px]">Editable</span>
              </label>
              
              <textarea 
                value={aiContent} 
                onChange={(e) => setAiContent(e.target.value)} 
                placeholder="The AI will generate professional, 3-5 sentence copy here based on your short notes."
                className="w-full flex-grow bg-white border border-slate-200 rounded-xl p-6 focus:ring-2 focus:ring-primary-500 font-medium text-slate-800 leading-relaxed min-h-[250px] shadow-inner resize-none" 
              />
              
              <div className="mt-6 flex items-center gap-4">
                <button 
                  type="button" 
                  onClick={() => { setShowForm(false); resetForm(); }}
                  className="px-6 py-3 font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-grow bg-primary-600 hover:bg-primary-700 text-white font-black py-3 rounded-xl shadow-lg transition-colors flex justify-center items-center gap-2"
                >
                  <CheckCircle2 className="w-5 h-5" /> Save & {isPublished ? 'Publish' : 'Draft'}
                </button>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* List */}
      <div className="grid gap-4">
        {loading ? (
          <div className="py-12 text-center text-slate-400 font-black uppercase tracking-widest text-xs">Loading Updates...</div>
        ) : updates.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-3xl border-2 border-dashed border-slate-200 text-slate-500 font-medium">No updates found.</div>
        ) : (
          updates.map((update) => (
            <div key={update.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-6 group hover:border-primary-200 transition-colors">
              <div className="flex-grow">
                <div className="flex items-center gap-3 mb-2">
                  <span className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded-full border ${
                    update.type === 'new' ? 'bg-primary-50 text-primary-700 border-primary-200' :
                    update.type === 'improvement' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                    update.type === 'fix' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                    'bg-slate-100 text-slate-700 border-slate-200'
                  }`}>
                    {update.type}
                  </span>
                  <h3 className="text-lg font-black text-slate-900 leading-none">{update.title}</h3>
                  <span className={`ml-auto px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded flex items-center gap-1 ${update.is_published ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'}`}>
                    {update.is_published ? <><Globe className="w-3 h-3" /> Published</> : <><FileText className="w-3 h-3"/> Draft</>}
                  </span>
                </div>
                <p className="text-sm font-medium text-slate-500 line-clamp-2 pr-12">{update.ai_content}</p>
              </div>
              
              <div className="flex gap-2">
                <button onClick={() => handleEdit(update)} className="p-2.5 text-slate-400 hover:text-primary-600 bg-slate-50 hover:bg-primary-50 rounded-xl transition-all">
                  <Edit className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(update.id)} className="p-2.5 text-slate-400 hover:text-rose-600 bg-slate-50 hover:bg-rose-50 rounded-xl transition-all">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
