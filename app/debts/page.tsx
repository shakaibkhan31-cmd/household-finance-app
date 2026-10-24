'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, CheckCircle, ArrowDownLeft, ArrowUpRight, DollarSign, Calendar, AlertCircle } from 'lucide-react';

export interface Debt {
  id: string;
  person_name: string;
  type: string; // 'Personal Loan', 'Credit Card', etc.
  direction: string; // 'Given (Receivable)' or 'Taken (Payable)'
  amount: number;
  due_date: string;
  status: string; // 'Active' or 'Settled'
  notes?: string;
  created_at?: string;
}

export default function DebtsPage() {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [accounts, setAccounts] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Form State
  const [personName, setPersonName] = useState('');
  const [debtType, setDebtType] = useState('Personal Loan');
  const [direction, setDirection] = useState('Given (Receivable)');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');

  // Settlement Modal State
  const [settlingDebt, setSettlingDebt] = useState<Debt | null>(null);
  const [selectedAccount, setSelectedAccount] = useState('');
  const [settlementAmount, setSettlementAmount] = useState('');
  const [settlementDate, setSettlementDate] = useState('');

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setDueDate(today);
    setSettlementDate(today);
    fetchDebtsAndAccounts();
  }, []);

  const fetchDebtsAndAccounts = async () => {
    setLoading(true);

    // Fetch Accounts
    const { data: accData } = await supabase.from('accounts').select('name');
    if (accData && accData.length > 0) {
      const names = accData.map((a: { name: string }) => a.name);
      setAccounts(names);
      setSelectedAccount(names[0]);
    }

    // Fetch Debts
    const { data, error } = await supabase
      .from('debts')
      .select('*')
      .order('due_date', { ascending: true });

    if (error) {
      console.error('Error fetching debts:', error.message);
    } else {
      setDebts(data || []);
    }
    setLoading(false);
  };

  // Handle Debt Type Change with Auto-Direction Logic
  const handleDebtTypeChange = (newType: string) => {
    setDebtType(newType);

    if (newType === 'Credit Card') {
      setDirection('Taken (Payable)');
      if (!personName) setPersonName('Credit Card Outstanding');
    } else {
      if (personName === 'Credit Card Outstanding') {
        setPersonName('');
      }
      setDirection('Given (Receivable)');
    }
  };

  // Add New Debt
  const handleAddDebt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!personName || !amount || !dueDate) {
      alert('Please fill required fields.');
      return;
    }

    const { error } = await supabase.from('debts').insert([
      {
        person_name: personName,
        type: debtType,
        direction,
        amount: parseFloat(amount),
        due_date: dueDate,
        status: 'Active',
        notes,
      },
    ]);

    if (error) {
      alert('Error adding debt record: ' + error.message);
    } else {
      setPersonName('');
      setAmount('');
      setNotes('');
      fetchDebtsAndAccounts();
    }
  };

  // Open Settlement Modal
  const handleOpenSettlementModal = (debt: Debt) => {
    setSettlingDebt(debt);
    setSettlementAmount(debt.amount.toString());
  };

  // Process Settlement & Record Transaction
  const handleConfirmSettlement = async () => {
    if (!settlingDebt || !selectedAccount || !settlementAmount) {
      alert('Please select an account and enter settlement amount.');
      return;
    }

    const payAmount = parseFloat(settlementAmount);
    if (isNaN(payAmount) || payAmount <= 0) {
      alert('Please enter a valid amount.');
      return;
    }

    if (payAmount > settlingDebt.amount) {
      alert(`Settlement amount cannot exceed the active balance of PKR ${settlingDebt.amount.toLocaleString()}.`);
      return;
    }

    const isReceivable = settlingDebt.direction.includes('Given') || settlingDebt.direction.includes('Receivable');

    // 1. Record Loan Repayment Transaction in Transactions Table
    const { error: txErr } = await supabase.from('transactions').insert([
      {
        date: settlementDate,
        type: 'Loan Repayment',
        account_name: selectedAccount,
        category: 'Loan / Debt Related',
        amount: payAmount,
        party_name: settlingDebt.person_name,
        description: `Settlement for ${settlingDebt.type} (${settlingDebt.direction})`,
        entered_by: 'Husband',
      },
    ]);

    if (txErr) {
      alert('Error recording repayment transaction: ' + txErr.message);
      return;
    }

    // 2. Update Account Balance
    const { data: accList } = await supabase
      .from('accounts')
      .select('*')
      .eq('name', selectedAccount)
      .limit(1);

    if (accList && accList.length > 0) {
      const acc = accList[0];
      let currentBal = Number(acc.current_balance || 0);

      if (isReceivable) {
        currentBal += payAmount;
      } else {
        currentBal -= payAmount;
      }

      await supabase.from('accounts').update({ current_balance: currentBal }).eq('id', acc.id);
    }

    // 3. Update Debt Balance & Status
    const remainingDebt = Math.max(0, settlingDebt.amount - payAmount);
    const { error: debtErr } = await supabase
      .from('debts')
      .update({
        amount: remainingDebt,
        status: remainingDebt === 0 ? 'Settled' : 'Active',
      })
      .eq('id', settlingDebt.id);

    if (debtErr) {
      alert('Error updating debt record: ' + debtErr.message);
      return;
    }

    setSettlingDebt(null);
    alert('Settlement successfully recorded! Transaction ledger and account balance updated.');
    fetchDebtsAndAccounts();
  };

  // Calculations
  const totalReceivable = debts
    .filter((d) => d.status === 'Active' && (d.direction.includes('Given') || d.direction.includes('Receivable')))
    .reduce((sum, d) => sum + Number(d.amount), 0);

  const totalPayable = debts
    .filter((d) => d.status === 'Active' && (d.direction.includes('Taken') || d.direction.includes('Payable')))
    .reduce((sum, d) => sum + Number(d.amount), 0);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Debts & Kameti Management</h1>
        <p className="text-sm text-slate-500 mt-1">
          Track personal loans, lendings, borrowings, and rotating savings circles
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">
              Total Receivable (Logay)
            </p>
            <p className="text-2xl font-bold text-emerald-900 mt-1">
              PKR {totalReceivable.toLocaleString()}
            </p>
          </div>
          <ArrowDownLeft className="w-8 h-8 text-emerald-600 bg-emerald-100 p-1.5 rounded-xl" />
        </div>

        <div className="bg-rose-50 border border-rose-200 p-5 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-rose-800 uppercase tracking-wider">
              Total Payable (Denay)
            </p>
            <p className="text-2xl font-bold text-rose-900 mt-1">
              PKR {totalPayable.toLocaleString()}
            </p>
          </div>
          <ArrowUpRight className="w-8 h-8 text-rose-600 bg-rose-100 p-1.5 rounded-xl" />
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Add Loan Record Form */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-fit space-y-4">
          <h2 className="text-base font-semibold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Plus className="w-5 h-5 text-indigo-600" />
            Add Loan Record
          </h2>

          <form onSubmit={handleAddDebt} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Person / Institution Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Ali / Meezan Bank / Friend"
                value={personName}
                onChange={(e) => setPersonName(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Debt Type</label>
                <select
                  value={debtType}
                  onChange={(e) => handleDebtTypeChange(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="Personal Loan">Personal Loan</option>
                  <option value="Credit Card">Credit Card</option>
                  <option value="Kameti">Kameti</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Direction</label>
                <select
                  value={direction}
                  onChange={(e) => setDirection(e.target.value)}
                  disabled={debtType === 'Credit Card'}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-indigo-900 disabled:opacity-75 disabled:bg-slate-100"
                >
                  <option value="Given (Receivable)">Given (Logay)</option>
                  <option value="Taken (Payable)">Taken (Denay)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Amount (PKR)</label>
                <input
                  type="number"
                  required
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Due Date</label>
                <input
                  type="date"
                  required
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Notes / Remarks</label>
              <input
                type="text"
                placeholder="e.g. Monthly installment details or agreement"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-xl text-xs transition shadow-sm"
            >
              Add Debt Entry
            </button>
          </form>
        </div>

        {/* Right Column: Debts Ledger */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h2 className="text-base font-semibold text-slate-800">Active Loans & Debts Ledger</h2>

            {loading ? (
              <p className="text-xs text-slate-400 py-4 text-center">Loading debt records...</p>
            ) : debts.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No active debt records found.</p>
            ) : (
              <div className="space-y-3">
                {debts.map((d) => {
                  const isReceivable = d.direction.includes('Given') || d.direction.includes('Receivable');
                  const isSettled = d.status === 'Settled';

                  return (
                    <div
                      key={d.id}
                      className={`p-4 rounded-xl border flex items-center justify-between transition ${
                        isSettled
                          ? 'bg-slate-50/60 border-slate-200 opacity-75'
                          : isReceivable
                          ? 'bg-emerald-50/30 border-emerald-100'
                          : 'bg-rose-50/30 border-rose-100'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800 text-sm">{d.person_name}</span>
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium">
                            {d.type}
                          </span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-md font-semibold ${
                              isReceivable
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-rose-100 text-rose-700'
                            }`}
                          >
                            {d.direction}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">{d.notes || 'No remarks'}</p>
                        <p className="text-[11px] text-slate-400 font-mono">
                          Due: {d.due_date} {isSettled && '• (Settled)'}
                        </p>
                      </div>

                      <div className="text-right space-y-2">
                        <p
                          className={`text-base font-bold ${
                            isSettled
                              ? 'text-slate-400 line-through'
                              : isReceivable
                              ? 'text-emerald-700'
                              : 'text-rose-700'
                          }`}
                        >
                          PKR {Number(d.amount).toLocaleString()}
                        </p>

                        {!isSettled && (
                          <button
                            onClick={() => handleOpenSettlementModal(d)}
                            className="text-[11px] text-white bg-slate-900 hover:bg-slate-800 font-medium px-3 py-1 rounded-lg transition shadow-xs"
                          >
                            Mark Settled
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Settlement Transaction Modal */}
      {settlingDebt && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-5">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Record Debt Settlement</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Settling loan for <strong>{settlingDebt.person_name}</strong> ({settlingDebt.direction})
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  {settlingDebt.direction.includes('Given') || settlingDebt.direction.includes('Receivable')
                    ? 'Received In Account'
                    : 'Paid From Account'}
                </label>
                <select
                  value={selectedAccount}
                  onChange={(e) => setSelectedAccount(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                >
                  {accounts.map((acc) => (
                    <option key={acc} value={acc}>
                      {acc}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Settlement Date</label>
                  <input
                    type="date"
                    required
                    value={settlementDate}
                    onChange={(e) => setSettlementDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Amount (PKR)</label>
                  <input
                    type="number"
                    required
                    value={settlementAmount}
                    onChange={(e) => setSettlementAmount(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setSettlingDebt(null)}
                className="flex-1 py-2.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSettlement}
                className="flex-1 py-2.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition shadow-xs"
              >
                Confirm & Record Settlement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}