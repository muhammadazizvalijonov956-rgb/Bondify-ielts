"use client";

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase/config';
import { collection, query, orderBy, limit, getDocs, updateDoc, doc } from 'firebase/firestore';
import { Loader2, Search, Filter, Eye, Activity, RotateCcw, Clock, CheckCircle2, AlertTriangle, X, Plus } from 'lucide-react';
import Link from 'next/link';

interface MonitorRow {
  id: string; // session id or attempt id
  studentName: string;
  testName: string;
  testId: string;
  status: 'In Progress' | 'Interrupted' | 'Completed';
  currentSection: string;
  lastSavedDate: Date;
  answers: any;
  score?: number;
  docType: 'session' | 'attempt';
  rawRecord: any;
}

const isRecent = (date: Date, minutes: number) => {
  return (Date.now() - date.getTime()) < minutes * 60 * 1000;
};

const timeAgo = (date: Date) => {
  const diffInMinutes = Math.floor((Date.now() - date.getTime()) / 60000);
  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
};

export default function TestMonitorPage() {
  const [data, setData] = useState<MonitorRow[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchName, setSearchName] = useState('');
  const [searchTest, setSearchTest] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'In Progress' | 'Interrupted' | 'Completed'>('All');

  // Modal
  const [viewSession, setViewSession] = useState<MonitorRow | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch In-Progress and Interrupted sessions
      const sessionsQ = query(collection(db, 'test_sessions'), orderBy('updated_at', 'desc'), limit(100));
      const sessionsSnap = await getDocs(sessionsQ);
      
      // 2. Fetch Completed attempts
      const attemptsQ = query(collection(db, 'attempts'), orderBy('startedAt', 'desc'), limit(100));
      const attemptsSnap = await getDocs(attemptsQ);

      const rows: MonitorRow[] = [];

      sessionsSnap.forEach((d) => {
        const item = d.data();
        if (item.completed) return; // Ignore completed basic sessions, we show attempts for completion
        const updatedDate = item.updated_at?.toDate ? item.updated_at.toDate() : new Date();
        const status = isRecent(updatedDate, 15) ? 'In Progress' : 'Interrupted';
        rows.push({
          id: d.id,
          studentName: item.student_name || item.user_id?.substring(0, 8) || 'Unknown User',
          testName: item.test_id || 'Unknown Test',
          testId: item.test_id,
          status,
          currentSection: item.section || 'Part 1',
          lastSavedDate: updatedDate,
          answers: item.answers || {},
          docType: 'session',
          rawRecord: item
        });
      });

      attemptsSnap.forEach((d) => {
        const item = d.data();
        const updatedDate = item.submittedAt ? new Date(item.submittedAt) : (item.startedAt ? new Date(item.startedAt) : new Date());
        rows.push({
          id: d.id,
          studentName: item.userDisplayName || item.userId?.substring(0,8) || 'Unknown',
          testName: item.testTitle || item.testId || 'Unknown Test',
          testId: item.testId,
          status: 'Completed',
          currentSection: item.section || 'test',
          lastSavedDate: updatedDate,
          answers: item.questionResults || item.writingResults || [],
          score: item.estimatedBand || item.normalizedScore || 0,
          docType: 'attempt',
          rawRecord: item
        });
      });

      // Sort combined by date DESC
      rows.sort((a, b) => b.lastSavedDate.getTime() - a.lastSavedDate.getTime());
      setData(rows);
    } catch (err) {
      console.error("Failed to fetch monitor data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRecover = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await updateDoc(doc(db, 'test_sessions', id), {
        recoverable: true
      });
      alert('Session marked as recoverable. The student will be prompted to restore this session.');
    } catch (err) {
      alert('Failed to update session recovery status.');
    }
  };

  const filteredData = data.filter(r => {
    if (statusFilter !== 'All' && r.status !== statusFilter) return false;
    if (searchName && !r.studentName.toLowerCase().includes(searchName.toLowerCase())) return false;
    if (searchTest && !r.testName.toLowerCase().includes(searchTest.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="p-8 pb-32 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
          <Activity className="w-8 h-8 text-primary-500" />
          Student Test Monitor
        </h1>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-2">
            <p className="text-slate-500 font-medium">
                Monitor all ongoing student tests, intervene in lost sessions, and track real-time progress.
            </p>
            <Link href="/admin/sessions/create" className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-black px-6 py-3 rounded-xl transition-all shadow-lg active:scale-95">
                <Plus className="w-5 h-5" /> Create New Session
            </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search student name..."
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div className="relative flex-1 min-w-[200px]">
          <Filter className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search test name..."
            value={searchTest}
            onChange={(e) => setSearchTest(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div className="shrink-0 flex items-center gap-2">
          <span className="text-sm font-bold text-slate-500 uppercase tracking-widest pl-2">Status:</span>
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="border border-slate-200 rounded-xl py-2 px-4 bg-slate-50 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="All">All Statuses</option>
            <option value="In Progress">In Progress</option>
            <option value="Interrupted">Interrupted</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 font-bold text-slate-500 text-[11px] uppercase tracking-widest border-b border-slate-200">
                <th className="p-5 pl-6">Student Name</th>
                <th className="p-5">Test Name</th>
                <th className="p-5">Status</th>
                <th className="p-5">Current Section</th>
                <th className="p-5">Last Saved</th>
                <th className="p-5 pr-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center p-12 text-slate-400 font-semibold italic">
                    <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin text-primary-500" />
                    Fetching Live Telemetry Data...
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center p-12 text-slate-400 font-semibold italic">
                    No sessions match the current filters.
                  </td>
                </tr>
              ) : (
                filteredData.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="p-5 pl-6 font-bold text-slate-800">{row.studentName}</td>
                    <td className="p-5 font-semibold text-slate-600 truncate max-w-[200px]">{row.testName}</td>
                    <td className="p-5">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${
                        row.status === 'Completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                        row.status === 'In Progress' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                        'bg-rose-50 text-rose-600 border-rose-200'
                      }`}>
                        {row.status === 'Completed' && <CheckCircle2 className="w-3.5 h-3.5" />}
                        {row.status === 'In Progress' && <Activity className="w-3.5 h-3.5" />}
                        {row.status === 'Interrupted' && <AlertTriangle className="w-3.5 h-3.5" />}
                        {row.status}
                      </span>
                    </td>
                    <td className="p-5 text-slate-500 font-medium capitalize">{row.currentSection || '—'}</td>
                    <td className="p-5">
                      <div className="flex items-center gap-2 text-slate-500 font-medium text-xs">
                        <Clock className="w-3.5 h-3.5" />
                        {timeAgo(row.lastSavedDate)}
                      </div>
                    </td>
                    <td className="p-5 pr-6 text-right space-x-2">
                      {row.status === 'Completed' ? (
                        <Link href={`/results/${row.id}`} className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-lg shadow-sm transition-transform active:scale-95">
                          View Result
                        </Link>
                      ) : (
                        <>
                          {(row.status === 'Interrupted' && row.docType === 'session') && (
                            <button onClick={(e) => handleRecover(row.id, e)} className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-800 text-xs font-bold rounded-lg transition-transform active:scale-95 border border-amber-300">
                              <RotateCcw className="w-3.5 h-3.5" /> Recover
                            </button>
                          )}
                          <button onClick={() => setViewSession(row)} className="inline-flex items-center gap-2 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-lg border border-slate-300 shadow-sm transition-transform active:scale-95">
                            <Eye className="w-3.5 h-3.5" /> View
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Session Details Modal */}
      {viewSession && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setViewSession(null)} />
          <div className="relative w-full max-w-3xl max-h-[90vh] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-8 py-6 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-xl font-black text-slate-800">Session Details</h3>
                <p className="text-slate-500 text-sm font-medium mt-1">Inspecting active snapshot</p>
              </div>
              <button 
                onClick={() => setViewSession(null)}
                className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 text-slate-500 rounded-full hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-8 overflow-y-auto custom-scrollbar flex-1 bg-white">
              <div className="grid sm:grid-cols-2 gap-6 mb-8">
                <div className="p-5 bg-slate-50 border border-slate-100 rounded-2xl">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Student Context</span>
                  <div className="mt-3 font-semibold text-slate-700 text-sm">
            <p className="mb-2"><span className="text-slate-400 mr-2">Organization:</span> <span className="text-primary-600 font-bold">{viewSession.rawRecord.organization || 'Bondify'}</span></p>
                    <p className="mb-2"><span className="text-slate-400 mr-2">Name:</span> <span className="text-slate-900 font-bold">{viewSession.studentName}</span></p>
                    <p><span className="text-slate-400 mr-2">Email:</span> {viewSession.rawRecord.student_email || 'Not Provided'}</p>
                  </div>
                </div>

                <div className="p-5 bg-slate-50 border border-slate-100 rounded-2xl">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Test Diagnostics</span>
                  <div className="mt-3 font-semibold text-slate-700 text-sm">
                    <p className="mb-2"><span className="text-slate-400 mr-2">Test Name:</span> <span className="text-slate-900 font-bold">{viewSession.testName}</span></p>
                    <p className="mb-2"><span className="text-slate-400 mr-2">Section:</span> <span className="capitalize text-slate-900">{viewSession.currentSection}</span></p>
                    <p><span className="text-slate-400 mr-2">Last Question:</span> Q{viewSession.rawRecord.last_question !== undefined ? viewSession.rawRecord.last_question : '—'}</p>
                  </div>
                </div>
              </div>

              {/* Answers Dump */}
              <h4 className="text-sm font-black uppercase text-slate-400 tracking-widest mb-4">Saved Answers Context</h4>
              
              {viewSession.answers && typeof viewSession.answers === 'object' && Object.keys(viewSession.answers).length > 0 ? (
                <div className="bg-[#f8f9fa] border border-slate-200 rounded-2xl p-6">
                  {Object.entries(viewSession.answers).map(([qKey, answer]: [string, any], idx) => (
                    <div key={idx} className="flex gap-4 mb-3 pb-3 border-b border-slate-200/60 last:mb-0 last:pb-0 last:border-0">
                      <span className="shrink-0 w-10 text-xs font-black text-slate-400 uppercase tracking-widest pt-0.5">{qKey}</span>
                      <span className="font-semibold text-slate-800 text-sm break-all">
                        {typeof answer === 'string' ? answer : JSON.stringify(answer)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-slate-50 p-6 rounded-2xl border border-dashed border-slate-200 text-center text-slate-400 font-semibold italic text-sm">
                  No partial answers recorded yet.
                </div>
              )}
            </div>
            
            {/* Footer */}
            {viewSession.status === 'Interrupted' && (
              <div className="p-5 border-t border-slate-200 bg-slate-50 shrink-0 flex justify-end">
                 <button onClick={(e) => { handleRecover(viewSession.id, e); setViewSession(null); }} className="px-6 py-2.5 bg-slate-900 hover:bg-black text-white text-sm font-bold rounded-xl shadow-lg transition-transform active:scale-95 flex items-center gap-2">
                    <RotateCcw className="w-4 h-4" /> Trigger Session Recovery Mode
                  </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
