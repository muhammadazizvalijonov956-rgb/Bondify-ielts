"use client";

import { Suspense } from 'react';
import { useState } from 'react';
import { createUserWithEmailAndPassword, sendEmailVerification, updateProfile } from 'firebase/auth';
import { setDoc, doc, collection, query, where, getDocs, updateDoc, increment } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/config';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function RegisterForm() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextParam = searchParams.get('next') || '/';
  const referralCode = searchParams.get('ref') || null;

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await updateProfile(user, { displayName: fullName });

      // Generate a basic username from email
      const baseUsername = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '') + Math.floor(Math.random() * 1000);

      // Save full UserProfile to Firestore
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        fullName,
        email,
        phone,
        username: baseUsername,
        profilePhotoUrl: null,
        role: 'user',
        accountTier: 'free',
        tokenBalance: 5,
        referralCode: `ref_${baseUsername}`,
        referredBy: referralCode,
        successfulReferralCount: 0,
        leaderboardStats: {
          totalScore: 0,
          testsCompleted: 0,
          averageBand: 0
        },
        emailVerified: false,
        phoneVerified: false,
        createdAt: new Date().toISOString()
      });

      // Handle Referral Reward (Direct client-side for now)
      if (referralCode) {
        try {
          const referrersQuery = query(collection(db, 'users'), where('referralCode', '==', referralCode));
          const referrerSnap = await getDocs(referrersQuery);
          
          if (!referrerSnap.empty) {
            const referrerDoc = referrerSnap.docs[0];
            const currentCount = (referrerDoc.data().successfulReferralCount || 0) + 1;
            
            // Increment the count and grant basic reward
            const updates: any = {
              successfulReferralCount: increment(1),
              tokenBalance: increment(20) // +20 tokens for every referral
            };

            // Bonus on 2nd referral
            if (currentCount === 2) {
              updates.tokenBalance = increment(120); // 20 standard + 100 bonus
            }

            await updateDoc(doc(db, 'users', referrerDoc.id), updates);
          }
        } catch (refErr) {
          console.error("Failed to process referral reward:", refErr);
        }
      }

      // Send verification email
      await sendEmailVerification(user);

      // Redirect to verification page
      router.push(`/verify-email?next=${encodeURIComponent(nextParam)}`);
    } catch (err: any) {
      setError(err.message || 'Registration failed');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-100">
        <div className="flex justify-center mb-6">
          <img src="/logo.png" alt="Bondify" className="h-12 w-auto" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        </div>
        <h2 className="text-3xl font-bold mb-2 text-center text-slate-800">Create Account</h2>
        <p className="text-slate-500 text-center mb-8 text-sm">Join Bondify and start practicing today. Free forever.</p>

        {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm border border-red-100">{error}</div>}

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Full Name</label>
            <input
              id="register-fullname"
              type="text"
              required
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all bg-slate-50 hover:bg-white"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Email</label>
            <input
              id="register-email"
              type="email"
              required
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all bg-slate-50 hover:bg-white"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Phone Number <span className="text-slate-400 font-normal">(Optional)</span></label>
            <input
              id="register-phone"
              type="tel"
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all bg-slate-50 hover:bg-white placeholder-slate-400"
              placeholder="+1 234 567 8900"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Password</label>
            <input
              id="register-password"
              type="password"
              required
              minLength={6}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all bg-slate-50 hover:bg-white"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button
            id="register-submit"
            type="submit"
            disabled={loading}
            className="w-full bg-primary-600 text-white font-bold py-3.5 rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-70 mt-2 shadow-sm"
          >
            {loading ? 'Creating Account...' : 'Create Free Account'}
          </button>
        </form>
        <p className="mt-6 text-center text-slate-600 text-sm">
          Already have an account? <Link href={`/login?next=${encodeURIComponent(nextParam)}`} className="text-primary-600 font-semibold hover:underline">Log in</Link>
        </p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-[80vh] flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>}>
      <RegisterForm />
    </Suspense>
  );
}
