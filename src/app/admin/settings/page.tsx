"use client";

import { useState } from 'react';
import { Save, ShieldCheck, Coins, Gift, AlertOctagon } from 'lucide-react';

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  // Mock global settings state
  const [settings, setSettings] = useState({
    registrationTokens: 5,
    dailyTokens: 1,
    unlockResultCost: 1,
    referralReward: 3,
    maxTokenBalance: 50,
    enableLeaderboard: true,
    enableReferrals: true,
    allowSignups: true
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess('');

    // In production, update an 'app/config' document in firestore here
    await new Promise(resolve => setTimeout(resolve, 800));

    setSuccess('Platform settings successfully updated across all regions.');
    setLoading(false);
  };

  return (
    <div className="p-8 max-w-5xl mx-auto pb-32">
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Platform Settings</h1>
          <p className="text-slate-500 font-medium mt-1">Global logic controls for tokens, referrals, and security.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={loading}
          className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-8 rounded-xl shadow-lg transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          {loading ? 'Committing...' : <><Save className="w-5 h-5" /> Commit Changes</>}
        </button>
      </div>

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-4 rounded-xl mb-8 font-bold flex items-center gap-3">
          <ShieldCheck className="w-5 h-5" />
          {success}
        </div>
      )}

      <form onSubmit={handleSave} className="grid md:grid-cols-2 gap-8">

        {/* Token Economy */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 space-y-6">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
            <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
              <Coins className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-800">Token Economy</h2>
          </div>

          <div className="grid gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-600 mb-2 font-mono">NEW_ACCOUNT_BONUS</label>
              <input type="number" value={settings.registrationTokens} onChange={e => setSettings({ ...settings, registrationTokens: parseInt(e.target.value) })} className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 font-bold bg-slate-50" />
              <p className="text-xs text-slate-400 mt-2">Tokens issued to users upon email verification.</p>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-600 mb-2 font-mono">DAILY_REFILL_AMOUNT</label>
              <input type="number" value={settings.dailyTokens} onChange={e => setSettings({ ...settings, dailyTokens: parseInt(e.target.value) })} className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 font-bold bg-slate-50" />
              <p className="text-xs text-slate-400 mt-2">Free tokens granted every 24 hours.</p>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-600 mb-2 font-mono">UNLOCK_RESULT_COST</label>
              <input type="number" value={settings.unlockResultCost} onChange={e => setSettings({ ...settings, unlockResultCost: parseInt(e.target.value) })} className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 font-bold bg-slate-50" />
              <p className="text-xs text-slate-400 mt-2">Cost to view detailed band scores per test attempt.</p>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {/* Referrals */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <Gift className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-slate-800">Growth Limits</h2>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-bold text-slate-600 mb-2 font-mono">REFERRAL_REWARD_TOKENS</label>
              <input type="number" value={settings.referralReward} onChange={e => setSettings({ ...settings, referralReward: parseInt(e.target.value) })} className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 font-bold bg-slate-50" />
              <p className="text-xs text-slate-400 mt-2">Tokens awarded when a friend signs up via link.</p>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-600 mb-2 font-mono">MAX_TOKEN_CAP</label>
              <input type="number" value={settings.maxTokenBalance} onChange={e => setSettings({ ...settings, maxTokenBalance: parseInt(e.target.value) })} className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 font-bold bg-slate-50" />
              <p className="text-xs text-slate-400 mt-2">Hard limit to prevent infinite token farming.</p>
            </div>
          </div>

          {/* System Flags */}
          <div className="bg-white rounded-2xl shadow-sm border-2 border-rose-100 p-8">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-rose-100">
              <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
                <AlertOctagon className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-slate-800">Critical Flags</h2>
            </div>

            <div className="space-y-4">
              <label className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors">
                <div>
                  <div className="font-bold text-slate-800">Allow New Signups</div>
                  <div className="text-xs text-slate-500 font-medium">Temporarily freeze new registrations</div>
                </div>
                <input type="checkbox" checked={settings.allowSignups} onChange={e => setSettings({ ...settings, allowSignups: e.target.checked })} className="w-5 h-5 accent-rose-600" />
              </label>

              <label className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors">
                <div>
                  <div className="font-bold text-slate-800">Calculate Leaderboard</div>
                  <div className="text-xs text-slate-500 font-medium">Toggles live ranking calculation</div>
                </div>
                <input type="checkbox" checked={settings.enableLeaderboard} onChange={e => setSettings({ ...settings, enableLeaderboard: e.target.checked })} className="w-5 h-5 accent-blue-600" />
              </label>

              <label className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors">
                <div>
                  <div className="font-bold text-slate-800">Accept Referrals</div>
                  <div className="text-xs text-slate-500 font-medium">Process new invite links</div>
                </div>
                <input type="checkbox" checked={settings.enableReferrals} onChange={e => setSettings({ ...settings, enableReferrals: e.target.checked })} className="w-5 h-5 accent-emerald-600" />
              </label>
            </div>
          </div>

        </div>
      </form>
    </div>
  );
}
