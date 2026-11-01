'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { X } from 'lucide-react';

export default function TutorialModal({ userId, onFinish }: { userId: string; onFinish: () => void }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Step 1: Grocery Budget State
  const [groceryLimit, setGroceryLimit] = useState('25000');

  // Step 2: Cash Account State
  const [accountName, setAccountName] = useState('Cash Wallet');
  const [openingBalance, setOpeningBalance] = useState('10000');

  const handleNextStep = async () => {
    try {
      setLoading(true);

      if (currentStep === 1) {
        const limitVal = parseFloat(groceryLimit) || 25000;
        
        // Using the exact column name 'monthly_limit' found in Supabase schema
        const { error: bErr } = await supabase.from('budgets').insert([
          {
            category: 'Groceries & Food',
            monthly_limit: limitVal,
            user_id: userId,
          },
        ]);

        if (bErr) {
          console.error("Budget insert error:", bErr.message);
          alert('Budget Error: ' + bErr.message);
          setLoading(false);
          return;
        }

        setCurrentStep(2);
      } else if (currentStep === 2) {
        const balVal = parseFloat(openingBalance) || 10000;
        const { error: accErr } = await supabase.from('accounts').insert([
          {
            name: accountName || 'Cash Wallet',
            current_balance: balVal,
            opening_balance: balVal,
            user_id: userId,
          },
        ]);

        if (accErr) {
          console.error("Account insert error:", accErr.message);
        }

        // Mark tutorial as seen in profiles table
        await supabase
          .from('profiles')
          .update({ has_seen_tutorial: true })
          .eq('id', userId);

        onFinish();
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full p-6 space-y-5">
        
        <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Setup Your Financial Hub</h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Step {currentStep} of 2</p>
          </div>
          <button 
            onClick={async () => {
              await supabase.from('profiles').update({ has_seen_tutorial: true }).eq('id', userId);
              onFinish();
            }} 
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs cursor-pointer"
          >
            Skip
          </button>
        </div>

        {currentStep === 1 && (
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Step 1</span>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Pehla Monthly Budget Banayein</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Groceries & Food category ke liye monthly limit set karein.</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Monthly Limit (PKR)</label>
              <input
                type="number"
                value={groceryLimit}
                onChange={(e) => setGroceryLimit(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 outline-none font-bold"
              />
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Step 2</span>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Apna Cash Account Banayein</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Apne paas mojood cash ya wallet ka account add karein.</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Account Name</label>
                <input
                  type="text"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Opening Balance</label>
                <input
                  type="number"
                  value={openingBalance}
                  onChange={(e) => setOpeningBalance(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 outline-none font-bold"
                />
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-between items-center pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
            disabled={currentStep === 1 || loading}
            className="text-xs font-medium text-slate-500 disabled:opacity-30 cursor-pointer"
          >
            Back
          </button>

          <button
            onClick={handleNextStep}
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-xs font-medium flex items-center gap-1.5 cursor-pointer shadow-xs transition disabled:opacity-50"
          >
            {loading ? 'Processing...' : currentStep === 2 ? 'Complete Setup' : 'Next Step'}
          </button>
        </div>

      </div>
    </div>
  );
}