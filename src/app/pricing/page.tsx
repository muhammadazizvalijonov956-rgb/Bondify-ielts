"use client";

import { CheckCircle2, Star, Zap, ShieldCheck, CreditCard, Send, Lock, Image as ImageIcon, Check, X, Clock, Upload, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { db } from '@/lib/firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const PACKS = {
  'go': { name: 'Go Plan', price: 2.99, type: 'subscription' },
  'plus': { name: 'Plus Plan', price: 7.99, type: 'subscription' },
  'pro': { name: 'Pro Plan', price: 19, type: 'subscription' },
  'tokens-starter': { name: 'Starter Tokens', price: 1, tokens: 5, type: 'tokens' },
  'tokens-popular': { name: 'Popular Tokens', price: 5, tokens: 26, type: 'tokens' },
  'tokens-pro': { name: 'Pro Tokens', price: 10, tokens: 51, type: 'tokens' },
};

export default function PricingPage() {
  const { user, profile } = useAuth();
  const router = useRouter();
  
  const [selectedPack, setSelectedPack] = useState<keyof typeof PACKS | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleCheckout = (planId: keyof typeof PACKS) => {
    if (!user) {
      router.push(`/register?next=/pricing`);
      return;
    }
    setSelectedPack(planId);
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !selectedPack || !user) return;

    setUploading(true);
    try {
      // 1. Get Presigned URL
      const presignResponse = await fetch('/api/r2/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
          folder: 'payment_proofs'
        })
      });

      if (!presignResponse.ok) throw new Error('Failed to get upload URL');
      const { uploadUrl, publicUrl } = await presignResponse.json();

      // 2. Upload to R2 directly from client
      const uploadResult = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type
        }
      });

      if (!uploadResult.ok) throw new Error('Failed to upload to Cloudflare R2');

      // 3. Create Payment Record with R2 Public URL
      const pack = PACKS[selectedPack];
      await addDoc(collection(db, 'manual_payments'), {
        userId: user.uid,
        userEmail: user.email,
        username: profile?.username || 'Unknown',
        packName: pack.name,
        price: pack.price,
        tokensAmount: (pack as any).tokens || 0,
        screenshotUrl: publicUrl,
        status: 'pending',
        createdAt: serverTimestamp(),
      });

      setSuccess(true);
    } catch (err) {
      console.error("Payment submission failed:", err);
      alert("Submission failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="bg-white rounded-[3rem] p-12 shadow-2xl border border-slate-100 max-w-lg w-full text-center">
          <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce">
            <Check className="w-12 h-12 text-emerald-600" />
          </div>
          <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Request Received!</h2>
          <p className="text-slate-500 font-medium text-lg leading-relaxed mb-8">
            Your payment is under review. Our team will verify it within <span className="text-slate-900 font-bold">5–15 minutes</span>.
          </p>
          <button 
            onClick={() => router.push('/')}
            className="w-full py-4 bg-slate-900 hover:bg-black text-white rounded-2xl font-bold transition-all shadow-xl shadow-slate-900/10"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (selectedPack) {
    const pack = PACKS[selectedPack];
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <button 
          onClick={() => setSelectedPack(null)}
          className="flex items-center gap-2 text-slate-400 hover:text-slate-900 font-bold mb-8 transition-colors group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" /> Back to Pricing
        </button>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Left: Instructions */}
          <div className="space-y-8">
            <div>
              <h1 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">Finish your purchase</h1>
              <p className="text-slate-500 font-medium">To complete your <span className="text-primary-600 font-bold">{pack.name}</span> order, please make a manual transfer and upload the proof.</p>
            </div>

            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xl shadow-slate-200/20 space-y-6">
              <div className="flex items-center gap-4 text-slate-900">
                <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100">
                  <CreditCard className="w-5 h-5 text-slate-400" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Card Number</p>
                  <p className="font-black text-lg tracking-wider">8600 0123 4567 8901</p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-slate-900">
                <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100">
                  <Lock className="w-5 h-5 text-slate-400" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Card Holder</p>
                  <p className="font-bold">M. Valiijonov (Founder)</p>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-6">
                <div className="flex items-center gap-4 text-slate-900">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center border border-blue-100">
                    <Send className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-blue-400">Support / Telegram</p>
                    <Link href="https://t.me/your_telegram" target="_blank" className="font-bold hover:underline">@bondify_support</Link>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-amber-50 rounded-2xl p-6 border border-amber-100 flex gap-4">
              <Clock className="w-6 h-6 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-700 leading-relaxed font-medium">
                <strong>Fast Verification:</strong> After uploading, your tokens will be added manually within 15 minutes. Make sure the screenshot clearly shows the transaction details.
              </p>
            </div>
          </div>

          {/* Right: Upload Form */}
          <div className="bg-slate-50 rounded-[3rem] p-10 border border-slate-200 border-dashed relative">
            <h2 className="text-2xl font-black text-slate-900 mb-8">Upload Proof</h2>
            
            <form onSubmit={handleSubmitPayment} className="space-y-6">
              <div className="relative group cursor-pointer">
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className={`border-4 border-dashed rounded-3xl p-10 flex flex-col items-center justify-center transition-all ${file ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 group-hover:bg-white group-hover:border-slate-300'}`}>
                  {file ? (
                    <>
                      <div className="w-20 h-20 bg-emerald-500 text-white rounded-full flex items-center justify-center mb-4 shadow-lg shadow-emerald-200">
                        <ImageIcon className="w-10 h-10" />
                      </div>
                      <p className="text-emerald-700 font-bold text-center truncate max-w-full">{file.name}</p>
                      <p className="text-emerald-500 text-xs font-medium mt-1 uppercase tracking-widest">Image selected</p>
                    </>
                  ) : (
                    <>
                      <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-4 shadow-sm group-hover:shadow-md transition-shadow">
                        <Upload className="w-8 h-8 text-slate-300" />
                      </div>
                      <p className="text-slate-900 font-bold">Drop screenshot here</p>
                      <p className="text-slate-400 text-xs font-medium mt-1 uppercase tracking-widest">JPG, PNG allowed</p>
                    </>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-slate-500 font-medium">Selected Package</span>
                  <span className="font-bold text-slate-900">{pack.name}</span>
                </div>
                <div className="flex justify-between items-center text-lg">
                  <span className="text-slate-500 font-medium">Amount to Pay</span>
                  <span className="font-black text-primary-600">${pack.price}</span>
                </div>
              </div>

              <button 
                type="submit"
                disabled={!file || uploading}
                className="w-full py-5 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white rounded-2xl font-black text-lg transition-all shadow-xl shadow-primary-500/20 flex items-center justify-center gap-3"
              >
                {uploading ? (
                  <><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Submitting...</>
                ) : (
                  <><Send className="w-5 h-5" /> Submit Request</>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-16">
      
      <div className="text-center mb-16">
        <h1 className="text-4xl sm:text-5xl font-black text-slate-900 mb-6 font-display tracking-tight">Boost your IELTS band today</h1>
        <p className="text-xl text-slate-600 max-w-3xl mx-auto mb-10 leading-relaxed font-medium">
          Choose the Bondify plan that fits your study pace. Go premium to unlock unlimited token usage, instant result analysis, and access to premium-only prize events.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
        
        {/* Go Plan */}
        <div className="bg-white rounded-[2rem] p-10 relative overflow-hidden flex flex-col transition-all duration-300 hover:shadow-2xl border border-slate-200">
          <div className="mb-8">
            <h3 className="text-2xl font-bold mb-3 text-slate-900 border-b border-slate-200 pb-6 w-full flex justify-between items-center">
              Go Plan
              <span className="bg-slate-100 text-slate-500 font-bold px-3 py-1 rounded-full text-sm uppercase tracking-wider">Starter</span>
            </h3>
            <div className="flex items-baseline gap-2 mt-6">
              <span className="text-5xl font-black text-slate-900 tracking-tighter">$2.99</span>
              <span className="text-slate-500 font-bold text-lg">/month</span>
            </div>
            <p className="text-slate-500 mt-4 font-medium">For casual test takers wanting a bit more practice.</p>
          </div>
          
          <ul className="space-y-5 mb-10 text-slate-700 font-medium flex-grow">
            <li className="flex gap-4 items-start"><CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0"/> 15 Tokens per day recharge</li>
            <li className="flex gap-4 items-start"><CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0"/> Full access to all reading & listening tests</li>
            <li className="flex gap-4 items-start"><CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0"/> Standard grading speed</li>
            <li className="flex gap-4 items-start text-slate-400 opacity-80"><CheckCircle2 className="w-6 h-6 shrink-0"/> No human tutor grading</li>
            <li className="flex gap-4 items-start text-slate-400 opacity-80"><CheckCircle2 className="w-6 h-6 shrink-0"/> No premium events access</li>
          </ul>
          
          <button 
            onClick={() => handleCheckout('go')}
            disabled={profile?.accountTier === 'go'}
            className="w-full py-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-lg transition-colors border border-slate-300 disabled:opacity-50"
          >
            {profile?.accountTier === 'go' ? 'Current Plan' : 'Subscribe to Go'}
          </button>
        </div>

        {/* Plus Plan (Popular) */}
        <div className="bg-primary-600 rounded-[2rem] p-10 relative overflow-hidden flex flex-col transition-all duration-300 shadow-2xl border border-primary-500 transform lg:-translate-y-4">
          <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-amber-400 to-orange-500"></div>
          <div className="absolute top-6 right-8 bg-amber-400 text-slate-900 font-bold text-xs uppercase tracking-wider px-4 py-1.5 rounded-full shadow-lg flex items-center gap-1"><Star className="w-3 h-3 fill-slate-900"/> BEST VALUE</div>
          
          <div className="mb-8 mt-2">
            <h3 className="text-2xl font-bold mb-3 text-white border-b border-primary-500/50 pb-6 w-full">Plus Plan</h3>
            <div className="flex items-baseline gap-2 mt-6">
              <span className="text-5xl font-black text-white tracking-tighter">$7.99</span>
              <span className="text-primary-200 font-bold text-lg">/month</span>
            </div>
            <p className="text-primary-100 mt-4 font-medium">The unlimited IELTS engine to guarantee high band scores.</p>
          </div>
          
          <ul className="space-y-5 mb-10 text-white font-medium flex-grow">
            <li className="flex gap-4 items-start"><CheckCircle2 className="w-6 h-6 text-amber-400 shrink-0"/> Unlimited tokens & result unlocks</li>
            <li className="flex gap-4 items-start"><CheckCircle2 className="w-6 h-6 text-amber-400 shrink-0"/> Instant AI grading for Speaking & Writing</li>
            <li className="flex gap-4 items-start"><CheckCircle2 className="w-6 h-6 text-amber-400 shrink-0"/> Premium Competition Events access</li>
            <li className="flex gap-4 items-start"><CheckCircle2 className="w-6 h-6 text-amber-400 shrink-0"/> Detailed Analytics & Progression Graph</li>
            <li className="flex gap-4 items-start text-primary-300/60 opacity-80"><CheckCircle2 className="w-6 h-6 shrink-0"/> No human tutor grading</li>
          </ul>
          
          <button 
            onClick={() => handleCheckout('plus')}
            disabled={profile?.accountTier === 'plus'}
            className="w-full py-4 rounded-xl bg-white text-primary-700 hover:bg-slate-50 shadow-lg font-bold text-lg transition-transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-80"
          >
            {profile?.accountTier === 'plus' ? 'Current Plan' : 'Start Plus Today'}
          </button>
        </div>

        {/* Pro Plan */}
        <div className="bg-slate-900 rounded-[2rem] p-10 relative overflow-hidden flex flex-col transition-all duration-300 hover:shadow-2xl shadow-xl border border-slate-700">
          <div className="mb-8">
            <h3 className="text-2xl font-bold mb-3 text-slate-100 border-b border-slate-700 pb-6 w-full flex items-center justify-between">
              Pro Plan
              <span className="bg-slate-800 text-slate-400 font-bold px-3 py-1 rounded-full text-sm uppercase tracking-wider flex items-center gap-1"><ShieldCheck className="w-4 h-4"/> Elite</span>
            </h3>
            <div className="flex items-baseline gap-2 mt-6">
              <span className="text-5xl font-black text-white tracking-tighter">$19</span>
              <span className="text-slate-400 font-bold text-lg">/month</span>
            </div>
            <p className="text-slate-400 mt-4 font-medium">For serious candidates who need expert human-guidance.</p>
          </div>
          
          <ul className="space-y-5 mb-10 text-slate-300 font-medium flex-grow">
            <li className="flex gap-4 items-start"><CheckCircle2 className="w-6 h-6 text-blue-400 shrink-0"/> Everything in Plus</li>
            <li className="flex gap-4 items-start"><CheckCircle2 className="w-6 h-6 text-blue-400 shrink-0"/> 4 Human-graded Writing Tasks / mo</li>
            <li className="flex gap-4 items-start"><CheckCircle2 className="w-6 h-6 text-blue-400 shrink-0"/> 2 1-on-1 Mock Speaking Interviews / mo</li>
            <li className="flex gap-4 items-start"><CheckCircle2 className="w-6 h-6 text-blue-400 shrink-0"/> Guaranteed Band 7+ or Money Back</li>
            <li className="flex gap-4 items-start"><CheckCircle2 className="w-6 h-6 text-blue-400 shrink-0"/> VIP Event Access with highest multipliers</li>
          </ul>
          
          <button 
            onClick={() => handleCheckout('pro')}
            disabled={profile?.accountTier === 'pro'}
            className="w-full py-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-lg transition-colors border border-slate-600 shadow-sm disabled:opacity-50"
          >
            {profile?.accountTier === 'pro' ? 'Current Plan' : 'Go Pro'}
          </button>
        </div>

      </div>
      
      {/* ── TOKEN SHOP ── */}
      <div id="tokens" className="mt-24 mb-10 pt-10">
        <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-slate-900 mb-3 tracking-tight">Need more tokens?</h2>
            <p className="text-lg text-slate-500 font-medium">Top up your balance instantly to unlock more test results</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Starter Bundle */}
            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm hover:shadow-md transition-shadow group">
                <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Zap className="w-6 h-6 text-slate-400" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-1">Starter Pack</h3>
                <div className="flex items-baseline gap-1 mb-6">
                    <span className="text-3xl font-black text-slate-900">$1</span>
                </div>
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 mb-8">
                    <div className="flex items-center gap-2 text-slate-700 font-black">
                        <Zap className="w-5 h-5 text-amber-500 fill-amber-500" />
                        <span className="text-2xl">5 Tokens</span>
                    </div>
                    <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-wider font-display">Fast results</p>
                </div>
                <button 
                  onClick={() => handleCheckout('tokens-starter')}
                  className="w-full py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-900 font-black text-sm border-2 border-slate-200 transition-all active:scale-95"
                >
                  Buy Starter
                </button>
            </div>

            {/* Popular Bundle */}
            <div className="bg-white rounded-3xl p-8 border-2 border-primary-500 shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 bg-primary-500 text-white text-[10px] font-black px-4 py-1.5 rounded-bl-2xl uppercase tracking-widest">
                    Best Value 🔥
                </div>
                <div className="w-12 h-12 bg-primary-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Zap className="w-6 h-6 text-primary-500 fill-primary-500" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-1">Popular Pack</h3>
                <div className="flex items-baseline gap-1 mb-6">
                    <span className="text-3xl font-black text-slate-900">$5</span>
                </div>
                <div className="bg-primary-50 rounded-2xl p-4 border border-primary-100 mb-8">
                    <div className="flex items-center gap-2 text-primary-700 font-black">
                        <Zap className="w-5 h-5 text-amber-500 fill-amber-500" />
                        <span className="text-2xl">26 Tokens</span>
                    </div>
                    <p className="text-xs text-primary-400 font-bold mt-1 uppercase tracking-wider">Most popular choice</p>
                </div>
                <button 
                  onClick={() => handleCheckout('tokens-popular')}
                  className="w-full py-3.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-black text-sm transition-all shadow-lg shadow-primary-500/20 active:scale-95"
                >
                  Buy Popular
                </button>
            </div>

            {/* Pro Bundle */}
            <div className="bg-slate-900 rounded-3xl p-8 border border-slate-800 shadow-lg group">
                <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Zap className="w-6 h-6 text-blue-400 fill-blue-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-1">Pro Bundle</h3>
                <div className="flex items-baseline gap-1 mb-6">
                    <span className="text-3xl font-black text-white">$10</span>
                </div>
                <div className="bg-white/5 rounded-2xl p-4 border border-white/10 mb-8">
                    <div className="flex items-center gap-2 text-white font-black">
                        <Zap className="w-5 h-5 text-amber-500 fill-amber-500" />
                        <span className="text-2xl">51 Tokens</span>
                    </div>
                    <p className="text-xs text-slate-500 font-bold mt-1 uppercase tracking-wider">Heavy practice</p>
                </div>
                <button 
                  onClick={() => handleCheckout('tokens-pro')}
                  className="w-full py-3.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-black text-sm transition-all active:scale-95"
                >
                  Buy Pro Pack
                </button>
            </div>
        </div>
      </div>

    </div>
  );
}
