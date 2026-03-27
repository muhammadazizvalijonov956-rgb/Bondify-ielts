"use client";

import { useState } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MailCheck, ArrowLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess(true);
    } catch (err: any) {
      // Provide a generic error message or specifically handle common firebase codes
      const msg = err.code === 'auth/user-not-found'
        ? 'No account found with this email address.'
        : err.message || 'Failed to send password reset email.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-100">
        <Link href="/login" className="inline-flex items-center text-sm font-bold text-slate-500 hover:text-primary-600 mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to login
        </Link>

        {!success ? (
          <>
            <h2 className="text-3xl font-bold mb-2 text-slate-800">Reset Password</h2>
            <p className="text-slate-500 mb-8 text-sm">
              Enter the email address associated with your Bondify account and we'll send you a link to reset your password.
            </p>

            {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-6 text-sm border border-red-100 font-medium">{error}</div>}

            <form onSubmit={handleResetPassword} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all bg-slate-50 hover:bg-white"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={loading || !email}
                className="w-full bg-primary-600 text-white font-bold py-3.5 rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-70 shadow-sm"
              >
                {loading ? 'Sending link...' : 'Send Reset Link'}
              </button>
            </form>
          </>
        ) : (
          <div className="text-center py-6 animate-in zoom-in duration-300">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <MailCheck className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold mb-3 text-slate-800">Check Your Inbox</h2>
            <p className="text-slate-500 mb-8 text-sm leading-relaxed">
              We've sent a password reset link to <span className="font-bold text-slate-700">{email}</span>. Please check your spam folder if you don't see it within a few minutes.
            </p>
            <Link
              href="/login"
              className="w-full block bg-slate-900 text-white font-bold py-3.5 rounded-xl hover:bg-slate-800 transition-colors shadow-sm"
            >
              Return to Login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
