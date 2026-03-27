"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import { db } from '@/lib/firebase/config';
import { doc, updateDoc } from 'firebase/firestore';
import { User as UserIcon, Camera, Copy, CheckCircle2, Star, Trophy, Target, Award } from 'lucide-react';

export default function ProfilePage() {
  const { user, profile } = useAuth();
  const [editingName, setEditingName] = useState(false);
  const [newUsername, setNewUsername] = useState(profile?.username || '');
  const [copiedLink, setCopiedLink] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Generate referral code if it doesn't exist (for existing users)
    const ensureReferralCode = async () => {
      if (profile && !profile.referralCode) {
        try {
          await updateDoc(doc(db, 'users', profile.uid), {
            referralCode: `ref_${profile.username.toLowerCase() || 'student'}_${profile.uid.slice(0, 4)}`
          });
        } catch (err) {
          console.error("Failed to generate missing referral code", err);
        }
      }
    };
    ensureReferralCode();
  }, [profile]);

  const handleUpdateUsername = async () => {
    if (!profile || newUsername === profile.username) {
      setEditingName(false);
      return;
    }
    
    setLoading(true);
    try {
      // Basic check - In a real app we'd need to query Firestore to ensure the username isn't already taken
      await updateDoc(doc(db, 'users', profile.uid), {
        username: newUsername
      });
      setEditingName(false);
    } catch(err) {
      console.error("Failed to update username", err);
      setNewUsername(profile.username); // revert
    }
    setLoading(false);
  };

  const copyReferral = () => {
    if (!profile) return;
    const url = `${window.location.origin}/register?ref=${profile.referralCode}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (!profile || !user) return <ProtectedRoute><div className="p-12 text-center text-slate-500">Loading profile...</div></ProtectedRoute>;

  const isPremium = ['go', 'plus', 'pro'].includes(profile.accountTier);

  return (
    <ProtectedRoute>
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-slate-900 mb-8 border-b border-slate-200 pb-4">My Account</h1>

        <div className="grid md:grid-cols-3 gap-8">
          
          {/* Left Column: Avatar & Basic Info */}
          <div className="md:col-span-1 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center relative flex flex-col items-center">
              
              <div className="relative mb-6 group cursor-pointer">
                <div className="w-32 h-32 rounded-full border-4 border-slate-50 overflow-hidden shadow-md flex items-center justify-center bg-primary-100 text-primary-700 mx-auto">
                  {profile.profilePhotoUrl ? (
                    <img src={profile.profilePhotoUrl} alt="avatar" className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon className="w-16 h-16"/>
                  )}
                </div>
                {/* Photo Upload Overlay Placeholder */}
                <div className="absolute inset-0 bg-slate-900/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="text-white w-8 h-8"/>
                </div>
              </div>

              {editingName ? (
                <div className="w-full">
                  <input 
                    type="text" 
                    value={newUsername} 
                    onChange={e => setNewUsername(e.target.value)}
                    className="w-full px-3 py-2 border border-primary-500 rounded-lg focus:outline-none mb-2 text-center"
                    autoFocus
                  />
                  <div className="flex justify-center gap-2">
                    <button disabled={loading} onClick={handleUpdateUsername} className="text-xs bg-primary-600 text-white px-3 py-1.5 rounded disabled:opacity-50">Save</button>
                    <button disabled={loading} onClick={() => {setEditingName(false); setNewUsername(profile.username);}} className="text-xs text-slate-500 hover:text-slate-800 disabled:opacity-50">Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center w-full">
                  <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2 justify-center group w-full">
                    {profile.username}
                    {isPremium && <Star className="w-5 h-5 text-amber-500 fill-amber-500 shrink-0" />}
                  </h2>
                  <button onClick={() => setEditingName(true)} className="text-xs text-primary-600 font-semibold hover:underline mt-1">Change Username</button>
                </div>
              )}

              <p className="text-slate-500 text-sm mt-4 font-medium">{profile.email}</p>
              
              <div className="mt-8 w-full border-t border-slate-100 pt-6">
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <div className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Account Tier</div>
                  <div className="text-lg font-black text-slate-800 capitalize flex items-center justify-center gap-2">
                    {profile.accountTier} Plan {isPremium && <Star className="w-4 h-4 text-amber-500 fill-amber-500"/>}
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Right Column: Stats & Referrals */}
          <div className="md:col-span-2 space-y-8">
            
            {/* Tokens Box */}
            <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-3xl p-8 text-white shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10 transform translate-x-4 -translate-y-4">
                <Trophy className="w-48 h-48"/>
              </div>
              <h3 className="text-lg font-bold text-primary-200 mb-2">My Balance</h3>
              <div className="text-5xl font-black mb-6">{profile.tokenBalance} <span className="text-2xl font-bold text-primary-300">Tokens</span></div>
              <p className="text-primary-100 font-medium max-w-sm leading-relaxed mb-6 block bg-black/10 p-3 rounded-lg border border-white/10">
                Use tokens to unlock full detailed answers and AI-graded essay scores. Free tokens recharge daily.
              </p>
              {!isPremium && (
                <a href="/pricing" className="inline-block bg-white text-primary-700 font-bold px-6 py-2.5 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                  Upgrade for Unlimited &rarr;
                </a>
              )}
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              
              {/* Leaderboard Stats */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center"><Target className="w-5 h-5"/></div>
                  <h3 className="font-bold text-slate-800 text-lg">My Statistics</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-3 border-b border-slate-50">
                    <span className="text-slate-500 font-medium text-sm">Tests Completed</span>
                    <span className="font-black text-slate-800 text-lg">{profile.leaderboardStats?.testsCompleted || 0}</span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b border-slate-50">
                    <span className="text-slate-500 font-medium text-sm">Estimated Band</span>
                    <span className="font-black text-primary-600 text-lg bg-primary-50 px-2 rounded-md">{profile.leaderboardStats?.averageBand || 'Unranked'}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2">
                    <span className="text-slate-500 font-medium text-sm">Total Score / Points</span>
                    <span className="font-black text-emerald-600 text-lg">{profile.leaderboardStats?.totalScore || 0}</span>
                  </div>
                </div>
              </div>

              {/* Milestones & Badges */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-fuchsia-100 text-fuchsia-600 flex items-center justify-center"><Award className="w-5 h-5"/></div>
                  <h3 className="font-bold text-slate-800 text-lg">Milestones & Badges</h3>
                </div>
                <div className="grid grid-cols-4 gap-4">
                  {[
                    { id: 'writing_warrior', label: 'Writing Warrior', desc: 'Completed 10 Writing tasks', icon: '⚔️' },
                    { id: 'early_bird', label: 'Early Bird', desc: 'Practiced before 7 AM', icon: '☀️' },
                    { id: 'the_comeback', label: 'The Comeback', desc: 'Returned after a streak break', icon: '🔄' },
                    { id: 'night_owl', label: 'Night Owl', desc: 'Practice after midnight', icon: '🦉' },
                    { id: 'consistency_king', label: 'Consistency King', desc: 'Hit the same score 3x in a row', icon: '👑' },
                  ].map((badge) => {
                    const isEarned = (profile.badges || []).includes(badge.id);
                    return (
                      <div key={badge.id} className={`group relative flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${isEarned ? 'bg-fuchsia-50/50 border-fuchsia-100' : 'bg-slate-50 border-slate-100 opacity-40 grayscale'}`}>
                        <div className="text-2xl mb-1">{badge.icon}</div>
                        <span className="text-[10px] font-black uppercase text-center text-slate-700 leading-tight">{badge.label}</span>
                        
                        {/* Tooltip on hover */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-32 p-2 bg-slate-900 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity text-center z-20">
                          <p className="font-black mb-1">{badge.label}</p>
                          <p className="opacity-80 leading-snug">{badge.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Referral System */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-slate-800 text-lg mb-2">Refer To Earn Tokens</h3>
                  <p className="text-sm text-slate-500 mb-6 font-medium leading-relaxed">Share Bondify with friends. Get 100 extra tokens when 2 friends sign up!</p>
                  
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-3 font-medium text-sm">
                      <span className={`w-6 h-6 rounded-full flex justify-center items-center font-bold text-xs ${profile.successfulReferralCount >= 1 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>1</span>
                      <span className={profile.successfulReferralCount >= 1 ? 'text-slate-900' : 'text-slate-400'}>First Friend</span>
                    </div>
                    <div className="flex items-center gap-3 font-medium text-sm">
                      <span className={`w-6 h-6 rounded-full flex justify-center items-center font-bold text-xs ${profile.successfulReferralCount >= 2 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>2</span>
                      <span className={profile.successfulReferralCount >= 2 ? 'text-slate-900' : 'text-slate-400'}>Second Friend</span>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={copyReferral}
                  className="w-full relative flex items-center justify-center gap-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold py-3 rounded-xl transition-all shadow-sm"
                >
                  {copiedLink ? <CheckCircle2 className="w-5 h-5 text-emerald-500"/> : <Copy className="w-5 h-5 text-slate-400"/>}
                  {copiedLink ? <span className="text-emerald-600">Link Copied!</span> : 'Copy Referral Link'}
                </button>
              </div>

            </div>

          </div>

        </div>

      </div>
    </ProtectedRoute>
  );
}
