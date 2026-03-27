"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase/config";
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  doc, 
  updateDoc, 
  increment, 
  runTransaction,
  serverTimestamp,
  addDoc
} from "firebase/firestore";
import { useAuth } from "@/lib/contexts/AuthContext";
import { Check, X, Clock, ExternalLink, User, Package, DollarSign, Zap } from "lucide-react";

interface Payment {
  id: string;
  userId: string;
  userEmail: string;
  username: string;
  packName: string;
  price: number;
  tokensAmount: number;
  screenshotUrl: string;
  status: "pending" | "approved" | "rejected";
  createdAt: any;
}

export default function AdminPaymentsPage() {
  const { profile } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.role !== 'admin') return;

    const q = query(collection(db, "manual_payments"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const p = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Payment));
      setPayments(p);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [profile]);

  const handleApprove = async (payment: Payment) => {
    if (payment.status !== 'pending') return;

    const confirm = window.confirm(`Approve ${payment.packName} for ${payment.username}?`);
    if (!confirm) return;

    try {
      await runTransaction(db, async (transaction) => {
        // 1. Get user Ref
        const userRef = doc(db, "users", payment.userId);
        const paymentRef = doc(db, "manual_payments", payment.id);

        // 2. Update status
        transaction.update(paymentRef, { status: 'approved' });

        // 3. Update Balance & Tier (if applicable)
        const isTokens = payment.packName.toLowerCase().includes('tokens');
        if (isTokens) {
           transaction.update(userRef, { 
             tokenBalance: increment(payment.tokensAmount) 
           });
        } else {
           // Handle subscription tiers
           const tier = payment.packName.split(' ')[0].toLowerCase(); // e.g. "Go"
           transaction.update(userRef, { 
             accountTier: tier,
             // Grant some tokens if subscription gives tokens? 
             // Go says 15 / day, let's just update tier for now.
           });
        }

        // 4. Log
        const logRef = doc(collection(db, "token_logs"));
        transaction.set(logRef, {
          userId: payment.userId,
          changeAmount: payment.tokensAmount,
          reason: `Purchase: ${payment.packName}`,
          createdAt: serverTimestamp(),
        });
      });

      alert("Payment approved successfully!");
    } catch (err) {
      console.error("Approval failed:", err);
      alert("Error approving payment.");
    }
  };

  const handleReject = async (paymentId: string) => {
    const confirm = window.confirm("Are you sure you want to reject this payment?");
    if (!confirm) return;

    try {
      await updateDoc(doc(db, "manual_payments", paymentId), {
        status: 'rejected'
      });
      alert("Payment rejected.");
    } catch (err) {
      console.error("Rejection failed:", err);
    }
  };

  if (profile?.role !== 'admin') {
    return <div className="p-10 text-center font-bold">Access Denied</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Payment Requests</h1>
          <p className="text-slate-500 font-medium">Manage manual bank transfer verifications</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 flex items-center gap-4 text-sm font-bold shadow-sm">
          <div className="flex items-center gap-1.5 text-amber-600">
            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            {payments.filter(p => p.status === 'pending').length} Pending
          </div>
          <div className="w-px h-4 bg-slate-200" />
          <div className="text-slate-400">
            Total {payments.length}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="p-20 text-center font-bold text-slate-400 animate-pulse">Loading payments...</div>
      ) : (
        <div className="grid gap-6">
          {payments.length === 0 ? (
            <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] p-20 text-center">
              <Clock className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-400 font-bold">No payment requests found.</p>
            </div>
          ) : (
            payments.map((payment) => (
              <div 
                key={payment.id} 
                className={`bg-white rounded-[2rem] p-8 border-2 transition-all shadow-sm flex flex-col lg:flex-row gap-8 items-start lg:items-center ${
                  payment.status === 'pending' ? 'border-amber-200 shadow-amber-500/5' : 
                  payment.status === 'approved' ? 'border-emerald-100 opacity-80' : 'border-rose-100 opacity-60'
                }`}
              >
                {/* User Info */}
                <div className="flex-1 space-y-3 min-w-[200px]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center border border-slate-200">
                      <User className="w-5 h-5 text-slate-400" />
                    </div>
                    <div>
                      <p className="font-black text-slate-900">{payment.username}</p>
                      <p className="text-xs text-slate-400 font-bold truncate max-w-[150px]">{payment.userEmail}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="bg-slate-100 text-slate-600 text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider flex items-center gap-1">
                      ID: <span className="text-slate-400">{payment.userId.slice(0, 8)}...</span>
                    </span>
                  </div>
                </div>

                {/* Package Info */}
                <div className="flex-1 space-y-4 min-w-[200px]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center border border-primary-100">
                      <Package className="w-5 h-5 text-primary-500" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Package</p>
                      <p className="font-bold text-slate-900 truncate">{payment.packName}</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex items-center gap-1.5 text-slate-700 font-black">
                      <DollarSign className="w-4 h-4 text-emerald-500" />
                      {payment.price}
                    </div>
                    {payment.tokensAmount > 0 && (
                      <div className="flex items-center gap-1.5 text-primary-600 font-black border-l border-slate-100 pl-4">
                        <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
                        {payment.tokensAmount}
                      </div>
                    )}
                  </div>
                </div>

                {/* Screenshot */}
                <div className="flex-shrink-0 relative group">
                  <a href={payment.screenshotUrl} target="_blank" className="block relative h-28 w-40 rounded-2xl overflow-hidden border-2 border-slate-100 shadow-sm group-hover:border-primary-400 transition-colors">
                    <img src={payment.screenshotUrl} alt="Proof" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <ExternalLink className="w-6 h-6 text-white" />
                    </div>
                  </a>
                  <p className="text-[10px] font-black text-slate-400 mt-2 uppercase text-center tracking-widest">Screenshot Proof</p>
                </div>

                {/* Status & Actions */}
                <div className="flex flex-col gap-3 min-w-[160px] ml-auto">
                   {payment.status === 'pending' ? (
                     <>
                        <button 
                          onClick={() => handleApprove(payment)}
                          className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2"
                        >
                          <Check className="w-4 h-4" /> Approve
                        </button>
                        <button 
                          onClick={() => handleReject(payment.id)}
                          className="w-full py-3 bg-white hover:bg-rose-50 text-rose-600 border border-rose-100 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                        >
                          <X className="w-4 h-4" /> Reject
                        </button>
                     </>
                   ) : (
                     <div className={`px-4 py-3 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 border ${
                        payment.status === 'approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'
                     }`}>
                        {payment.status === 'approved' ? <><Check className="w-4 h-4" /> Approved</> : <><X className="w-4 h-4" /> Rejected</>}
                     </div>
                   )}
                   <p className="text-[10px] font-black text-slate-400 text-center tracking-widest mt-1">
                      {payment.createdAt?.toDate().toLocaleString() || 'Just now'}
                   </p>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
