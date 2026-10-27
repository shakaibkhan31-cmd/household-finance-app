'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, CheckCircle, ArrowDownLeft, ArrowUpRight, DollarSign, Calendar, AlertCircle, Users, Wallet, History } from 'lucide-react';

export interface Debt {
  id: string;
  person_name: string;
  type: string; 
  direction: string; 
  amount: number;
  due_date: string;
  status: string; 
  notes?: string;
  created_at?: string;
}

export interface Kameti {
  id: string;
  committee_name: string;
  total_pool_amount: number;
  monthly_installment: number;
  my_turn_month: string;
  status: string;
  notes?: string;
}

export interface Transaction {
  id: string;
  date: string;
  type: string;
  account_name: string;
  amount: number;
  party_name: string;
  description: string;
}

export default function DebtsPage() {
  const [activeTab, setActiveTab] = useState<'debts' | 'kametis'>('debts');
  const [debts, setDebts] = useState<Debt[]>([]);
  const [kametis, setKametis] = useState<Kameti[]>([]);
  const [accounts, setAccounts] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [todayStr, setTodayStr] = useState('');

  // Debt Form State
  const [personName, setPersonName] = useState('');
  const [debtType, setDebtType] = useState('Personal Loan');
  const [direction, setDirection] = useState('Given (Receivable)');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');

  // Kameti Form State
  const [committeeName, setCommitteeName] = useState('');
  const [totalPoolAmount, setTotalPoolAmount] = useState('');
  const [monthlyInstallment, setMonthlyInstallment] = useState('');
  const [myTurnMonth, setMyTurnMonth] = useState('');
  const [kametiNotes, setKametiNotes] = useState('');

  // Partial Settlement Modal State
  const [settlingDebt, setSettlingDebt] = useState<Debt | null>(null);
  const [selectedAccount, setSelectedAccount] = useState('');
  const [settlementAmount, setSettlementAmount] = useState('');
  const [settlementDate, setSettlementDate] = useState('');

  // Kameti Action Modal State
  const [kametiActionModal, setKametiActionModal] = useState<{ kameti: Kameti; actionType: 'pay' | 'receive' } | null>(null);
  const [kametiAccount, setKametiAccount] = useState('');
  const [kametiActionAmount, setKametiActionAmount] = useState('');
  const [kametiActionDate, setKametiActionDate] = useState('');

  // History Modal State
  const [historyModalItem, setHistoryModalItem] = useState<{ title: string; type: 'debt' | 'kameti' } | null>(null);
  const [itemTransactions, setItemTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setTodayStr(today);
    setDueDate(today);
    setSettlementDate(today);
    setKametiActionDate(today);
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);

    const { data: accData } = await supabase.from('accounts').select('name');
    if (accData && accData.length > 0) {
      const names = accData.map((a: { name: string }) => a.name);
      setAccounts(names);
      setSelectedAccount(names[0]);
      setKametiAccount(names[0]);
    }

    const { data: debtData } = await supabase.from('debts').select('*').order('due_date', { ascending: true });
    setDebts(debtData || []);

    const { data: kametiData } = await supabase.from('kametis').select('*').order('created_at', { ascending: false });
    setKametis(kametiData || []);

    setLoading(false);
  };

  const handleDebtTypeChange = (newType: string) => {
    setDebtType(newType);
    if (newType === 'Credit Card') {
      setDirection('Taken (Payable)');
      if (!personName) setPersonName('Credit Card Outstanding');
    } else {
      if (personName === 'Credit Card Outstanding') setPersonName('');
      setDirection('Given (Receivable)');
    }
  };

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
      fetchData();
    }
  };

  const handleAddKameti = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!committeeName || !totalPoolAmount || !monthlyInstallment) {
      alert('Please fill required Kameti fields.');
      return;
    }

    const { error } = await supabase.from('kametis').insert([
      {
        committee_name: committeeName,
        total_pool_amount: parseFloat(totalPoolAmount),
        monthly_installment: parseFloat(monthlyInstallment),
        my_turn_month: myTurnMonth || 'TBD',
        status: 'Active',
        notes: kametiNotes,
      },
    ]);

    if (error) {
      alert('Error adding Kameti record: ' + error.message);
    } else {
      setCommitteeName('');
      setTotalPoolAmount('');
      setMonthlyInstallment('');
      setMyTurnMonth('');
      setKametiNotes('');
      fetchData();
    }
  };

  const handleOpenKametiAction = (kameti: Kameti, actionType: 'pay' | 'receive') => {
    setKametiActionModal({ kameti, actionType });
    setKametiActionAmount(actionType === 'pay' ? kameti.monthly_installment.toString() : kameti.total_pool_amount.toString());
  };

  const handleConfirmKametiAction = async () => {
    if (!kametiActionModal || !kametiAccount || !kametiActionAmount) {
      alert('Please select an account and enter amount.');
      return;
    }

    const { kameti, actionType } = kametiActionModal;
    const amountVal = parseFloat(kametiActionAmount);
    if (isNaN(amountVal) || amountVal <= 0) {
      alert('Please enter a valid amount.');
      return;
    }

    const isPay = actionType === 'pay';
    const txType = isPay ? 'Expense' : 'Income';
    const txCategory = 'Kameti / Savings Circle';
    const partyName = `Kameti: ${kameti.committee_name}`;
    const description = isPay ? `Monthly installment paid for ${kameti.committee_name}` : `Full payout received for ${kameti.committee_name}`;

    const { error: txErr } = await supabase.from('transactions').insert([
      {
        date: kametiActionDate,
        type: txType,
        account_name: kametiAccount,
        category: txCategory,
        amount: amountVal,
        party_name: partyName,
        description: description,
        entered_by: 'Husband',
      },
    ]);

    if (txErr) {
      alert('Error recording transaction trail: ' + txErr.message);
      return;
    }

    const { data: accList } = await supabase.from('accounts').select('*').eq('name', kametiAccount).limit(1);
    if (accList && accList.length > 0) {
      const acc = accList[0];
      let currentBal = Number(acc.current_balance || 0);
      if (isPay) currentBal -= amountVal;
      else currentBal += amountVal;
      await supabase.from('accounts').update({ current_balance: currentBal }).eq('id', acc.id);
    }

    if (!isPay) {
      await supabase.from('kametis').update({ status: 'Completed' }).eq('id', kameti.id);
    }

    setKametiActionModal(null);
    alert(isPay ? 'Installment successfully paid and recorded!' : 'Payout successfully received and recorded!');
    fetchData();
  };

  const handleOpenSettlementModal = (debt: Debt) => {
    setSettlingDebt(debt);
    setSettlementAmount(debt.amount.toString());
  };

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
      alert(`Settlement amount cannot exceed active balance of PKR ${settlingDebt.amount.toLocaleString()}.`);
      return;
    }

    const isReceivable = settlingDebt.direction.includes('Given') || settlingDebt.direction.includes('Receivable');

    const { error: txErr } = await supabase.from('transactions').insert([
      {
        date: settlementDate,
        type: 'Loan Repayment',
        account_name: selectedAccount,
        category: 'Loan / Debt Related',
        amount: payAmount,
        party_name: settlingDebt.person_name,
        description: `Partial/Full settlement for ${settlingDebt.type} (${settlingDebt.direction})`,
        entered_by: 'Husband',
      },
    ]);

    if (txErr) {
      alert('Error recording repayment transaction: ' + txErr.message);
      return;
    }

    const { data: accList } = await supabase.from('accounts').select('*').eq('name', selectedAccount).limit(1);
    if (accList && accList.length > 0) {
      const acc = accList[0];
      let currentBal = Number(acc.current_balance || 0);
      if (isReceivable) currentBal += payAmount;
      else currentBal -= payAmount;

      await supabase.from('accounts').update({ current_balance: currentBal }).eq('id', acc.id);
    }

    const remainingDebt = Math.max(0, settlingDebt.amount - payAmount);
    await supabase.from('debts').update({
      amount: remainingDebt,
      status: remainingDebt === 0 ? 'Settled' : 'Active',
    }).eq('id', settlingDebt.id);

    setSettlingDebt(null);
    fetchData();
  };

  const openHistoryModal = async (title: string, type: 'debt' | 'kameti') => {
    setHistoryModalItem({ title, type });
    const searchKeyword = type === 'debt' ? title : `Kameti: ${title}`;
    const { data } = await supabase
      .from('transactions')
      .select('*')
      .ilike('party_name', `%${searchKeyword}%`)
      .order('date', { ascending: false });

    setItemTransactions(data || []);
  };

  const totalReceivable = debts
    .filter((d) => d.status === 'Active' && (d.direction.includes('Given') || d.direction.includes('Receivable')))
    .reduce((sum, d) => sum + Number(d.amount), 0);

  const totalPayable = debts
    .filter((d) => d.status === 'Active' && (d.direction.includes('Taken') || d.direction.includes('Payable')))
    .reduce((sum, d) => sum + Number(d.amount), 0);

  const activeKametisPool = kametis
    .filter((k) => k.status === 'Active')
    .reduce((sum, k) => sum + Number(k.total_pool_amount), 0);

  const upcomingDebts = debts.filter((d) => {
    if (d.status !== 'Active' || !todayStr) return false;
    const dueTime = new Date(d.due_date).getTime();
    const nowTime = new Date(todayStr).getTime();
    const diffDays = (dueTime - nowTime) / (1000 * 3600 * 24);
    return diffDays >= 0 && diffDays <= 5;
  });

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 bg-slate-50 dark:bg-slate-950 min-h-screen transition-colors">
      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Debts & Kameti Management</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track personal loans, partial installments, and rotating savings circles
          </p>
        </div>

        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-full md:w-auto">
          <button
            onClick={() => setActiveTab('debts')}
            className={`flex-1 md:flex-initial px-4 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeTab === 'debts' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Loans & Debts ({debts.filter(d => d.status === 'Active').length})
          </button>
          <button
            onClick={() => setActiveTab('kametis')}
            className={`flex-1 md:flex-initial px-4 py-2 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'kametis' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" /> Kameti Circles ({kametis.filter(k => k.status === 'Active').length})
          </button>
        </div>
      </div>

      {/* Due Soon Alert Banner */}
      {upcomingDebts.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 p-4 rounded-2xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
          <div className="text-xs text-amber-900 dark:text-amber-200">
            <span className="font-bold">Payment Due Soon:</span> You have {upcomingDebts.length} active debt/loan payment(s) due within the next 5 days. Check the ledger below.
          </div>
        </div>
      )}

      {/* TAB 1: LOANS & DEBTS VIEW */}
      {activeTab === 'debts' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 p-5 rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider">Total Receivable (Logay)</p>
                <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-200 mt-1">PKR {totalReceivable.toLocaleString()}</p>
              </div>
              <ArrowDownLeft className="w-8 h-8 text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/40 p-1.5 rounded-xl shrink-0" />
            </div>

            <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 p-5 rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-rose-800 dark:text-rose-400 uppercase tracking-wider">Total Payable (Denay)</p>
                <p className="text-2xl font-bold text-rose-900 dark:text-rose-200 mt-1">PKR {totalPayable.toLocaleString()}</p>
              </div>
              <ArrowUpRight className="w-8 h-8 text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-900/40 p-1.5 rounded-xl shrink-0" />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 h-fit space-y-4">
              <h2 className="text-base font-semibold text-slate-800 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <Plus className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                Add Loan Record
              </h2>

              <form onSubmit={handleAddDebt} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Person / Institution Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ali / Meezan Bank"
                    value={personName}
                    onChange={(e) => setPersonName(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Debt Type</label>
                    <select
                      value={debtType}
                      onChange={(e) => handleDebtTypeChange(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      <option value="Personal Loan">Personal Loan</option>
                      <option value="Credit Card">Credit Card</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Direction</label>
                    <select
                      value={direction}
                      onChange={(e) => setDirection(e.target.value)}
                      disabled={debtType === 'Credit Card'}
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-indigo-900 dark:text-indigo-300 disabled:opacity-75 disabled:bg-slate-100 dark:disabled:bg-slate-800"
                    >
                      <option value="Given (Receivable)">Given (Logay)</option>
                      <option value="Taken (Payable)">Taken (Denay)</option>
                    </select>
                  </div>
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
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Due Date</label>
                    <input
                      type="date"
                      required
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Notes / Remarks</label>
                  <input
                    type="text"
                    placeholder="e.g. Agreement details"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-xl text-xs transition shadow-sm cursor-pointer"
                >
                  Add Debt Entry
                </button>
              </form>
            </div>

            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 md:p-6 space-y-4">
                <h2 className="text-base font-semibold text-slate-800 dark:text-white">Active Loans & Debts Ledger</h2>

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
                          className={`p-3.5 md:p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition ${
                            isSettled
                              ? 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-75'
                              : isReceivable
                              ? 'bg-emerald-50/30 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/40'
                              : 'bg-rose-50/30 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/40'
                          }`}
                        >
                          <div className="space-y-1 w-full sm:w-auto pr-0 sm:pr-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-slate-800 dark:text-white text-sm">{d.person_name}</span>
                              <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-md font-medium">{d.type}</span>
                              <span className={`text-[10px] px-2 py-0.5 rounded-md font-semibold ${isReceivable ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300' : 'bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300'}`}>
                                {d.direction}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{d.notes || 'No remarks'}</p>
                            <p className="text-[11px] text-slate-400 font-mono">Due: {d.due_date} {isSettled && '• (Settled)'}</p>
                          </div>

                          <div className="w-full sm:w-auto flex sm:flex-col items-center sm:items-end justify-between sm:justify-start pt-2 sm:pt-0 border-t sm:border-0 border-slate-100 dark:border-slate-800 gap-2 shrink-0">
                            <div>
                              <p className={`text-base font-bold whitespace-nowrap ${isSettled ? 'text-slate-400 line-through' : isReceivable ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
                                PKR {Number(d.amount).toLocaleString()}
                              </p>
                            </div>
                            <div className="flex items-center gap-1.5 justify-end">
                              <button
                                onClick={() => openHistoryModal(d.person_name, 'debt')}
                                className="p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
                                title="View History Trail"
                              >
                                <History className="w-4 h-4" />
                              </button>
                              {!isSettled && (
                                <button
                                  onClick={() => handleOpenSettlementModal(d)}
                                  className="text-[11px] text-white bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 font-medium px-3 py-1 rounded-lg transition shadow-xs cursor-pointer"
                                >
                                  Settle / Pay
                                </button>
                              )}
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
        </div>
      )}

      {/* TAB 2: KAMETI CIRCLES VIEW */}
      {activeTab === 'kametis' && (
        <div className="space-y-6">
          <div className="bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/50 p-5 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-indigo-800 dark:text-indigo-400 uppercase tracking-wider">Total Active Kameti Pools</p>
              <p className="text-2xl font-bold text-indigo-950 dark:text-indigo-200 mt-1">PKR {activeKametisPool.toLocaleString()}</p>
            </div>
            <Users className="w-8 h-8 text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/40 p-1.5 rounded-xl shrink-0" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 h-fit space-y-4">
              <h2 className="text-base font-semibold text-slate-800 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <Plus className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                Add Kameti Circle
              </h2>

              <form onSubmit={handleAddKameti} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Committee Name / Organizer</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Family Kameti"
                    value={committeeName}
                    onChange={(e) => setCommitteeName(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Total Pool (PKR)</label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 100000"
                      value={totalPoolAmount}
                      onChange={(e) => setTotalPoolAmount(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Monthly Installment</label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 10000"
                      value={monthlyInstallment}
                      onChange={(e) => setMonthlyInstallment(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-indigo-900 dark:text-indigo-300"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">My Turn / Payout Month</label>
                  <input
                    type="text"
                    placeholder="e.g. November 2026"
                    value={myTurnMonth}
                    onChange={(e) => setMyTurnMonth(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Remarks / Notes</label>
                  <input
                    type="text"
                    placeholder="e.g. 10 members total"
                    value={kametiNotes}
                    onChange={(e) => setKametiNotes(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-xl text-xs transition shadow-sm cursor-pointer"
                >
                  Add Kameti Circle
                </button>
              </form>
            </div>

            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 md:p-6 space-y-4">
                <h2 className="text-base font-semibold text-slate-800 dark:text-white">Active Kameti Circles</h2>

                {kametis.length === 0 ? (
                  <p className="text-xs text-slate-400 py-4 text-center">No active Kameti circles recorded.</p>
                ) : (
                  <div className="space-y-3">
                    {kametis.map((k) => {
                      const isCompleted = k.status === 'Completed';
                      return (
                        <div 
                          key={k.id}
                          className={`p-3.5 md:p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition ${
                            isCompleted ? 'bg-slate-50 dark:bg-slate-800/40 opacity-75' : 'bg-indigo-50/30 dark:bg-indigo-950/20 border-indigo-100 dark:border-indigo-900/40'
                          }`}
                        >
                          <div className="space-y-1 w-full sm:w-auto pr-0 sm:pr-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-slate-800 dark:text-white text-sm">{k.committee_name}</span>
                              <span className="text-[10px] bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-md font-semibold">Turn: {k.my_turn_month}</span>
                              {isCompleted && <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded-md font-medium">Completed</span>}
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{k.notes || 'No remarks'}</p>
                            <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">Monthly Installment: <strong className="text-indigo-900 dark:text-indigo-300">PKR {Number(k.monthly_installment).toLocaleString()}</strong></p>
                          </div>

                          <div className="w-full sm:w-auto flex sm:flex-col items-center sm:items-end justify-between sm:justify-start pt-2 sm:pt-0 border-t sm:border-0 border-slate-100 dark:border-slate-800 gap-2 shrink-0">
                            <div>
                              <p className="text-[10px] text-slate-400 uppercase tracking-wider text-left sm:text-right">Total Pool</p>
                              <p className="text-base font-bold text-slate-900 dark:text-white whitespace-nowrap">PKR {Number(k.total_pool_amount).toLocaleString()}</p>
                            </div>

                            <div className="flex gap-1.5 justify-end">
                              <button
                                onClick={() => openHistoryModal(k.committee_name, 'kameti')}
                                className="p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
                                title="View Installment History"
                              >
                                <History className="w-4 h-4" />
                              </button>
                              {!isCompleted && (
                                <>
                                  <button
                                    onClick={() => handleOpenKametiAction(k, 'pay')}
                                    className="text-[11px] text-white bg-indigo-600 hover:bg-indigo-700 font-semibold px-2.5 py-1 rounded-lg transition cursor-pointer"
                                  >
                                    + Pay
                                  </button>
                                  <button
                                    onClick={() => handleOpenKametiAction(k, 'receive')}
                                    className="text-[11px] text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 font-semibold px-2.5 py-1 rounded-lg transition cursor-pointer"
                                  >
                                    Receive
                                  </button>
                                </>
                              )}
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
        </div>
      )}

      {/* History Trail Modal */}
      {historyModalItem && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Transaction History Trail</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">{historyModalItem.title}</p>
              </div>
              <button onClick={() => setHistoryModalItem(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">×</button>
            </div>

            <div className="max-h-80 overflow-y-auto space-y-2">
              {itemTransactions.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">No transaction records found for this item.</p>
              ) : (
                itemTransactions.map((tx) => (
                  <div key={tx.id} className="p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-white">{tx.description}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{tx.date} • {tx.account_name}</p>
                    </div>
                    <p className="font-bold text-indigo-700 dark:text-indigo-400 whitespace-nowrap">PKR {Number(tx.amount).toLocaleString()}</p>
                  </div>
                ))
              )}
            </div>

            <button
              onClick={() => setHistoryModalItem(null)}
              className="w-full py-2 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition mt-2 cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Kameti Pay / Receive Modal */}
      {kametiActionModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-md w-full p-6 space-y-5">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {kametiActionModal.actionType === 'pay' ? 'Pay Monthly Installment' : 'Receive Kameti Payout'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Circle: <strong>{kametiActionModal.kameti.committee_name}</strong></p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {kametiActionModal.actionType === 'pay' ? 'Paid From Account' : 'Received In Account'}
                </label>
                <select
                  value={kametiAccount}
                  onChange={(e) => setKametiAccount(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                >
                  {accounts.map((acc) => (
                    <option key={acc} value={acc}>{acc}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={kametiActionDate}
                    onChange={(e) => setKametiActionDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Amount (PKR)</label>
                  <input
                    type="number"
                    required
                    value={kametiActionAmount}
                    onChange={(e) => setKametiActionAmount(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 outline-none font-bold"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setKametiActionModal(null)}
                className="flex-1 py-2.5 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmKametiAction}
                className="flex-1 py-2.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition shadow-xs cursor-pointer"
              >
                Confirm & Sync Ledger
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Partial Settlement Modal */}
      {settlingDebt && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-md w-full p-6 space-y-5">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Settle / Pay Loan Balance</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                For <strong>{settlingDebt.person_name}</strong> (Active Balance: PKR {settlingDebt.amount.toLocaleString()})
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {settlingDebt.direction.includes('Given') || settlingDebt.direction.includes('Receivable') ? 'Received In Account' : 'Paid From Account'}
                </label>
                <select
                  value={selectedAccount}
                  onChange={(e) => setSelectedAccount(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                >
                  {accounts.map((acc) => (
                    <option key={acc} value={acc}>{acc}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={settlementDate}
                    onChange={(e) => setSettlementDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Payment Amount (PKR)</label>
                  <input
                    type="number"
                    required
                    value={settlementAmount}
                    onChange={(e) => setSettlementAmount(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 outline-none font-bold text-emerald-800 dark:text-emerald-400"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setSettlingDebt(null)}
                className="flex-1 py-2.5 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSettlement}
                className="flex-1 py-2.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition shadow-xs cursor-pointer"
              >
                Confirm Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}