"use client";

import { useEffect, useState } from 'react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Search, ShieldAlert, Star, TrendingUp, MoreVertical, Check, X } from 'lucide-react';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Edit State Modal/Row Tracking
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'users'));
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(list);
    } catch (err) {
      console.error("Failed to load users", err);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (user: any) => {
    setEditingId(user.id);
    setEditForm({
      role: user.role || 'user',
      accountTier: user.accountTier || 'free',
      tokenBalance: user.tokenBalance || 0
    });
  };

  const saveEdit = async () => {
    if (!editingId) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', editingId), {
        role: editForm.role,
        accountTier: editForm.accountTier,
        tokenBalance: Number(editForm.tokenBalance)
      });
      // Update local state
      setUsers(users.map(u => u.id === editingId ? { ...u, ...editForm } : u));
      setEditingId(null);
    } catch (err) {
      alert("Failed to update user.");
    }
    setSaving(false);
  };

  const filteredUsers = users.filter(user =>
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900">User Management</h1>
          <p className="text-slate-500 font-medium mt-1">Control access, premium tiers, and token balances.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="relative max-w-md w-full">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by email or username..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
            />
          </div>
          <div className="text-sm font-bold text-slate-500">{filteredUsers.length} Users Total</div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                <th className="p-4">User Details</th>
                <th className="p-4">Role</th>
                <th className="p-4">Plan Tier</th>
                <th className="p-4">Tokens</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500 font-medium">Loading user database...</td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500 font-medium">No users found.</td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-sm">
                          {user.username?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 flex items-center gap-1">
                            {user.username || 'No Username'}
                            {['go', 'plus', 'pro'].includes(user.accountTier) && <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />}
                          </div>
                          <div className="text-sm text-slate-500 mt-0.5">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      {editingId === user.id ? (
                        <select
                          value={editForm.role}
                          onChange={e => setEditForm({ ...editForm, role: e.target.value })}
                          className="px-2 py-1 border border-slate-300 rounded text-sm outline-none focus:border-primary-500"
                        >
                          <option value="user">user</option>
                          <option value="admin">admin</option>
                        </select>
                      ) : (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold capitalize ${user.role === 'admin' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-700'
                          }`}>
                          {user.role === 'admin' && <ShieldAlert className="w-3 h-3 mr-1" />}
                          {user.role || 'user'}
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      {editingId === user.id ? (
                        <select
                          value={editForm.accountTier}
                          onChange={e => setEditForm({ ...editForm, accountTier: e.target.value })}
                          className="px-2 py-1 border border-slate-300 rounded text-sm outline-none focus:border-primary-500"
                        >
                          <option value="free">free</option>
                          <option value="go">go ($2.99)</option>
                          <option value="plus">plus ($7.99)</option>
                          <option value="pro">pro ($19)</option>
                        </select>
                      ) : (
                        <span className={`inline-block font-bold text-sm capitalize ${['go', 'plus', 'pro'].includes(user.accountTier) ? 'text-amber-600' : 'text-slate-600'}`}>
                          {user.accountTier || 'free'}
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      {editingId === user.id ? (
                        <input
                          type="number"
                          value={editForm.tokenBalance}
                          onChange={e => setEditForm({ ...editForm, tokenBalance: e.target.value })}
                          className="w-20 px-2 py-1 border border-slate-300 rounded text-sm outline-none focus:border-primary-500"
                        />
                      ) : (
                        <div className="flex items-center gap-1 font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-lg w-fit">
                          <TrendingUp className="w-3.5 h-3.5" />
                          {user.tokenBalance ?? 0}
                        </div>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      {editingId === user.id ? (
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={saveEdit} disabled={saving} className="p-1.5 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 rounded-md transition-colors disabled:opacity-50">
                            <Check className="w-4 h-4" />
                          </button>
                          <button onClick={() => setEditingId(null)} disabled={saving} className="p-1.5 bg-rose-100 text-rose-700 hover:bg-rose-200 rounded-md transition-colors disabled:opacity-50">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => startEdit(user)} className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 transition-colors rounded-lg font-bold text-sm underline-offset-4 hover:underline">
                          Edit Access
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
