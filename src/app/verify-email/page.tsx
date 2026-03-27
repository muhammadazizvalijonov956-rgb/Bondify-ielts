"use client";

import { Suspense, useEffect, useState } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { sendEmailVerification } from 'firebase/auth';
import { useRouter, useSearchParams } from 'next/navigation';

function VerifyEmailForm() {
  const { user } = useAuth();
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextParam = searchParams.get('next') || '/';

  const handleResend = async () => {
    if (!user) return;
    try {
      await sendEmailVerification(user);
      setMessage('Verification email sent! Check your inbox.');
      setError('');
    } catch (err: any) {
      if (err.code === 'auth/too-many-requests') {
        setError('Too many requests. Please wait a minute before resending.');
      } else {
        setError(err.message || 'Failed to resend email.');
      }
      setMessage('');
    }
  };

  const handleRefresh = async () => {
    if (!user) return;
    setRefreshing(true);
    try {
      await user.reload();
      if (user.emailVerified) {
        router.push(nextParam);
      } else {
        setError('Email is still not verified. Please check your inbox and click the link.');
      }
    } catch (err) {
      setError('Failed to refresh status.');
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user?.emailVerified) {
      router.push(nextParam);
    }
  }, [user, nextParam, router]);

  if (!user) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-100 text-center">
        <div className="w-16 h-16 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold mb-2 text-slate-800">Verify Your Email</h2>
        <p className="text-slate-600 mb-6">
          We&apos;ve sent a verification link to <span className="font-semibold text-slate-900">{user.email}</span>.
          Please verify your email to access Bondify practice tests.
        </p>

        {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm border border-red-100">{error}</div>}
        {message && <div className="bg-green-50 text-green-700 p-3 rounded-lg mb-4 text-sm font-semibold border border-green-100">{message}</div>}

        <div className="space-y-4">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="w-full bg-primary-600 text-white font-bold py-3.5 rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
          >
            {refreshing ? 'Checking...' : '✅ I have verified my email'}
          </button>

          <button
            onClick={handleResend}
            className="w-full bg-slate-100 text-slate-700 font-semibold py-3 rounded-xl hover:bg-slate-200 transition-colors"
          >
            Resend Verification Email
          </button>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-[60vh] flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>}>
      <VerifyEmailForm />
    </Suspense>
  );
}
