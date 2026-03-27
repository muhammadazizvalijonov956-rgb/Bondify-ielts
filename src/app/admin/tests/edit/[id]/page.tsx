"use client";

import { useEffect, useState } from 'react';
import { doc, getDoc, updateDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { supabase } from '@/lib/supabase/config';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, UploadCloud } from 'lucide-react';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import PartItemsBuilder from '@/components/admin/PartItemsBuilder';

export default function EditTestPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const testId = params.id;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Primary Test Metadata
  const [title, setTitle] = useState('');
  const [section, setSection] = useState('listening');
  const [status, setStatus] = useState('draft'); 
  const [instructions, setInstructions] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [duration, setDuration] = useState('40');
  

  // Media
  const [existingAudioUrls, setExistingAudioUrls] = useState<string[]>(['', '', '', '']);
  const [audioUrlInputs, setAudioUrlInputs] = useState<string[]>(['', '', '', '']);
  const [audioFiles, setAudioFiles] = useState<(File | null)[]>([null, null, null, null]);

  // Dynamic Content (parts and questions)
  const [activePartTab, setActivePartTab] = useState(1);
  const [part1Json, setPart1Json] = useState('{\n  "id": "part1",\n  "title": "Part 1",\n  "questions": [],\n  "audioUrl": ""\n}');
  const [part2Json, setPart2Json] = useState('{\n  "id": "part2",\n  "title": "Part 2",\n  "questions": [],\n  "audioUrl": ""\n}');
  const [part3Json, setPart3Json] = useState('{\n  "id": "part3",\n  "title": "Part 3",\n  "questions": [],\n  "audioUrl": ""\n}');
  const [part4Json, setPart4Json] = useState('{\n  "id": "part4",\n  "title": "Part 4",\n  "questions": [],\n  "audioUrl": ""\n}');

  // Full length references
  const [availableTests, setAvailableTests] = useState<any[]>([]);
  const [selectedTests, setSelectedTests] = useState({
    listening: '',
    reading: '',
    writing: '',
    speaking: ''
  });

  // Reset tab if section changes and tab is out of range
  useEffect(() => {
    const max = section === 'reading' ? 3 : section === 'writing' ? 2 : section === 'speaking' ? 3 : 4;
    if (activePartTab > max) setActivePartTab(1);

    if (section === 'full_length' && availableTests.length === 0) {
      const fetchTests = async () => {
        const snap = await getDocs(collection(db, 'tests'));
        const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setAvailableTests(all);
      };
      fetchTests();
    }
  }, [section, activePartTab]);

  useEffect(() => {
    async function loadTest() {
      try {
        const docRef = doc(db, 'tests', testId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          setTitle(data.title || '');
          setSection(data.section || data.type || 'listening');
          setStatus(data.status || 'draft');
          setInstructions(data.instructions || '');
          setDifficulty(data.difficulty || 'medium');
          setDuration(data.duration?.toString() || '40');
          
          if (data.parts && Array.isArray(data.parts)) {
            const urls = ['', '', '', ''];
            if (data.parts[0]) { setPart1Json(JSON.stringify(data.parts[0], null, 2)); if (data.parts[0].audioUrl) urls[0] = data.parts[0].audioUrl; }
            if (data.parts[1]) { setPart2Json(JSON.stringify(data.parts[1], null, 2)); if (data.parts[1].audioUrl) urls[1] = data.parts[1].audioUrl; }
            if (data.parts[2]) { setPart3Json(JSON.stringify(data.parts[2], null, 2)); if (data.parts[2].audioUrl) urls[2] = data.parts[2].audioUrl; }
            if (data.parts[3]) { setPart4Json(JSON.stringify(data.parts[3], null, 2)); if (data.parts[3].audioUrl) urls[3] = data.parts[3].audioUrl; }
            setExistingAudioUrls(urls);
            setAudioUrlInputs(urls);
          } else {
            setExistingAudioUrls(['', '', '', '']);
            setAudioUrlInputs(['', '', '', '']);
          }

          if (data.fullTestComponents) {
            setSelectedTests(data.fullTestComponents);
          }
        } else {
          setError("Test not found.");
        }
      } catch (err: any) {
        setError(err.message || "Failed to load test data.");
      } finally {
        setLoading(false);
      }
    }
    loadTest();
  }, [testId]);

  const handleJsonImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const str = e.target?.result as string;
        const parsed = JSON.parse(str);
        
        if (parsed.title) setTitle(parsed.title);
        if (parsed.section) setSection(parsed.section);
        if (parsed.parts && Array.isArray(parsed.parts)) {
          const importedUrls = [...audioUrlInputs];
          if (parsed.parts[0]) { setPart1Json(JSON.stringify(parsed.parts[0], null, 2)); if (parsed.parts[0].audioUrl) importedUrls[0] = parsed.parts[0].audioUrl; }
          if (parsed.parts[1]) { setPart2Json(JSON.stringify(parsed.parts[1], null, 2)); if (parsed.parts[1].audioUrl) importedUrls[1] = parsed.parts[1].audioUrl; }
          if (parsed.parts[2]) { setPart3Json(JSON.stringify(parsed.parts[2], null, 2)); if (parsed.parts[2].audioUrl) importedUrls[2] = parsed.parts[2].audioUrl; }
          if (parsed.parts[3]) { setPart4Json(JSON.stringify(parsed.parts[3], null, 2)); if (parsed.parts[3].audioUrl) importedUrls[3] = parsed.parts[3].audioUrl; }
          setAudioUrlInputs(importedUrls);
        }
        if (parsed.instructions) setInstructions(parsed.instructions);
        
      } catch (err) {
        alert("Invalid JSON format in uploaded file. Please check the structure.");
      }
    };
    reader.readAsText(file);
  };

  const handleUpdate = async () => {
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }

    setSaving(true);
    setError('');

    try {
      // Parse parts first
      let parsedParts: any[] = [];
      try {
        parsedParts = [
          JSON.parse(part1Json),
          JSON.parse(part2Json),
          JSON.parse(part3Json),
          JSON.parse(part4Json)
        ];
      } catch (err) {
        throw new Error("Invalid Parts JSON format. Please format as valid JSON.");
      }

      if (section === 'listening') {
        for (let i = 0; i < 4; i++) {
          let finalAudioUrl = parsedParts[i].audioUrl || '';
          const file = audioFiles[i];
          
          if (file) {
            // Upload to Supabase Storage 'audio' bucket
            const fileName = `${testId}_part${i+1}_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '')}`;
            const { data, error: uploadError } = await supabase.storage
              .from('audio')
              .upload(fileName, file);
            
            if (uploadError) throw new Error(`Supabase Upload Failed for Part ${i+1}: ` + uploadError.message);
            
            const { data: { publicUrl } } = supabase.storage.from('audio').getPublicUrl(fileName);
            finalAudioUrl = publicUrl;
          } else if (audioUrlInputs[i]) {
            finalAudioUrl = audioUrlInputs[i];
          }

          if (finalAudioUrl) {
            parsedParts[i].audioUrl = finalAudioUrl;
          }
        }
      }

      const topLevelAudioUrl = parsedParts[0]?.audioUrl || audioUrlInputs[0] || existingAudioUrls[0];

      // Build payload
      const maxParts = section === 'reading' ? 3 : section === 'writing' ? 2 : section === 'speaking' ? 3 : 4;
      const finalParts = parsedParts.slice(0, maxParts);

      const payload = {
        title,
        type: section,
        section,
        status,
        instructions,
        difficulty,
        duration: parseInt(duration),
        audioUrl: topLevelAudioUrl,
        parts: finalParts,
        updatedAt: new Date().toISOString()
      };

      await updateDoc(doc(db, 'tests', testId), {
        ...payload,
        fullTestComponents: section === 'full_length' ? selectedTests : null
      });
      
      router.push('/admin/tests');
    } catch (err: any) {
      setError(err.message || 'Failed to update test.');
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center font-bold text-slate-500">Loading test data...</div>;
  }

  return (
    <ProtectedRoute>
      <div className="p-8 max-w-5xl mx-auto pb-32">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-200">
          <div className="flex items-center gap-4">
            <Link href="/admin/tests" className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full transition-colors">
              <ArrowLeft className="w-5 h-5"/>
            </Link>
            <div>
              <h1 className="text-3xl font-black text-slate-900">Edit Test</h1>
              <p className="text-slate-500 font-medium mt-1 font-mono text-sm">ID: {testId}</p>
            </div>
          </div>
          <button 
            onClick={handleUpdate}
            disabled={saving}
            className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-8 rounded-xl shadow-lg transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? 'Saving...' : <><Save className="w-5 h-5" /> Save Changes</>}
          </button>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-xl mb-8 font-medium">
            ⚠️ {error}
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-8">
          {/* Left Col: Metadata Settings */}
          <div className="md:col-span-1 space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-5">
              <div className="border-b border-slate-100 pb-3 mb-2">
                <h2 className="font-bold text-slate-800 flex items-center gap-2">Test Info</h2>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Display Title</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Cambridge 15 Listening Test 1" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 font-medium"/>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Target Section</label>
                <select value={section} onChange={e => setSection(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 font-medium bg-slate-50">
                  <option value="listening">Listening</option>
                  <option value="reading">Reading</option>
                  <option value="writing">Writing</option>
                  <option value="speaking">Speaking</option>
                  <option value="full_length">Full Length Practice</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Difficulty</label>
                  <select value={difficulty} onChange={e => setDifficulty(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm bg-slate-50">
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Duration (min)</label>
                  <input type="number" value={duration} onChange={e => setDuration(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm"/>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Status</label>
                <select value={status} onChange={e => setStatus(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 font-bold bg-amber-50 text-amber-800">
                  <option value="draft">Draft (Hidden)</option>
                  <option value="published">Published (Live)</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              {section !== 'full_length' && (
                  <div className="pt-2 border-t border-slate-100">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Edit Part</label>
                    <div className="grid grid-cols-4 gap-2">
                      {[1, 2, 3, 4].slice(0, section === 'reading' ? 3 : section === 'writing' ? 2 : section === 'speaking' ? 3 : 4).map(num => (
                        <button 
                          key={num}
                          onClick={() => setActivePartTab(num)}
                          type="button"
                          className={`py-2 text-xs font-bold rounded-lg border transition-colors ${activePartTab === num ? 'bg-primary-50 border-primary-500 text-primary-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                        >
                          Part {num}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
              <h2 className="font-bold text-slate-800 flex items-center gap-2">Import / Upload</h2>
              
              <div className="border-2 border-dashed border-slate-200 p-4 rounded-xl text-center hover:bg-slate-50 hover:border-primary-400 transition-colors cursor-pointer relative">
                <input type="file" accept=".json" onChange={handleJsonImport} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                <UploadCloud className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-700">Import Test JSON</p>
                <p className="text-xs text-slate-500 mt-1">Overwrite current parts</p>
              </div>

              {section === 'listening' && (
                <div className="mt-4 space-y-4">
                  <h3 className="text-sm font-bold text-slate-800">Part {activePartTab} Audio</h3>
                  <div className="border-2 border-dashed border-indigo-200 bg-indigo-50 p-4 rounded-xl text-center relative hover:bg-indigo-100 transition-colors cursor-pointer">
                    <input type="file" accept="audio/mp3,audio/wav" onChange={(e) => {
                      const newFiles = [...audioFiles];
                      newFiles[activePartTab - 1] = e.target.files?.[0] || null;
                      setAudioFiles(newFiles);
                    }} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                    <UploadCloud className="w-6 h-6 text-indigo-500 mx-auto mb-2" />
                    <p className="text-sm font-bold text-indigo-800">Upload to Supabase Storage</p>
                    <p className="text-xs text-indigo-600 mt-1 truncate px-2">{audioFiles[activePartTab - 1] ? audioFiles[activePartTab - 1]?.name : 'Drag MP3/WAV here'}</p>
                  </div>
                  
                  <div className="relative flex items-center py-2">
                    <div className="flex-grow border-t border-slate-200"></div>
                    <span className="flex-shrink-0 mx-4 text-slate-400 text-xs font-bold uppercase">Or</span>
                    <div className="flex-grow border-t border-slate-200"></div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-sky-600 uppercase mb-1">External Audio URL</label>
                    <input 
                      type="url" 
                      value={audioUrlInputs[activePartTab - 1]} 
                      onChange={(e) => {
                        const newUrls = [...audioUrlInputs];
                        newUrls[activePartTab - 1] = e.target.value;
                        setAudioUrlInputs(newUrls);
                      }} 
                      placeholder="e.g. https://example.com/audio.mp3" 
                      className="w-full px-3 py-2 border border-sky-200 bg-sky-50 rounded-lg focus:ring-2 focus:ring-sky-500 text-sm font-medium"
                      disabled={!!audioFiles[activePartTab - 1]}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Col: Complex Structure Editor */}
          <div className="md:col-span-2 space-y-6">
            
            {section === 'full_length' ? (
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 space-y-8">
                <div className="border-b border-slate-100 pb-4">
                  <h2 className="text-xl font-black text-slate-900">Select Components</h2>
                  <p className="text-sm text-slate-500">Pick the sub-tests that will make up this full session.</p>
                </div>

                <div className="grid gap-6">
                  {['listening', 'reading', 'writing', 'speaking'].map(type => (
                    <div key={type} className="space-y-2">
                      <label className="block text-xs font-black text-slate-500 uppercase tracking-widest">{type} test</label>
                      <select 
                        value={selectedTests[type as keyof typeof selectedTests]}
                        onChange={e => setSelectedTests(prev => ({ ...prev, [type]: e.target.value }))}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 font-medium bg-slate-50/50 outline-none"
                      >
                        <option value="">— Select an existing {type} test —</option>
                        {availableTests.filter(t => (t.section || t.type) === type && (t.status === 'published' || t.id === selectedTests[type as keyof typeof selectedTests])).map(t => (
                          <option key={t.id} value={t.id}>{t.title} ({t.id})</option>
                        ))}
                      </select>
                      {availableTests.filter(t => (t.section || t.type) === type && t.status === 'published').length === 0 && !selectedTests[type as keyof typeof selectedTests] && (
                        <p className="text-[10px] text-rose-500 font-bold uppercase tracking-tight ml-1">No published {type} tests found.</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 space-y-4">
                <label className="block text-sm font-bold text-slate-800 uppercase">General Instructions</label>
                <textarea 
                  value={instructions} 
                  onChange={e => setInstructions(e.target.value)} 
                  placeholder="e.g. Listen carefully to the recording and answer all questions."
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-slate-600 h-24"
                />
              </div>
            )}

            {section === 'reading' && (
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div>
                    <h2 className="text-lg font-bold text-slate-800 uppercase tracking-tight">Reading Passage Content</h2>
                    <p className="text-xs text-slate-500 mt-1">Configure the text and context for Part {activePartTab}</p>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-100">READING MODE</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Part Topic</label>
                    <input 
                      type="text"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm font-medium"
                      placeholder="e.g. Urban Farming"
                      value={(() => {
                        const json = activePartTab === 1 ? part1Json : activePartTab === 2 ? part2Json : activePartTab === 3 ? part3Json : part4Json;
                        try { return JSON.parse(json).topic || ''; } catch { return ''; }
                      })()}
                      onChange={e => {
                        const val = e.target.value;
                        const updateJson = (json: string) => {
                          try {
                            const parsed = JSON.parse(json);
                            parsed.topic = val;
                            return JSON.stringify(parsed, null, 2);
                          } catch { return json; }
                        };
                        if (activePartTab === 1) setPart1Json(updateJson(part1Json));
                        else if (activePartTab === 2) setPart2Json(updateJson(part2Json));
                        else if (activePartTab === 3) setPart3Json(updateJson(part3Json));
                        else setPart4Json(updateJson(part4Json));
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Part Title</label>
                    <input 
                      type="text"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm font-medium"
                      placeholder="e.g. Reading Passage 1"
                      value={(() => {
                        const json = activePartTab === 1 ? part1Json : activePartTab === 2 ? part2Json : activePartTab === 3 ? part3Json : part4Json;
                        try { return JSON.parse(json).title || ''; } catch { return ''; }
                      })()}
                      onChange={e => {
                        const val = e.target.value;
                        const updateJson = (json: string) => {
                          try {
                            const parsed = JSON.parse(json);
                            parsed.title = val;
                            return JSON.stringify(parsed, null, 2);
                          } catch { return json; }
                        };
                        if (activePartTab === 1) setPart1Json(updateJson(part1Json));
                        else if (activePartTab === 2) setPart2Json(updateJson(part2Json));
                        else if (activePartTab === 3) setPart3Json(updateJson(part3Json));
                        else setPart4Json(updateJson(part4Json));
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase">Passage Text (HTML Supported)</label>
                    <span className="text-[10px] text-slate-400 font-mono italic">Use &lt;p&gt;, &lt;b&gt;, &lt;h1&gt;</span>
                  </div>
                  <textarea 
                    value={(() => {
                      const json = activePartTab === 1 ? part1Json : activePartTab === 2 ? part2Json : activePartTab === 3 ? part3Json : part4Json;
                      try { return JSON.parse(json).passage || ''; } catch { return ''; }
                    })()} 
                    onChange={e => {
                      const val = e.target.value;
                      const updateJson = (json: string) => {
                        try {
                          const parsed = JSON.parse(json);
                          parsed.passage = val;
                          return JSON.stringify(parsed, null, 2);
                        } catch { return json; }
                      };
                      if (activePartTab === 1) setPart1Json(updateJson(part1Json));
                      else if (activePartTab === 2) setPart2Json(updateJson(part2Json));
                      else if (activePartTab === 3) setPart3Json(updateJson(part3Json));
                      else setPart4Json(updateJson(part4Json));
                    }} 
                    placeholder="Enter the full article/passage text here..."
                    className="w-full px-4 py-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none text-slate-700 min-h-[400px] font-serif leading-relaxed text-sm shadow-inner bg-slate-50/30"
                  />
                </div>
              </div>
            )}

            {section === 'writing' && (
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div>
                    <h2 className="text-lg font-bold text-slate-800 uppercase tracking-tight">Writing Task Config</h2>
                    <p className="text-xs text-slate-500 mt-1">Configure the prompt and specifics for Part {activePartTab}</p>
                  </div>
                  <span className="text-[10px] font-bold text-fuchsia-600 bg-fuchsia-50 px-2 py-1 rounded border border-fuchsia-100">WRITING MODE</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Part Title</label>
                    <input 
                      type="text"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-fuchsia-500 text-sm font-medium"
                      placeholder="e.g. Part 1"
                      value={(() => {
                        const json = activePartTab === 1 ? part1Json : activePartTab === 2 ? part2Json : activePartTab === 3 ? part3Json : part4Json;
                        try { return JSON.parse(json).title || ''; } catch { return ''; }
                      })()}
                      onChange={e => {
                        const val = e.target.value;
                        const updateJson = (json: string) => {
                          try {
                            const parsed = JSON.parse(json);
                            parsed.title = val;
                            return JSON.stringify(parsed, null, 2);
                          } catch { return json; }
                        };
                        if (activePartTab === 1) setPart1Json(updateJson(part1Json));
                        else if (activePartTab === 2) setPart2Json(updateJson(part2Json));
                        else if (activePartTab === 3) setPart3Json(updateJson(part3Json));
                        else setPart4Json(updateJson(part4Json));
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Target Word Count</label>
                    <input 
                      type="number"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-fuchsia-500 text-sm font-medium"
                      placeholder="e.g. 150"
                      value={(() => {
                        const json = activePartTab === 1 ? part1Json : activePartTab === 2 ? part2Json : activePartTab === 3 ? part3Json : part4Json;
                        try { return JSON.parse(json).targetWords || ''; } catch { return ''; }
                      })()}
                      onChange={e => {
                        const val = e.target.value;
                        const updateJson = (json: string) => {
                          try {
                            const parsed = JSON.parse(json);
                            parsed.targetWords = parseInt(val) || 0;
                            return JSON.stringify(parsed, null, 2);
                          } catch { return json; }
                        };
                        if (activePartTab === 1) setPart1Json(updateJson(part1Json));
                        else if (activePartTab === 2) setPart2Json(updateJson(part2Json));
                        else if (activePartTab === 3) setPart3Json(updateJson(part3Json));
                        else setPart4Json(updateJson(part4Json));
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Part Description (Time/Length Advice)</label>
                  <textarea 
                    value={(() => {
                      const json = activePartTab === 1 ? part1Json : activePartTab === 2 ? part2Json : activePartTab === 3 ? part3Json : part4Json;
                      try { return JSON.parse(json).description || ''; } catch { return ''; }
                    })()} 
                    onChange={e => {
                      const val = e.target.value;
                      const updateJson = (json: string) => {
                        try {
                          const parsed = JSON.parse(json);
                          parsed.description = val;
                          return JSON.stringify(parsed, null, 2);
                        } catch { return json; }
                      };
                      if (activePartTab === 1) setPart1Json(updateJson(part1Json));
                      else if (activePartTab === 2) setPart2Json(updateJson(part2Json));
                      else if (activePartTab === 3) setPart3Json(updateJson(part3Json));
                      else setPart4Json(updateJson(part4Json));
                    }} 
                    placeholder="e.g. You should spend about 20 minutes on this task. Write at least 150 words."
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-fuchsia-500 outline-none text-slate-700 h-20 text-sm"
                  />
                </div>
              </div>
            )}

            {section !== 'full_length' && (
              <div className="bg-white rounded-2xl p-0 shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[600px]">
                 <div className="p-6 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                    <div>
                      <h2 className="font-bold text-slate-800">Parts Editor (JSON Schema)</h2>
                      <p className="text-xs text-slate-500 mt-1">For advanced test structure containing multiple parts and questions.</p>
                    </div>
                    <button className="text-xs bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold px-3 py-1.5 rounded-lg transition-colors">Format Data</button>
                 </div>
                 <textarea 
                    value={
                      activePartTab === 1 ? part1Json :
                      activePartTab === 2 ? part2Json :
                      activePartTab === 3 ? part3Json :
                      part4Json
                    }
                    onChange={e => {
                      const val = e.target.value;
                      if (activePartTab === 1) setPart1Json(val);
                      else if (activePartTab === 2) setPart2Json(val);
                      else if (activePartTab === 3) setPart3Json(val);
                      else setPart4Json(val);
                    }}
                    className="flex-1 w-full bg-slate-900 text-emerald-400 font-mono text-xs p-6 outline-none focus:ring-inset focus:ring-2 focus:ring-primary-500 resize-none whitespace-pre"
                    spellCheck={false}
                 />
              </div>
            )}

            {section !== 'full_length' && (
              <PartItemsBuilder
                partJson={
                  activePartTab === 1 ? part1Json :
                  activePartTab === 2 ? part2Json :
                  activePartTab === 3 ? part3Json :
                  part4Json
                }
                onChange={(updated) => {
                  if (activePartTab === 1) setPart1Json(updated);
                  else if (activePartTab === 2) setPart2Json(updated);
                  else if (activePartTab === 3) setPart3Json(updated);
                  else setPart4Json(updated);
                }}
                section={section}
              />
            )}

          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
