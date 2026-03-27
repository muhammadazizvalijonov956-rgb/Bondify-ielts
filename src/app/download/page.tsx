"use client";

import { useState, useEffect } from 'react';
import { Monitor, Download, Zap, Shield, Sparkles, CheckCircle2, UploadCloud, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export default function DownloadPage() {
  const { profile } = useAuth();
  const [downloading, setDownloading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // App Config
  const [appConfig, setAppConfig] = useState({
    downloadUrl: 'https://pub-b0db5910ad5d4f1583d0e8fe51a51e0c.r2.dev/releases/BondifySetUp.exe.exe',
    version: 'v1.0.4'
  });

  // Admin Upload State
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'preparing' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadMessage, setUploadMessage] = useState('');

  useEffect(() => {
    async function fetchConfig() {
      try {
        const docRef = doc(db, 'config', 'app');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setAppConfig(docSnap.data() as any);
        }
      } catch (err) {
        console.error("Failed to load app config:", err);
      }
    }
    fetchConfig();
  }, []);

  const handleDownload = () => {
    setDownloading(true);
    // Open the actual download URL in a new window/tab
    window.open(appConfig.downloadUrl, '_blank');
    setShowModal(true);

    setTimeout(() => {
      setDownloading(false);
    }, 2000);
  };

  const handleAdminUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadProgress(0);
    setUploadStatus('preparing');
    setUploadMessage('Requesting secure gateway...');

    try {
      // 1. Get Presigned URL
      const res = await fetch('/api/r2/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
          folder: 'releases'
        })
      });

      if (!res.ok) throw new Error('Failed to get upload permission.');

      const { uploadUrl, publicUrl } = await res.json();

      // 2. Upload to R2 via PUT
      setUploadStatus('uploading');
      setUploadMessage(`Pumping ${Math.round(file.size / 1024 / 1024)}MB to Cloudflare...`);

      const xhr = new XMLHttpRequest();
      xhr.open('PUT', uploadUrl);
      xhr.setRequestHeader('Content-Type', file.type);

      xhr.upload.onprogress = (evt) => {
        if (evt.lengthComputable) {
          const percent = Math.round((evt.loaded / evt.total) * 100);
          setUploadProgress(percent);
        }
      };

      xhr.onload = async () => {
        if (xhr.status === 200) {
          // 3. Update Firestore with new build publicUrl
          try {
            const newVersion = `v${new Date().getMonth() + 1}.${new Date().getDate()}.${new Date().getHours()}`;
            await setDoc(doc(db, 'config', 'app'), {
              downloadUrl: publicUrl,
              version: newVersion,
              updatedAt: new Date().toISOString()
            });
            setAppConfig({ downloadUrl: publicUrl, version: newVersion });
            setUploadStatus('success');
            setUploadMessage(`Success! Live @ ${publicUrl}`);
          } catch (dbErr) {
            setUploadStatus('success'); // Still success for upload, but warning for DB
            setUploadMessage(`Upload OK, but failed to update DB link.`);
          }
          setUploading(false);
        } else {
          setUploadStatus('error');
          setUploadMessage(`Upload failed with status ${xhr.status}`);
          setUploading(false);
        }
      };

      xhr.onerror = () => {
        setUploadStatus('error');
        setUploadMessage('Network error during upload.');
        setUploading(false);
      };

      xhr.send(file);

    } catch (err: any) {
      setUploadStatus('error');
      setUploadMessage(err.message || 'Fatal upload error.');
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-transparent flex flex-col font-sans selection:bg-primary-100 selection:text-primary-900">
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-20">
        <div className="flex flex-col lg:flex-row items-center gap-16">

          {/* Text Content */}
          <div className="flex-1 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-50 rounded-full text-primary-600 font-black text-xs uppercase tracking-widest mb-6">
              <Sparkles className="w-4 h-4" /> Native Experience
            </div>
            <h1 className="text-5xl md:text-6xl font-black text-slate-900 leading-[1.1] mb-8 tracking-tight">
              Take Bondify <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-indigo-600">to your Desktop.</span>
            </h1>
            <p className="text-xl text-slate-600 font-medium mb-12 max-w-xl leading-relaxed">
              Experience the ultra-high-performance IELTS engine with zero browser distractions. Focused, fast, and built for winners.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <button
                className="group relative px-10 py-5 bg-slate-900 text-white rounded-2xl font-black text-lg transition-all hover:bg-black hover:-translate-y-1 active:translate-y-0 shadow-2xl shadow-slate-900/30 flex items-center justify-center gap-3 overflow-hidden disabled:opacity-70"
                onClick={handleDownload}
                disabled={downloading}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-primary-500/20 to-indigo-500/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <Download className={`w-6 h-6 ${downloading ? 'animate-bounce' : 'group-hover:bounce'}`} />
                {downloading ? 'Preparing Package...' : 'Download for Windows'}
              </button>
              <div className="flex items-center gap-3 px-6 py-4 bg-white border border-slate-200 rounded-2xl">
                <Monitor className="w-5 h-5 text-slate-400" />
                <div className="text-left">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Latest Version</p>
                  <p className="text-sm font-bold text-slate-700">{appConfig.version} (Beta)</p>
                </div>
              </div>
            </div>

            <p className="mt-8 text-slate-400 text-sm font-medium">
              Requires Windows 10 or later. <span className="underline decoration-slate-200 cursor-help">Checksums & GPG</span>
            </p>
          </div>

          {/* Visual Showcase */}
          <div className="flex-1 relative group">
            <div className="absolute -inset-10 bg-gradient-to-tr from-primary-500/10 to-indigo-500/10 blur-[100px] opacity-100"></div>
            
            {/* The Main App Experience Card */}
            <div className="relative bg-white/40 backdrop-blur-3xl rounded-[3.5rem] p-6 shadow-2xl border border-white/40 overflow-hidden transform hover:-translate-y-2 transition-all duration-700">
               <div className="bg-slate-900 rounded-[3rem] overflow-hidden shadow-2xl relative aspect-[14/10]">
                  <img 
                    src="/assets/images/bondify_mockup.png" 
                    alt="Bondify Native Desktop" 
                    className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-1000"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent pointer-events-none"></div>
                  
                  {/* Floating App Badge */}
                  <div className="absolute bottom-6 left-6 flex items-center gap-3 px-6 py-4 bg-white/10 backdrop-blur-md rounded-3xl border border-white/20">
                     <img src="/assets/images/bondify_logo.png" alt="Logo" className="w-8 h-8 drop-shadow-lg" />
                     <span className="text-white font-black text-sm tracking-widest uppercase">Bondify Native</span>
                  </div>
               </div>
            </div>
            
            {/* 3D Glass Hero Badge removed */}

            {/* Floating Stats Badge */}
            <div className="absolute -bottom-10 -left-10 bg-white/90 backdrop-blur-xl p-8 rounded-[2.5rem] shadow-2xl border border-slate-100 flex items-center gap-6 animate-bounce-subtle z-20">
                <div className="w-16 h-16 bg-primary-50 rounded-3xl flex items-center justify-center text-primary-500 shadow-inner">
                    <Zap className="w-8 h-8 fill-primary-500" />
                </div>
                <div>
                    <h4 className="font-black text-slate-900 text-xl leading-none mb-2">3x Stability</h4>
                    <p className="text-sm text-slate-500 font-bold uppercase tracking-wider">Edge-Native Core</p>
                </div>
            </div>
          </div>
        </div>

        {/* Admin Secret Upload Dashboard */}
        {profile?.role === 'admin' && (
          <div className="mt-32 p-1 bg-gradient-to-r from-amber-200 via-orange-300 to-amber-200 rounded-[3rem] shadow-2xl">
            <div className="bg-white rounded-[2.8rem] p-12 overflow-hidden relative">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <Shield className="w-48 h-48 text-slate-900" />
              </div>

              <div className="relative z-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-100 text-amber-700 rounded-lg text-[10px] font-black uppercase tracking-wider mb-4 border border-amber-200">
                      <Shield className="w-3 h-3" /> Admin Release Control
                    </div>
                    <h2 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Push New Build</h2>
                    <p className="text-slate-500 font-medium">Instantly distribute your latest .exe build to Cloudflare R2 Edge.</p>
                  </div>

                  <div className="flex-shrink-0">
                    <label className={`relative group flex items-center gap-4 px-8 py-6 rounded-3xl border-4 border-dashed transition-all cursor-pointer ${uploading ? 'bg-slate-50 border-slate-200 grayscale pointer-events-none' : 'bg-amber-50 border-amber-200 hover:bg-amber-100 hover:border-amber-400'}`}>
                      <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleAdminUpload} disabled={uploading} />
                      <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform">
                        {uploading ? <Zap className="w-8 h-8 animate-spin" /> : <UploadCloud className="w-8 h-8" />}
                      </div>
                      <div className="text-left">
                        <span className="block text-lg font-black text-slate-900">Select .exe File</span>
                        <span className="block text-xs font-bold text-amber-600 uppercase tracking-widest">Supports up to 500MB</span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Progress Tracking */}
                {uploadStatus !== 'idle' && (
                  <div className="mt-12 p-8 bg-slate-50 rounded-[2rem] border border-slate-100 animate-in slide-in-from-top-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        {uploadStatus === 'success' ? <CheckCircle className="w-6 h-6 text-emerald-500" /> :
                          uploadStatus === 'error' ? <AlertCircle className="w-6 h-6 text-rose-500" /> :
                            <div className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />}
                        <span className={`font-black tracking-tight ${uploadStatus === 'success' ? 'text-emerald-600' : uploadStatus === 'error' ? 'text-rose-600' : 'text-slate-900'}`}>
                          {uploadMessage}
                        </span>
                      </div>
                      {uploadStatus === 'uploading' && <span className="font-mono font-black text-amber-600">{uploadProgress}%</span>}
                    </div>

                    {uploadStatus === 'uploading' && (
                      <div className="h-4 w-full bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-500 transition-all duration-300 ease-out shadow-[0_0_20px_rgba(245,158,11,0.5)]"
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                    )}

                    {uploadStatus === 'success' && (
                      <div className="mt-4 flex gap-2">
                        <button
                          onClick={() => setUploadStatus('idle')}
                          className="px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-50 transition-colors"
                        >
                          Clear Dashboard
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Benefits Grid */}
        <div className="grid md:grid-cols-3 gap-8 mt-40">
          <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
            <div className="w-16 h-16 bg-blue-50 rounded-[2rem] flex items-center justify-center text-blue-600 mb-8 group-hover:scale-110 transition-transform"><Zap className="w-8 h-8" /></div>
            <h3 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">Rapid Response</h3>
            <p className="text-slate-500 font-medium leading-relaxed">Built on a custom shell designed for minimum latency during high-stakes listening and reading sections.</p>
          </div>
          <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
            <div className="w-16 h-16 bg-emerald-50 rounded-[2rem] flex items-center justify-center text-emerald-600 mb-8 group-hover:scale-110 transition-transform"><Shield className="w-8 h-8" /></div>
            <h3 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">Focus Lock</h3>
            <p className="text-slate-500 font-medium leading-relaxed">Block browser tabs, notifications, and social media automatically. Enter a flow-state for your practice session.</p>
          </div>
          <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
            <div className="w-16 h-16 bg-rose-50 rounded-[2rem] flex items-center justify-center text-rose-600 mb-8 group-hover:scale-110 transition-transform"><CheckCircle2 className="w-8 h-8" /></div>
            <h3 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">Offline Preview</h3>
            <p className="text-slate-500 font-medium leading-relaxed">Access previously completed tests and your vocabulary results even when you are disconnected from the network.</p>
          </div>
        </div>

        {/* FAQ Preview */}
        <div className="mt-32 text-center max-w-2xl mx-auto">
          <h2 className="text-3xl font-black text-slate-900 mb-6">Why use the Desktop App?</h2>
          <p className="text-slate-500 font-medium italic">"The browser version is great, but the desktop version changed the game for me. The lack of tabs meant I couldn't wander off to YouTube while doing Reading Passage 3."</p>
          <div className="mt-6 font-black text-primary-600">— Sarah J., Band 8.5 achiever</div>
        </div>
      </main>

      <footer className="mt-20 py-12 border-t border-slate-100 text-center text-slate-400 text-sm font-bold uppercase tracking-widest">
        © 2026 Bondify Native · Engineered for Excellence
      </footer>

      {/* Modern Modal / Alert Backdrop */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-12">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl animate-in fade-in duration-300"
            onClick={() => setShowModal(false)}
          ></div>
          <div className="relative bg-white rounded-[3rem] p-10 sm:p-12 shadow-2xl border border-slate-100 max-w-lg w-full text-center space-y-8 animate-in zoom-in-95 slide-in-from-bottom-5 duration-500">
            <div className="w-24 h-24 bg-emerald-50 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle className="w-12 h-12 text-emerald-500" />
            </div>
            <div>
              <h3 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Download Started</h3>
              <p className="text-slate-500 font-medium leading-relaxed">
                We've initiated the download of your Bondify installer from our website containers.
              </p>
            </div>
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 text-left space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-slate-900 text-white text-[10px] font-black flex items-center justify-center shrink-0">1</div>
                <p className="text-xs font-bold text-slate-700">Locate the downloaded <span className="font-mono">BondifySetUp.exe</span></p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-slate-900 text-white text-[10px] font-black flex items-center justify-center shrink-0">2</div>
                <p className="text-xs font-bold text-slate-700">Double-click to install the Native Shell</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-slate-900 text-white text-[10px] font-black flex items-center justify-center shrink-0">3</div>
                <p className="text-xs font-bold text-slate-700">Log in with your current account</p>
              </div>
            </div>
            <button
              onClick={() => setShowModal(false)}
              className="w-full bg-slate-900 text-white font-black py-5 rounded-2xl hover:bg-black transition-all flex items-center justify-center gap-2 group shadow-xl active:scale-95"
            >
              Yes, Sir!
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
