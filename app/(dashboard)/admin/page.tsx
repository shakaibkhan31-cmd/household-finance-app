'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { ShieldCheck, CheckCircle2, Clock, User, ArrowLeft, Lock } from 'lucide-react';

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

// Apna admin email yahan define karein
const ADMIN_EMAIL = 'shakaibkhan93@gmail.com';

export default function AdminDashboard() {
  const [requests, setRequests] = useState<PaymentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();

  useEffect(() => {
    checkAdminAndFetch();
  }, []);

  const checkAdminAndFetch = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session || !session.user) {
        // Agar logged in nahi hai toh dashboard/login par bhej dein
        router.push('/');
        return;
      }

      const userEmail = session.user.email;

      // Security Check: Agar user admin nahi hai toh access block karke redirect kar dein
      if (userEmail !== ADMIN_EMAIL) {
        alert('Access Denied: You are not authorized to view the admin panel.');
        router.push('/');
        return;
      }

      setAuthorized(true);
      await fetchPaymentRequests();
    } catch (err) {
      console.error(err);
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentRequests = async () => {
    try {
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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center text-xs text-slate-500">
        Verifying admin privileges...
      </div>
    );
  }

  if (!authorized) return null;

  return (
    <main className="min-h-screen bg-slate-100 dark:bg-slate-950 p-4 md:p-8 text-slate-800 dark:text-slate-100 transition-colors">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Top Header */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-semibold">
              <ShieldCheck className="w-4 h-4" /> SECURE ADMIN PANEL
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Subscription & Payment Verification
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Review local payment submissions along with user emails and activate Pro memberships.
            </p>
          </div>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl transition flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </button>
        </div>

        {message && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-medium flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {/* Requests Table Container */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Submitted Payment Requests ({requests.length})
            </h3>
            <button
              onClick={fetchPaymentRequests}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold cursor-pointer"
            >
              Refresh List
            </button>
          </div>

          {requests.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <Clock className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-xs text-slate-500">Koi pending payment request mojood nahi hai.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-950/50 text-slate-500 dark:text-slate-400 uppercase font-semibold text-[10px]">
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
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {requests.map((req) => (
                    <tr key={req.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition">
                      <td className="p-4 font-medium text-slate-900 dark:text-white flex items-center gap-2">
                        <User className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                        <span className="truncate max-w-[220px]">
                          {req.profiles?.email || 'Unknown User'}
                        </span>
                      </td>
                      <td className="p-4 font-bold text-slate-700 dark:text-slate-300 uppercase">
                        {req.method}
                      </td>
                      <td className="p-4 font-mono text-indigo-600 dark:text-indigo-300 font-semibold">{req.trx_id}</td>
                      <td className="p-4 font-semibold text-emerald-600 dark:text-emerald-400">PKR {req.amount}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          req.status === 'Approved' 
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                        }`}>
                          {req.status}
                        </span>
                      </td>
                      <td className="p-4 text-slate-500 dark:text-slate-400">{new Date(req.created_at).toLocaleString()}</td>
                      <td className="p-4 text-right">
                        {req.status !== 'Approved' ? (
                          <button
                            onClick={() => handleApprove(req.id, req.user_id)}
                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg transition shadow-md shadow-emerald-600/20 cursor-pointer text-[11px]"
                          >
                            Approve & Upgrade
                          </button>
                        ) : (
                          <span className="text-slate-400 font-semibold">Approved</span>
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
    </main>
  );
}