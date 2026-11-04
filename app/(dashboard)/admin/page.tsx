'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { ShieldCheck, CheckCircle2, Clock, User, CreditCard, ArrowLeft } from 'lucide-react';

interface PaymentRequest {
  id: string;
  user_id: string;
  method: string;
  trx_id: string;
  amount: number;
  status: string;
  created_at: string;
  profiles?: {
    email?: string;
  } | null;
}

export default function AdminDashboard() {
  const [requests, setRequests] = useState<PaymentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetchPaymentRequests();
  }, []);

  const fetchPaymentRequests = async () => {
    setLoading(true);
    try {
      // Profiles table se email join kar ke fetch kar rahe hain
      const { data, error } = await supabase
        .from('payment_requests')
        .select(`
          *,
          profiles (
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching requests:', error.message);
      } else {
        setRequests(data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: string, userId: string) => {
    try {
      const { error: reqError } = await supabase
        .from('payment_requests')
        .update({ status: 'Approved' })
        .eq('id', requestId);

      if (reqError) {
        alert('Error updating payment request: ' + reqError.message);
        return;
      }

      const expiryDate = new Date();
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);

      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          subscription_status: 'pro',
          subscription_expires_at: expiryDate.toISOString()
        });

      if (profileError) {
        alert('Payment approved but failed to update user profile: ' + profileError.message);
      } else {
        setMessage('Payment successfully approved & user upgraded to Pro!');
        fetchPaymentRequests();
        setTimeout(() => setMessage(''), 4000);
      }
    } catch (err: any) {
      alert('Approval mein error aya hai: ' + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-12">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <div className="flex items-center justify-between border-b border-slate-800 pb-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-semibold">
              <ShieldCheck className="w-4 h-4" /> ADMIN PANEL
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
              Subscription & Payment Verification
            </h1>
            <p className="text-xs text-slate-400">
              Review local payment submissions along with user emails and activate Pro memberships.
            </p>
          </div>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl transition flex items-center gap-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </button>
        </div>

        {message && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Submitted Payment Requests ({requests.length})
            </h3>
            <button
              onClick={fetchPaymentRequests}
              className="text-xs text-indigo-400 hover:underline font-semibold cursor-pointer"
            >
              Refresh List
            </button>
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs text-slate-500">Loading requests...</div>
          ) : requests.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <Clock className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-xs text-slate-400">Koi pending payment request mojood nahi hai.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/50 text-slate-400 uppercase font-semibold text-[10px]">
                  <tr>
                    <th className="p-4">User Email</th>
                    <th className="p-4">Method</th>
                    <th className="p-4">Transaction ID (TRX)</th>
                    <th className="p-4">Amount</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Date</th>
                    <th className="p-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {requests.map((req) => (
                    <tr key={req.id} className="hover:bg-slate-800/30 transition">
                      <td className="p-4 font-medium text-white flex items-center gap-2">
                        <User className="w-4 h-4 text-indigo-400 shrink-0" />
                        <span className="truncate max-w-[220px]">
                          {req.profiles?.email || 'shakaibkhan93@gmail.com'}
                        </span>
                      </td>
                      <td className="p-4 font-bold text-slate-300 uppercase">
                        {req.method}
                      </td>
                      <td className="p-4 font-mono text-indigo-300 font-semibold">{req.trx_id}</td>
                      <td className="p-4 font-semibold text-emerald-400">PKR {req.amount}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          req.status === 'Approved' 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>
                          {req.status}
                        </span>
                      </td>
                      <td className="p-4 text-slate-400">{new Date(req.created_at).toLocaleString()}</td>
                      <td className="p-4 text-right">
                        {req.status !== 'Approved' ? (
                          <button
                            onClick={() => handleApprove(req.id, req.user_id)}
                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg transition shadow-md shadow-emerald-600/20 cursor-pointer text-[11px]"
                          >
                            Approve & Upgrade
                          </button>
                        ) : (
                          <span className="text-slate-500 font-semibold">Approved</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}