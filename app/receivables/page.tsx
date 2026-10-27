'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, CheckCircle, Clock, Calendar, DollarSign, Trash2, ArrowDownLeft, TrendingUp } from 'lucide-react';

export interface Receivable {
  id: string;
  title: string;
  source_person?: string;
  category: string;
  amount: number;
  expected_date: string;
  status: string; // 'Pending' or 'Received'
  notes?: string;
  created_at?: string;
}

export default function ReceivablesPage() {
  const [receivables, setReceivables] = useState<Receivable[]>([]);
  const [accounts, setAccounts] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [todayStr, setTodayStr] = useState<string>('');

  // Form State
  const [title, setTitle] = useState('');
  const [sourcePerson, setSourcePerson] = useState('');
  const [category, setCategory] = useState('Salary / Business Income');
  const [amount, setAmount] = useState('');
  const [expectedDate, setExpectedDate] = useState('');
  const [notes, setNotes] = useState('');

  // Receive Modal State
  const [receivingItem, setReceivingItem] = useState<Receivable | null>(null);
  const [selectedAccount, setSelectedAccount] = useState('');

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setTodayStr(today);
    fetchReceivablesAndAccounts();
  }, []);

  const fetchReceivablesAndAccounts = async () => {
    setLoading(true);

    // Fetch Accounts
    const { data: accData } = await supabase.from('accounts').select('name');
    if (accData && accData.length > 0) {
      const names = accData.map((a: { name: string }) => a.name);
      setAccounts(names);
      setSelectedAccount(names[0]);
    }

    // Fetch Receivables
    const { data, error } = await supabase
      .from('receivables')
      .select('*')
      .order('expected_date', { ascending: true });

    if (error) {
      console.error('Error fetching receivables:', error.message);
    } else {
      setReceivables(data || []);
    }
    setLoading(false);
  };

  // Add New Receivable / Income Entry
  const handleAddReceivable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !amount || !expectedDate) {
      alert('Please fill required fields.');
      return;
    }

    const { error } = await supabase.from('receivables').insert([
      {
        title,
        source_person: sourcePerson,
        category,
        amount: parseFloat(amount),
        expected_date: expectedDate,
        status: 'Pending',
        notes,
      },
    ]);

    if (error) {
      alert('Error adding receivable entry: ' + error.message);
    } else {
      setTitle('');
      setSourcePerson('');
      setAmount('');
      setNotes('');
      fetchReceivablesAndAccounts();
    }
  };

  // Open Receive Modal
  const handleOpenReceiveModal = (item: Receivable) => {
    setReceivingItem(item);
  };

  // Confirm Mark Received & Deposit into Selected Account
  const handleConfirmReceived = async () => {
    if (!receivingItem || !selectedAccount) return;

    const receiveAmount = Number(receivingItem.amount);

    // 1. Record Income Transaction in Transactions Ledger
    const { error: txErr } = await supabase.from('transactions').insert([
      {
        date: todayStr,
        type: 'Income Receipt',
        account_name: selectedAccount,
        category: receivingItem.category || 'Salary / Business Income',
        amount: receiveAmount,
        party_name: receivingItem.source_person || receivingItem.title,
        description: `Income Received: ${receivingItem.title}`,
        entered_by: 'Husband',
      },
    ]);

    if (txErr) {
      alert('Error recording transaction: ' + txErr.message);
      return;
    }

    // 2. Add Amount to Selected Account Balance
    const { data: accList } = await supabase.from('accounts').select('*').eq('name', selectedAccount).limit(1);
    if (accList && accList.length > 0) {
      const acc = accList[0];
      const newBal = Number(acc.current_balance || 0) + receiveAmount;
      await supabase.from('accounts').update({ current_balance: newBal }).eq('id', acc.id);
    }

    // 3. Update Receivable Status to 'Received'
    const { error: recErr } = await supabase
      .from('receivables')
      .update({ status: 'Received' })
      .eq('id', receivingItem.id);

    if (recErr) {
      alert('Error updating receivable status: ' + recErr.message);
      return;
    }

    setReceivingItem(null);
    alert('Income received successfully! Account balance and transactions ledger updated.');
    fetchReceivablesAndAccounts();
  };

  // Delete Receivable Entry
  const handleDeleteReceivable = async (id: string) => {
    if (!confirm('Kya aap waqai is entry ko delete karna chahte hain?')) return;

    const { error } = await supabase.from('receivables').delete().eq('id', id);
    if (error) {
      alert('Error deleting receivable: ' + error.message);
    } else {
      fetchReceivablesAndAccounts();
    }
  };

  const pendingTotal = receivables
    .filter((r) => r.status === 'Pending')
    .reduce((sum, r) => sum + Number(r.amount), 0);

  const receivedTotal = receivables
    .filter((r) => r.status === 'Received')
    .reduce((sum, r) => sum + Number(r.amount), 0);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 bg-slate-50 dark:bg-slate-950 min-h-screen transition-colors">
      {/* Header & Metrics */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Income & Receivables</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Track expected salaries, incoming client payments, and pending receivables</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900/50 p-4 rounded-2xl flex-1 md:w-44">
            <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider">Pending Income</p>
            <p className="text-xl font-bold text-amber-950 dark:text-amber-200 mt-0.5">PKR {pendingTotal.toLocaleString()}</p>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/50 p-4 rounded-2xl flex-1 md:w-44">
            <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Received Income</p>
            <p className="text-xl font-bold text-emerald-950 dark:text-emerald-200 mt-0.5">PKR {receivedTotal.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Form */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 h-fit space-y-4">
          <h2 className="text-base font-semibold text-slate-800 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Plus className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Add Expected Income
          </h2>

          <form onSubmit={handleAddReceivable} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Title / Source Description</label>
              <input
                type="text"
                required
                placeholder="e.g. October Salary / Project Milestone 1"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Payer / Person Name (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Company Name / Client Name"
                value={sourcePerson}
                onChange={(e) => setSourcePerson(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Amount (PKR)</label>
                <input
                  type="number"
                  required
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-emerald-700 dark:text-emerald-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Expected Date</label>
                <input
                  type="date"
                  required
                  value={expectedDate}
                  onChange={(e) => setExpectedDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
              >
                <option value="Salary / Business Income">Salary / Business Income</option>
                <option value="Freelance / Contract">Freelance / Contract</option>
                <option value="Support / Gift">Support / Gift</option>
                <option value="Refund">Refund</option>
                <option value="Other / Misc">Other / Misc</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Notes / Remarks</label>
              <input
                type="text"
                placeholder="e.g. Expected by 1st of month"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 rounded-xl text-xs transition shadow-sm"
            >
              Add Receivable Entry
            </button>
          </form>
        </div>

        {/* Right Column: Receivables List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-4">
            <h2 className="text-base font-semibold text-slate-800 dark:text-white">Pending & Received Incomes</h2>

            {loading ? (
              <p className="text-xs text-slate-400 py-4 text-center">Loading receivables...</p>
            ) : receivables.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No income or receivable records found.</p>
            ) : (
              <div className="space-y-3">
                {receivables.map((r) => {
                  const isReceived = r.status === 'Received';
                  return (
                    <div
                      key={r.id}
                      className={`p-4 rounded-xl border flex items-center justify-between transition ${
                        isReceived ? 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800' : 'bg-white dark:bg-slate-900 border-emerald-200 dark:border-emerald-900/50 shadow-xs'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800 dark:text-white text-sm">{r.title}</span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                              isReceived ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300' : 'bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300'
                            }`}
                          >
                            {r.status}
                          </span>
                        </div>

                        <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                          {r.source_person && <span>From: {r.source_person}</span>}
                          <span className="flex items-center gap-1 font-mono">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" /> Expected: {r.expected_date}
                          </span>
                          {r.notes && <span>{r.notes}</span>}
                        </div>
                      </div>

                      <div className="text-right space-y-2">
                        <p className="text-base font-bold text-emerald-700 dark:text-emerald-400">
                          PKR {Number(r.amount).toLocaleString()}
                        </p>

                        <div className="flex items-center justify-end gap-2">
                          {!isReceived && (
                            <button
                              onClick={() => handleOpenReceiveModal(r)}
                              className="text-[11px] text-white bg-emerald-600 hover:bg-emerald-700 font-medium px-3 py-1 rounded-lg transition flex items-center gap-1 shadow-xs"
                            >
                              <ArrowDownLeft className="w-3.5 h-3.5" /> Mark Received
                            </button>
                          )}

                          <button
                            onClick={() => handleDeleteReceivable(r.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition"
                            title="Delete Entry"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Receive Modal */}
      {receivingItem && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-md w-full p-6 space-y-5">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Deposit Received Income</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Receiving <strong>{receivingItem.title}</strong>
              </p>
              <div className="mt-2 p-2.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-100 dark:border-emerald-900/50 text-xs flex justify-between items-center">
                <span className="text-emerald-800 dark:text-emerald-300 font-medium">Deposit Amount:</span>
                <span className="font-bold text-emerald-950 dark:text-emerald-200 text-sm">
                  PKR {Number(receivingItem.amount).toLocaleString()}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Deposit To Account</label>
              <select
                value={selectedAccount}
                onChange={(e) => setSelectedAccount(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
              >
                {accounts.map((acc) => (
                  <option key={acc} value={acc}>
                    {acc}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setReceivingItem(null)}
                className="flex-1 py-2.5 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReceived}
                className="flex-1 py-2.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition shadow-xs"
              >
                Confirm Deposit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}