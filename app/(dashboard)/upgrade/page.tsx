'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Sparkles, ArrowRight, ShieldCheck, CheckCircle2, X, CreditCard, Building2 } from 'lucide-react';

export default function UpgradePage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMethod] = useState<'bank'>('bank');
  const [trxId, setTrxId] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const router = useRouter();

  const handlePaymentSubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trxId.trim()) {
      setErrorMessage('Baraye meharbani Transaction ID (TRX ID) darj karein.');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      // Save payment request with PKR 10,000 amount
      const { error } = await supabase.from('payment_requests').insert([
        {
          user_id: user.id,
          method: selectedMethod,
          trx_id: trxId.trim(),
          amount: 10000,
          status: 'Pending Verification'
        }
      ]);

      if (error) {
        console.warn('Table insert warning:', error.message);
      }

      setSuccessMessage('Payment request submit ho gayi hai! Admin verification ke baad aapka account Pro kar diya jayega.');
      setTimeout(() => {
        setIsModalOpen(false);
        router.push('/');
      }, 3000);

    } catch (err: any) {
      setErrorMessage(err.message || 'Kuch masla ho gaya hai. Dobara koshish karein.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-12 flex flex-col justify-center items-center relative">
      
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-4xl w-full space-y-8 z-10">
        
        {/* Header Section */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
            <Sparkles className="w-4 h-4" /> PREMIUM ACCESS
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white">
            Unlock Unlimited Financial Control
          </h1>
          <p className="text-sm text-slate-400 max-w-xl mx-auto">
            Aapka 34-days free trial khatam ho chuka hai. Apne Household Finance Control Centre ko uninterrupted use karne ke liye plan upgrade karein.
          </p>
        </div>

        {/* Pricing & Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
          
          {/* Features Box */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-6">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">What's included in Pro:</h3>
            <div className="space-y-3.5 text-xs text-slate-300">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Unlimited Bank Accounts & Wallets Tracking</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Advanced Multi-Currency & CSV Expense Export</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Automated Budget Threshold Alerts & Bill Reminders</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Debts, Kameti & Receivables Full Management</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Priority Support & Secure Encrypted Database</span>
              </div>
            </div>
            <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-500 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-400" /> 100% Secure & Private Data Policy
            </div>
          </div>

          {/* Pricing Box */}
          <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-900 border border-indigo-500/30 rounded-2xl p-6 flex flex-col justify-between shadow-xl">
            <div className="space-y-4">
              <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-widest">Annual Membership</span>
              <div>
                <h2 className="text-4xl font-black text-white">PKR 10,000 <span className="text-xs font-normal text-slate-400">/ year</span></h2>
                <p className="text-[11px] text-slate-400 mt-1">Billed annually. Cancel anytime.</p>
              </div>
            </div>

            <div className="pt-6 space-y-3">
              <button
                onClick={() => setIsModalOpen(true)}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-xl text-xs transition shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Proceed to Payment</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <p className="text-[10px] text-center text-slate-500">
                Payment ke baad aapka account manual verification ke zariye upgrade kiya jayega.
              </p>
            </div>
          </div>

        </div>

      </div>

      {/* Local Payment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-6 shadow-2xl relative">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-400" /> Bank Transfer (Meezan Bank)
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {successMessage ? (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium space-y-2 text-center">
                <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-400" />
                <p>{successMessage}</p>
              </div>
            ) : (
              <form onSubmit={handlePaymentSubmission} className="space-y-4">
                
                {errorMessage && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                    {errorMessage}
                  </div>
                )}

                {/* Account Details Box */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs text-slate-300 font-mono">
                  <p className="text-indigo-400 font-bold font-sans">Bank Transfer Details:</p>
                  <p>Account Name: <strong>COMPILE</strong></p>
                  <p>IBAN: <strong>PK38MEZN0001120105337601</strong></p>
                  <p>Account #: <strong>01120105337601</strong></p>
                  <p className="text-amber-400 font-sans text-[11px] pt-2 border-t border-slate-800/80">
                    Amount to send: <strong>PKR 10,000</strong>
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Transaction ID (TRX ID) / Receipt Number
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Misal taur par: 9876543210"
                    value={trxId}
                    onChange={(e) => setTrxId(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 outline-none focus:border-indigo-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-2"
                >
                  {loading ? 'Verifying...' : 'Submit Payment Proof'}
                </button>

              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
}