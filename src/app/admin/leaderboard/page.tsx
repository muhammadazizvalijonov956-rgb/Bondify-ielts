"use client";

import { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Trophy, RefreshCw, Star, Target, Crown } from 'lucide-react';

export default function AdminLeaderboardPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      // Fetch all attempts to calculate true stats
      const attemptsSnap = await getDocs(collection(db, 'attempts'));
      const userStatsMap: Record<string, any> = {};

      attemptsSnap.docs.forEach(docSnap => {
        const attempt = docSnap.data();
        const uid = attempt.userId;
        const score = attempt.normalizedScore || 0;
        const band = typeof attempt.estimatedBand === 'number' ? attempt.estimatedBand : parseFloat(attempt.estimatedBand || '0');

        if (!userStatsMap[uid]) {
          userStatsMap[uid] = {
            userId: uid,
            totalScore: 0,
            testsCompleted: 0,
            bands: [] as number[],
            username: attempt.userDisplayName || 'Unknown'
          };
        }

        userStatsMap[uid].totalScore += score;
        userStatsMap[uid].testsCompleted += 1;
        if (band > 0) userStatsMap[uid].bands.push(band);
      });

      // Fetch actual user profile data for current usernames/tiers
      const usersSnap = await getDocs(collection(db, 'users'));
      const usersMap: Record<string, any> = {};
      usersSnap.forEach(uDoc => {
        usersMap[uDoc.id] = uDoc.data();
      });

      // Convert map to sorted list
      const list = Object.values(userStatsMap).map((stat: any) => {
        const profile = usersMap[stat.userId];
        const avgBand = stat.bands.length > 0 
          ? (stat.bands.reduce((a: number, b: number) => a + b, 0) / stat.bands.length).toFixed(1)
          : 'Unranked';

        return {
          id: stat.userId,
          username: profile?.username || stat.username,
          accountTier: profile?.accountTier || 'free',
          leaderboardStats: {
            totalScore: stat.totalScore,
            testsCompleted: stat.testsCompleted,
            averageBand: avgBand
          }
        };
      }).sort((a: any, b: any) => b.leaderboardStats.totalScore - a.leaderboardStats.totalScore);

      setUsers(list.slice(0, 100)); // Top 100
    } catch (err) {
      console.error("Failed to load leaderboard analytics", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchLeaderboard();
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Leaderboard Analytics</h1>
          <p className="text-slate-500 font-medium mt-1">Monitor the top 100 students across the platform.</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing || loading}
          className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold py-3 px-6 rounded-xl shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
          Force Recalculate
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
          <Crown className="absolute -right-4 -bottom-4 w-32 h-32 opacity-10" />
          <h3 className="text-amber-100 font-bold mb-1">Rank #1 Target</h3>
          <div className="text-4xl font-black mb-2">{users[0]?.leaderboardStats?.totalScore || 0} pts</div>
          <div className="font-bold bg-black/20 px-3 py-1 rounded-lg w-fit text-sm">
            {users[0]?.username || 'N/A'}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <h3 className="text-slate-500 font-bold mb-1">Total Ranked</h3>
          <div className="text-3xl font-black text-slate-800 mb-2">{users.length}</div>
          <div className="text-sm font-medium text-slate-400">Users with recorded scores</div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <h3 className="text-slate-500 font-bold mb-1">Avg Score (Top 100)</h3>
          <div className="text-3xl font-black text-slate-800 mb-2">
            {users.length > 0
              ? Math.round(users.reduce((acc, u) => acc + (u.leaderboardStats?.totalScore || 0), 0) / users.length)
              : 0}
          </div>
          <div className="text-sm font-medium text-slate-400">Points per user</div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                <th className="p-4 w-20 text-center">Rank</th>
                <th className="p-4">User</th>
                <th className="p-4 text-right">Tests Completed</th>
                <th className="p-4 text-right">Avg Band</th>
                <th className="p-4 text-right">Total Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500 font-medium">Loading rankings...</td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500 font-medium">No ranked users found.</td>
                </tr>
              ) : (
                users.map((user, index) => {
                  const isTop3 = index < 3;
                  const medalColors = ['bg-amber-100 text-amber-600', 'bg-slate-200 text-slate-600', 'bg-orange-100 text-orange-600'];

                  return (
                    <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 text-center">
                        {isTop3 ? (
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black mx-auto ${medalColors[index]}`}>
                            {index + 1}
                          </div>
                        ) : (
                          <div className="w-8 h-8 font-bold text-slate-400 flex items-center justify-center mx-auto">
                            {index + 1}
                          </div>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-slate-900 text-lg flex items-center gap-2">
                          {user.username}
                          {['plus', 'pro', 'go'].includes(user.accountTier) && <Star className="w-4 h-4 text-amber-500 fill-amber-500" />}
                        </div>
                      </td>
                      <td className="p-4 text-right text-slate-600 font-medium">
                        {user.leaderboardStats?.testsCompleted || 0}
                      </td>
                      <td className="p-4 text-right">
                        <span className="font-bold text-primary-600 bg-primary-50 px-3 py-1 rounded-lg">
                          {user.leaderboardStats?.averageBand || 'Unranked'}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 font-black text-emerald-600 text-xl">
                          <Target className="w-4 h-4" />
                          {user.leaderboardStats?.totalScore || 0}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
