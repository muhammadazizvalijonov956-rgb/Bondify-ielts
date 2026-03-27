"use client";

import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/lib/contexts/AuthContext';
import { db } from '@/lib/firebase/config';
import { doc, updateDoc } from 'firebase/firestore';
import { useState } from 'react';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { User as UserIcon, Lock, Bell, ShieldCheck } from 'lucide-react';

export default function SettingsPage() {
  const { user, profile } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');
  const [passwordErr, setPasswordErr] = useState('');
  const [saving, setSaving] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !user.email) return;
    setSaving(true);
    setPasswordMsg('');
    setPasswordErr('');

    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      setPasswordMsg('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err: any) {
      setPasswordErr(err.message || 'Failed to update password.');
    }
    setSaving(false);
  };

  return (
    <ProtectedRoute>
      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Settings</h1>
        <p className="text-slate-500 mb-8 font-medium">Manage your Bondify account preferences.</p>

        <div className="space-y-6">

          {/* Account Info */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                <UserIcon className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-slate-800">Account Information</h2>
            </div>
            <div className="space-y-4 text-sm text-slate-600 font-medium">
              <div className="flex justify-between py-3 border-b border-slate-100">
                <span className="text-slate-500">Username</span>
                <span className="font-bold text-slate-900">{profile?.username || '—'}</span>
              </div>
              <div className="flex justify-between py-3 border-b border-slate-100">
                <span className="text-slate-500">Email</span>
                <span className="font-bold text-slate-900">{user?.email}</span>
              </div>
              <div className="flex justify-between py-3 border-b border-slate-100">
                <span className="text-slate-500">Account Plan</span>
                <span className="bg-primary-100 text-primary-700 font-bold px-3 py-0.5 rounded-full capitalize text-xs">{profile?.accountTier || 'free'}</span>
              </div>
              <div className="flex justify-between py-3">
                <span className="text-slate-500">Member Since</span>
                <span className="font-bold text-slate-900">{profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : '—'}</span>
              </div>
            </div>
          </div>

          {/* Change Password */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
                <Lock className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-slate-800">Change Password</h2>
            </div>

            {passwordMsg && (
              <div className="bg-green-50 text-green-700 border border-green-100 p-3 rounded-xl mb-4 text-sm font-medium">{passwordMsg}</div>
            )}
            {passwordErr && (
              <div className="bg-red-50 text-red-600 border border-red-100 p-3 rounded-xl mb-4 text-sm">{passwordErr}</div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Current Password</label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none bg-slate-50"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">New Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none bg-slate-50"
                />
              </div>
              <button
                type="submit"
                disabled={saving}
                className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-6 rounded-xl transition-colors disabled:opacity-50 shadow-sm"
              >
                {saving ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>

          {/* Plan upgrade shortcut */}
          <div className="bg-slate-900 rounded-2xl p-8 flex items-center justify-between gap-6 text-white">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <ShieldCheck className="w-5 h-5 text-primary-400" />
                <h3 className="font-bold text-lg">Premium Access</h3>
              </div>
              <p className="text-slate-400 font-medium text-sm">Unlock unlimited practice, premium events, and instant band scores.</p>
            </div>
            <a
              href="/pricing"
              className="shrink-0 bg-primary-600 hover:bg-primary-700 text-white font-bold px-6 py-3 rounded-xl transition-colors shadow-sm whitespace-nowrap"
            >
              View Plans
            </a>
          </div>

        </div>
      </div>
    </ProtectedRoute>
  );
}
