'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Wallet, Plus, Building2, CreditCard, DollarSign } from 'lucide-react';

export interface Account {
  id: string;
  name: string;
  type: 'Bank' | 'Wallet' | 'Cash';
  account_number?: string;
  current_balance: number;
  created_at?: string;
}

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Form State
  const [name, setName] = useState('');
  const [type, setType] = useState<'Bank' | 'Wallet' | 'Cash'>('Bank');
  const [accountNumber, setAccountNumber] = useState('');
  const [balance, setBalance] = useState('');

  // Fetch Accounts
  const fetchAccounts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching accounts:', error.message);
    } else {
      setAccounts(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  // Add New Account
  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !balance) return;

    const parsedBalance = parseFloat(balance);

    const { error } = await supabase.from('accounts').insert([
      {
        name,
        type,
        account_number: accountNumber || null,
        current_balance: parsedBalance,
      },
    ]);

    if (error) {
      alert('Error adding account: ' + error.message);
    } else {
      setName('');
      setAccountNumber('');
      setBalance('');
      fetchAccounts();
    }
  };

  // Total Portfolio Balance
  const totalBalance = accounts.reduce((sum, acc) => sum + Number(acc.current_balance), 0);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Accounts & Wallets</h1>
          <p className="text-sm text-slate-500 mt-1">Manage bank accounts, digital wallets, and physical cash reserves</p>
        </div>
        <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl text-right">
          <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">Total Net Liquid Worth</p>
          <p className="text-2xl font-bold text-indigo-900 mt-0.5">PKR {totalBalance.toLocaleString()}</p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Form: Add Account */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-fit space-y-4">
          <h2 className="text-base font-semibold text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
            <Plus className="w-5 h-5 text-indigo-600" />
            Add New Account
          </h2>

          <form onSubmit={handleAddAccount} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Account Title / Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Meezan Bank / NayaPay / Cash Wallet"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="Bank">Bank Account</option>
                <option value="Wallet">Digital Wallet (Sadapay / Nayapay / Easypaisa)</option>
                <option value="Cash">Physical Cash</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Account Number / IBAN (Optional)</label>
              <input
                type="text"
                placeholder="e.g. PK00MEZN0001234..."
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Initial / Current Balance (PKR)</label>
              <input
                type="number"
                required
                placeholder="0.00"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-xl text-sm transition shadow-sm mt-2"
            >
              Add Account
            </button>
          </form>
        </div>

        {/* List: Accounts Cards */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 h-fit">
          {loading ? (
            <div className="col-span-2 text-center py-12 text-slate-400 bg-white rounded-2xl border border-slate-200">
              Loading account portfolio...
            </div>
          ) : accounts.length === 0 ? (
            <div className="col-span-2 text-center py-12 text-slate-400 bg-white rounded-2xl border border-slate-200">
              No accounts registered yet. Add your first bank or wallet account on the left.
            </div>
          ) : (
            accounts.map((acc) => (
              <div key={acc.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2.5 bg-slate-100 text-slate-700 rounded-xl">
                      {acc.type === 'Bank' ? <Building2 className="w-5 h-5 text-blue-600" /> :
                       acc.type === 'Wallet' ? <CreditCard className="w-5 h-5 text-purple-600" /> :
                       <DollarSign className="w-5 h-5 text-emerald-600" />}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800 text-sm">{acc.name}</h3>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">{acc.type}</p>
                    </div>
                  </div>
                </div>

                {acc.account_number && (
                  <p className="text-xs text-slate-500 font-mono bg-slate-50 px-2.5 py-1 rounded-lg w-fit">
                    {acc.account_number}
                  </p>
                )}

                <div className="border-t border-slate-100 pt-3">
                  <p className="text-[11px] text-slate-400">Available Balance</p>
                  <p className="text-lg font-bold text-slate-900 mt-0.5">
                    PKR {Number(acc.current_balance).toLocaleString()}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}