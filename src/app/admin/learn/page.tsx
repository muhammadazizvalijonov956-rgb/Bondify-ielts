"use client";

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase/config';
import { collection, query, orderBy, getDocs, doc, setDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { Plus, Trash2, Edit, Code2, FolderTree, FileText } from 'lucide-react';

export default function AdminLearnPage() {
  const [activeTab, setActiveTab] = useState<'categories' | 'lessons'>('categories');
  const [loading, setLoading] = useState(true);

  // Data State
  const [categories, setCategories] = useState<any[]>([]);
  const [lessons, setLessons] = useState<any[]>([]);

  // Category Form State
  const [showCatForm, setShowCatForm] = useState(false);
  const [catId, setCatId] = useState('');
  const [catTitle, setCatTitle] = useState('');
  const [catDesc, setCatDesc] = useState('');

  // Lesson Form State
  const [showLessonForm, setShowLessonForm] = useState(false);
  const [lesId, setLesId] = useState('');
  const [lesCatId, setLesCatId] = useState('');
  const [lesTitle, setLesTitle] = useState('');
  const [lesDesc, setLesDesc] = useState('');
  const [lesContent, setLesContent] = useState('');
  const [lesExampleCode, setLesExampleCode] = useState('');
  const [lesExampleExp, setLesExampleExp] = useState('');
  const [lesTask, setLesTask] = useState('');
  const [lesLevel, setLesLevel] = useState('beginner'); // beginner | intermediate | advanced
  const [lesOrder, setLesOrder] = useState<number>(1);
  const [lesPublished, setLesPublished] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const catSnap = await getDocs(query(collection(db, 'learning_categories'), orderBy('created_at', 'asc')));
      const catList = catSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setCategories(catList);

      const lesSnap = await getDocs(query(collection(db, 'learning_lessons'), orderBy('order', 'asc')));
      const lesList = lesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setLessons(lesList);
    } catch (err) {
      console.error("Error fetching learn data", err);
    } finally {
      setLoading(false);
    }
  };

  // --- Category Actions ---
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catTitle || !catId.trim()) {
      alert("A unique ID and Title are required"); 
      return; 
    }
    const slug = catId.toLowerCase().replace(/[^a-z0-9\-]/g, '-');
    
    const isEditing = categories.some(c => c.id === slug);
    
    const payload: any = {
      title: catTitle,
      description: catDesc,
      updated_at: serverTimestamp()
    };

    if (!isEditing) {
      payload.created_at = serverTimestamp();
    }

    // Clean undefined fields
    Object.keys(payload).forEach(key => payload[key] === undefined && delete payload[key]);

    try {
      const docRef = doc(db, 'learning_categories', slug);
      if (isEditing) {
        await updateDoc(docRef, payload);
      } else {
        await setDoc(docRef, payload);
      }
      
      setShowCatForm(false);
      resetCatForm();
      fetchData();
    } catch (err: any) {
      console.error(err);
      alert("Save failed: " + err.message);
    }
  };

  const handleEditCategory = (cat: any) => {
    setCatId(cat.id);
    setCatTitle(cat.title);
    setCatDesc(cat.description || '');
    setShowCatForm(true);
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Delete this category? Cannot be undone.')) return;
    try {
      await deleteDoc(doc(db, 'learning_categories', id));
      fetchData();
    } catch (err) { console.error(err); }
  };

  const resetCatForm = () => {
    setCatId('');
    setCatTitle('');
    setCatDesc('');
    setShowCatForm(false);
  };


  // --- Lesson Actions ---
  const handleSaveLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lesCatId || !lesTitle) {
      alert("Category and Title required.");
      return;
    }
    
    const isEditing = !!lesId;
    const id = lesId || `lesson_${Date.now()}`;
    
    try {
      const payload: any = {
        category_id: lesCatId,
        title: lesTitle,
        description: lesDesc,
        content: lesContent,
        example_code: lesExampleCode,
        example_explanation: lesExampleExp,
        task: lesTask,
        level: lesLevel,
        order: Number(lesOrder),
        is_published: lesPublished,
        updated_at: serverTimestamp()
      };

      if (!isEditing) {
        payload.created_at = serverTimestamp();
      }

      // Important: Firestore rejects any field that is strictly 'undefined'
      Object.keys(payload).forEach(key => {
        if (payload[key] === undefined) {
          delete payload[key];
        }
      });

      const docRef = doc(db, 'learning_lessons', id);
      
      if (isEditing) {
        await updateDoc(docRef, payload);
      } else {
        await setDoc(docRef, payload);
      }
      
      setShowLessonForm(false);
      resetLessonForm();
      fetchData();
    } catch (err: any) {
      console.error("Firestore Save Error:", err);
      // Show real error message as requested
      alert(`Failed to save lesson: ${err.message || "Unknown error"}`);
    }
  };

  const handleEditLesson = (les: any) => {
    setLesId(les.id);
    setLesCatId(les.category_id);
    setLesTitle(les.title || '');
    setLesDesc(les.description || '');
    setLesContent(les.content || '');
    setLesExampleCode(les.example_code || '');
    setLesExampleExp(les.example_explanation || '');
    setLesTask(les.task || '');
    setLesLevel(les.level || 'beginner');
    setLesOrder(les.order || 1);
    setLesPublished(les.is_published || false);
    setShowLessonForm(true);
  };

  const handleDeleteLesson = async (id: string) => {
    if (!confirm('Delete this lesson?')) return;
    try {
      await deleteDoc(doc(db, 'learning_lessons', id));
      fetchData();
    } catch (err) { console.error(err); }
  };

  const resetLessonForm = () => {
    setLesId('');
    setLesTitle('');
    setLesDesc('');
    setLesContent('');
    setLesExampleCode('');
    setLesExampleExp('');
    setLesTask('');
    setLesOrder(1);
    setLesPublished(false);
    setShowLessonForm(false);
  };


  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between border-b border-slate-200 pb-6 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Code2 className="w-8 h-8 text-primary-600" /> Learning Manager
          </h1>
          <p className="text-slate-500 font-medium mt-1">Manage coding lessons, categories, and paths.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => { setActiveTab('categories'); setShowCatForm(false); setShowLessonForm(false); }}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${activeTab === 'categories' ? 'bg-primary-600 text-white shadow-lg' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
        >
          <FolderTree className="w-5 h-5" /> Categories
        </button>
        <button 
          onClick={() => { setActiveTab('lessons'); setShowCatForm(false); setShowLessonForm(false); }}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${activeTab === 'lessons' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
        >
          <FileText className="w-5 h-5" /> Lessons
        </button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-slate-400 font-black uppercase tracking-widest text-xs">Synchronizing Data...</div>
      ) : activeTab === 'categories' ? (
        <div className="space-y-6">
          {!showCatForm ? (
             <button onClick={() => { resetCatForm(); setShowCatForm(true); }} className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-black transition flex items-center gap-2">
               <Plus className="w-5 h-5" /> Add Category
             </button>
          ) : (
            <form onSubmit={handleSaveCategory} className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xl max-w-2xl animate-in fade-in">
              <h2 className="text-xl font-black mb-6">{catId ? 'Edit Category' : 'New Category'}</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Unique Slug ID (e.g. html)</label>
                  <input type="text" required value={catId} onChange={e => setCatId(e.target.value)} disabled={!!categories.find(c => c.id === catId)} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 font-mono disabled:opacity-50" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Title</label>
                  <input type="text" required value={catTitle} onChange={e => setCatTitle(e.target.value)} placeholder="e.g. HTML Fundamentals" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 font-bold" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Description</label>
                  <textarea value={catDesc} onChange={e => setCatDesc(e.target.value)} placeholder="Short outline of the category" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 h-24 resize-none" />
                </div>
                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={resetCatForm} className="px-6 py-2 font-bold text-slate-500 hover:bg-slate-100 rounded-lg">Cancel</button>
                  <button type="submit" className="px-6 py-2 font-black text-white bg-primary-600 hover:bg-primary-700 rounded-lg">Save Category</button>
                </div>
              </div>
            </form>
          )}

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map(cat => (
              <div key={cat.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col group">
                 <div className="flex justify-between items-start mb-3">
                   <span className="bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded font-mono">{cat.id}</span>
                   <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                     <button onClick={() => handleEditCategory(cat)} className="text-slate-400 hover:text-primary-600 p-1"><Edit className="w-4 h-4"/></button>
                     <button onClick={() => handleDeleteCategory(cat.id)} className="text-slate-400 hover:text-rose-600 p-1"><Trash2 className="w-4 h-4"/></button>
                   </div>
                 </div>
                 <h3 className="text-xl font-black text-slate-900 mb-2">{cat.title}</h3>
                 <p className="text-sm text-slate-500 font-medium line-clamp-2 leading-relaxed">{cat.description}</p>
                 <div className="mt-4 pt-4 border-t border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-widest">
                   {lessons.filter(l => l.category_id === cat.id).length} Lessons total
                 </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {!showLessonForm ? (
             <button onClick={() => { resetLessonForm(); setShowLessonForm(true); }} className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition flex items-center gap-2">
               <Plus className="w-5 h-5" /> Add Lesson
             </button>
          ) : (
            <form onSubmit={handleSaveLesson} className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xl animate-in fade-in">
              <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-6">
                <h2 className="text-xl font-black">{lesId ? 'Edit Lesson' : 'Create New Lesson'}</h2>
                <label className="flex items-center gap-2 font-bold cursor-pointer text-slate-700">
                  <input type="checkbox" checked={lesPublished} onChange={e => setLesPublished(e.target.checked)} className="w-5 h-5 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500" />
                  Published
                </label>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-5">
                   <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Category</label>
                        <select required value={lesCatId} onChange={e => setLesCatId(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 font-bold">
                          <option value="">-- Choose --</option>
                          {categories.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                        </select>
                     </div>
                     <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Level</label>
                        <select value={lesLevel} onChange={e => setLesLevel(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 font-bold capitalize">
                          <option value="beginner">Beginner</option>
                          <option value="intermediate">Intermediate</option>
                          <option value="advanced">Advanced</option>
                        </select>
                     </div>
                   </div>
                   
                   <div className="grid grid-cols-4 gap-4">
                     <div className="col-span-3">
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Lesson Title</label>
                        <input type="text" required value={lesTitle} onChange={e => setLesTitle(e.target.value)} placeholder="e.g. Intro to Variables" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 font-bold" />
                     </div>
                     <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Order No.</label>
                        <input type="number" required min="1" value={lesOrder} onChange={e => setLesOrder(Number(e.target.value))} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 font-bold text-center" />
                     </div>
                   </div>

                   <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Short Description</label>
                      <textarea value={lesDesc} onChange={e => setLesDesc(e.target.value)} placeholder="What will they learn?" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 h-20 resize-none font-medium text-sm" />
                   </div>
                   
                   <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Main Explanation Block</label>
                      <textarea value={lesContent} onChange={e => setLesContent(e.target.value)} placeholder="Keep it 2-4 lines long" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 h-28 resize-none font-medium text-sm leading-relaxed" />
                   </div>
                </div>

                <div className="space-y-5">
                   <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 flex justify-between">
                        Example Code Block 
                        <span className="text-indigo-400 lowercase font-mono bg-indigo-50 px-1 rounded border border-indigo-100">raw text</span>
                      </label>
                      <textarea value={lesExampleCode} onChange={e => setLesExampleCode(e.target.value)} placeholder="<h1>Hello</h1>" className="w-full px-4 py-3 bg-slate-800 border border-slate-700 text-green-400 rounded-lg focus:ring-2 focus:ring-indigo-500 h-32 font-mono text-sm leading-relaxed resize-none" />
                   </div>

                   <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Example Explanation</label>
                      <textarea value={lesExampleExp} onChange={e => setLesExampleExp(e.target.value)} placeholder="Explain the code..." className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 h-20 resize-none font-medium text-sm" />
                   </div>

                   <div>
                      <label className="block text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1.5">Interactive Task</label>
                      <textarea value={lesTask} onChange={e => setLesTask(e.target.value)} placeholder="e.g. Change the H1 color to blue in your local editor." className="w-full px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 h-20 resize-none font-bold text-amber-900 text-sm placeholder:text-amber-300" />
                   </div>
                </div>
              </div>

              <div className="flex gap-4 pt-8 justify-end border-t border-slate-100 mt-8">
                <button type="button" onClick={resetLessonForm} className="px-6 py-2.5 font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors">Cancel</button>
                <button type="submit" className="px-8 py-2.5 font-black text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-lg flex items-center gap-2">Save Lesson Data</button>
              </div>
            </form>
          )}

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
               <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-500">
                 <tr>
                   <th className="p-4">Status</th>
                   <th className="p-4">Category</th>
                   <th className="p-4">Level</th>
                   <th className="p-4">Order</th>
                   <th className="p-4 w-1/3">Title</th>
                   <th className="p-4 text-right">Actions</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
                  {lessons.map(les => {
                    const catTitle = categories.find(c => c.id === les.category_id)?.title || les.category_id;
                    return (
                      <tr key={les.id} className="hover:bg-slate-50 transition-colors group">
                        <td className="p-4">
                          <span className={`w-2 h-2 rounded-full inline-block ${les.is_published ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-300'}`}></span>
                        </td>
                        <td className="p-4 font-bold text-slate-900">{catTitle}</td>
                        <td className="p-4 capitalize">
                          <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest ${
                            les.level === 'beginner' ? 'bg-emerald-100 text-emerald-700' :
                            les.level === 'intermediate' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                          }`}>{les.level}</span>
                        </td>
                        <td className="p-4 text-slate-400 font-black">{les.order}</td>
                        <td className="p-4 font-bold text-indigo-900 truncate max-w-[200px]">{les.title}</td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleEditLesson(les)} className="text-slate-400 hover:text-indigo-600 p-1"><Edit className="w-4 h-4"/></button>
                            <button onClick={() => handleDeleteLesson(les.id)} className="text-slate-400 hover:text-rose-600 p-1"><Trash2 className="w-4 h-4"/></button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                  {lessons.length === 0 && (
                     <tr><td colSpan={6} className="p-8 text-center text-slate-500">No lessons built yet.</td></tr>
                  )}
               </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
