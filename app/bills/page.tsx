'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { syncCreditCardDebt } from '@/lib/financeSync';
import { Plus, CheckCircle, Clock, Calendar, CreditCard, DollarSign, Trash2, AlertTriangle, Search, Filter, Repeat } from 'lucide-react';

export interface Bill {
  id: string;
  title: string;
  category: string;
  amount: number;
  late_charges?: number;
  due_date: string;
  status: string; // 'Pending' or 'Paid'
  notes?: string;
  is_recurring?: boolean;
  created_at?: string;
}

export default function BillsPage() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [accounts, setAccounts] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [todayStr, setTodayStr] = useState<string>('');

  // Filter & Search State
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'overdue' | 'paid'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Utilities & Bills');
  const [amount, setAmount] = useState('');
  const [lateCharges, setLateCharges] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [notes, setNotes] = useState('');

  // Payment Modal State
  const [payingBill, setPayingBill] = useState<Bill | null>(null);
  const [payingTotalAmount, setPayingTotalAmount] = useState<number>(0);
  const [selectedAccount, setSelectedAccount] = useState('');

  // Transfer Modal State
  const [transferringBill, setTransferringBill] = useState<Bill | null>(null);
  const [transferTotalAmount, setTransferTotalAmount] = useState<number>(0);
  const [sourceAccount, setSourceAccount] = useState('');
  const [targetAccount, setTargetAccount] = useState('');

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setTodayStr(today);
    fetchBillsAndAccounts();
  }, []);

  const fetchBillsAndAccounts = async () => {
    setLoading(true);

    const { data: accData } = await supabase.from('accounts').select('name');
    if (accData && accData.length > 0) {
      const names = accData.map((a: { name: string }) => a.name);
      setAccounts(names);
      setSelectedAccount(names[0]);
      setSourceAccount(names[0]);
      if (names.length > 1) setTargetAccount(names[1]);
    }

    const { data, error } = await supabase
      .from('bills')
      .select('*')
      .order('due_date', { ascending: true });

    if (error) {
      console.error('Error fetching bills:', error.message);
    } else {
      setBills(data || []);
    }
    setLoading(false);
  };

  const handleAddBill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !amount || !dueDate) {
      alert('Please fill required fields.');
      return;
    }

    const { error } = await supabase.from('bills').insert([
      {
        title,
        category,
        amount: parseFloat(amount),
        late_charges: lateCharges ? parseFloat(lateCharges) : 0,
        due_date: dueDate,
        status: 'Pending',
        is_recurring: isRecurring,
        notes,
      },
    ]);

    if (error) {
      alert('Error adding bill: ' + error.message);
    } else {
      setTitle('');
      setAmount('');
      setLateCharges('');
      setNotes('');
      setIsRecurring(false);
      fetchBillsAndAccounts();
    }
  };

  const handleOpenMarkPaidModal = (bill: Bill) => {
    const isOverdue = bill.status === 'Pending' && todayStr && bill.due_date < todayStr;
    const totalToPay = isOverdue
      ? Number(bill.amount || 0) + Number(bill.late_charges || 0)
      : Number(bill.amount || 0);

    setPayingBill(bill);
    setPayingTotalAmount(totalToPay);
  };

  const handleOpenTransferModal = (bill: Bill) => {
    const isOverdue = bill.status === 'Pending' && todayStr && bill.due_date < todayStr;
    const totalToPay = isOverdue
      ? Number(bill.amount || 0) + Number(bill.late_charges || 0)
      : Number(bill.amount || 0);

    setTransferringBill(bill);
    setTransferTotalAmount(totalToPay);
  };

  const handleConfirmMarkPaid = async () => {
    if (!payingBill || !selectedAccount) return;

    const { error: txErr } = await supabase.from('transactions').insert([
      {
        date: todayStr,
        type: 'Bill Payment',
        account_name: selectedAccount,
        category: payingBill.category || 'Utilities & Bills',
        amount: payingTotalAmount,
        party_name: payingBill.title,
        description: `Paid bill: ${payingBill.title} ${
          payingTotalAmount > Number(payingBill.amount) ? '(Includes Late Fee)' : ''
        }`,
        entered_by: 'Husband',
      },
    ]);

    if (txErr) {
      alert('Error recording transaction: ' + txErr.message);
      return;
    }

    const { data: accList } = await supabase.from('accounts').select('*').eq('name', selectedAccount).limit(1);
    if (accList && accList.length > 0) {
      const acc = accList[0];
      const newBal = Number(acc.current_balance || 0) - payingTotalAmount;
      await supabase.from('accounts').update({ current_balance: newBal }).eq('id', acc.id);
    }

    const { error: billErr } = await supabase
      .from('bills')
      .update({
        status: 'Paid',
        amount: payingTotalAmount,
      })
      .eq('id', payingBill.id);

    if (billErr) {
      alert('Error updating bill status: ' + billErr.message);
      return;
    }

    if (payingBill.is_recurring) {
      const nextDate = new Date(payingBill.due_date);
      nextDate.setMonth(nextDate.getMonth() + 1);
      const nextDueDateStr = nextDate.toISOString().split('T')[0];

      await supabase.from('bills').insert([
        {
          title: payingBill.title,
          category: payingBill.category,
          amount: payingBill.amount,
          late_charges: payingBill.late_charges || 0,
          due_date: nextDueDateStr,
          status: 'Pending',
          is_recurring: true,
          notes: 'Auto-generated recurring monthly bill',
        },
      ]);
    }

    setPayingBill(null);
    alert('Bill marked as paid successfully!');
    fetchBillsAndAccounts();
  };

  const handleDeleteBill = async (bill: Bill) => {
    if (!confirm('Kya aap waqai is bill entry ko delete karna chahte hain?')) return;

    if (bill.status === 'Paid') {
      const { data: txData } = await supabase
        .from('transactions')
        .select('*')
        .ilike('party_name', `%${bill.title}%`)
        .order('date', { ascending: false })
        .limit(1);

      if (txData && txData.length > 0) {
        const tx = txData[0];
        const accName = tx.account_name;
        const paidAmount = Number(tx.amount || bill.amount);

        const { data: accList } = await supabase.from('accounts').select('*').eq('name', accName).limit(1);
        if (accList && accList.length > 0) {
          const acc = accList[0];
          const restoredBal = Number(acc.current_balance || 0) + paidAmount;
          await supabase.from('accounts').update({ current_balance: restoredBal }).eq('id', acc.id);
        }

        await supabase.from('transactions').delete().eq('id', tx.id);
      }
    }

    const { error } = await supabase.from('bills').delete().eq('id', bill.id);
    if (error) alert('Error deleting bill: ' + error.message);
    else fetchBillsAndAccounts();
  };

  const handlePayNowAndTransfer = async () => {
    if (!transferringBill || !sourceAccount || !targetAccount) return;

    if (sourceAccount === targetAccount) {
      alert('Source and Destination accounts cannot be the same.');
      return;
    }

    const { error: txErr } = await supabase.from('transactions').insert([
      {
        date: todayStr,
        type: 'Transfer',
        account_name: sourceAccount,
        transfer_to: targetAccount,
        category: 'Internal Transfer',
        amount: transferTotalAmount,
        party_name: 'Credit Card Bill Payment',
        description: `Bill Payment for ${transferringBill.title || 'Bill'}`,
        entered_by: 'Husband',
      },
    ]);

    if (txErr) {
      alert('Error recording transfer transaction: ' + txErr.message);
      return;
    }

    const { data: srcAcc } = await supabase.from('accounts').select('*').eq('name', sourceAccount).limit(1);
    if (srcAcc && srcAcc.length > 0) {
      const newBal = Number(srcAcc[0].current_balance || 0) - transferTotalAmount;
      await supabase.from('accounts').update({ current_balance: newBal }).eq('id', srcAcc[0].id);
    }

    const { data: destAcc } = await supabase.from('accounts').select('*').eq('name', targetAccount).limit(1);
    if (destAcc && destAcc.length > 0) {
      const newBal = Number(destAcc[0].current_balance || 0) + transferTotalAmount;
      await supabase.from('accounts').update({ current_balance: newBal }).eq('id', destAcc[0].id);
    }

    if (targetAccount.toLowerCase().includes('credit card') || targetAccount.toLowerCase().includes('card')) {
      await syncCreditCardDebt(targetAccount, -transferTotalAmount);
    }

    await supabase
      .from('bills')
      .update({
        status: 'Paid',
        amount: transferTotalAmount,
      })
      .eq('id', transferringBill.id);

    if (transferringBill.is_recurring) {
      const nextDate = new Date(transferringBill.due_date);
      nextDate.setMonth(nextDate.getMonth() + 1);
      const nextDueDateStr = nextDate.toISOString().split('T')[0];

      await supabase.from('bills').insert([
        {
          title: transferringBill.title,
          category: transferringBill.category,
          amount: transferringBill.amount,
          late_charges: transferringBill.late_charges || 0,
          due_date: nextDueDateStr,
          status: 'Pending',
          is_recurring: true,
          notes: 'Auto-generated recurring monthly bill',
        },
      ]);
    }

    setTransferringBill(null);
    alert('Bill paid successfully via transfer & synced!');
    fetchBillsAndAccounts();
  };

  const totalPendingAmount = bills
    .filter((b) => b.status === 'Pending')
    .reduce((sum, b) => sum + Number(b.amount), 0);

  const overdueBillsCount = bills.filter(
    (b) => b.status === 'Pending' && todayStr && b.due_date < todayStr
  ).length;

  const totalOverdueAmount = bills
    .filter((b) => b.status === 'Pending' && todayStr && b.due_date < todayStr)
    .reduce((sum, b) => sum + Number(b.amount) + Number(b.late_charges || 0), 0);

  const filteredBills = bills.filter((b) => {
    const isOverdue = b.status === 'Pending' && todayStr && b.due_date < todayStr;
    if (filterStatus === 'pending' && (b.status !== 'Pending' || isOverdue)) return false;
    if (filterStatus === 'overdue' && !isOverdue) return false;
    if (filterStatus === 'paid' && b.status !== 'Paid') return false;

    if (searchQuery && !b.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Bills & Payables</h1>
        <p className="text-sm text-slate-500 mt-1">Track upcoming bills, recurring payments, and overdue alerts</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-amber-50 border border-amber-200 p-5 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-amber-800 uppercase tracking-wider">Total Pending Bills</p>
            <p className="text-2xl font-bold text-amber-950 mt-1">PKR {totalPendingAmount.toLocaleString()}</p>
          </div>
          <Clock className="w-8 h-8 text-amber-600 bg-amber-100 p-1.5 rounded-xl" />
        </div>

        <div className="bg-rose-50 border border-rose-200 p-5 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-rose-800 uppercase tracking-wider">Overdue Bills ({overdueBillsCount})</p>
            <p className="text-2xl font-bold text-rose-950 mt-1">PKR {totalOverdueAmount.toLocaleString()}</p>
          </div>
          <AlertTriangle className="w-8 h-8 text-rose-600 bg-rose-100 p-1.5 rounded-xl" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-fit space-y-4">
          <h2 className="text-base font-semibold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Plus className="w-5 h-5 text-indigo-600" />
            Add New Bill
          </h2>

          <form onSubmit={handleAddBill} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Bill Title</label>
              <input
                type="text"
                required
                placeholder="e.g. HBL Credit Card / KE Electric"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
              />
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
              <label className="block text-xs font-medium text-slate-700 mb-1">Late Charges (PKR)</label>
              <input
                type="number"
                placeholder="e.g. 850"
                value={lateCharges}
                onChange={(e) => setLateCharges(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-semibold text-rose-700"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="recurring"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
              />
              <label htmlFor="recurring" className="text-xs font-medium text-slate-700 flex items-center gap-1">
                <Repeat className="w-3.5 h-3.5 text-indigo-600" /> Repeat Monthly (Recurring)
              </label>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Notes</label>
              <input
                type="text"
                placeholder="e.g. Monthly statement"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-xl text-xs transition shadow-sm"
            >
              Add Bill Entry
            </button>
          </form>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-3 pb-2 border-b border-slate-100">
              <div className="relative w-full md:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search bills..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none"
                />
              </div>

              <div className="flex gap-1.5 overflow-x-auto w-full md:w-auto">
                <button
                  onClick={() => setFilterStatus('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${filterStatus === 'all' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilterStatus('pending')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${filterStatus === 'pending' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                  Pending
                </button>
                <button
                  onClick={() => setFilterStatus('overdue')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${filterStatus === 'overdue' ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                  Overdue
                </button>
                <button
                  onClick={() => setFilterStatus('paid')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${filterStatus === 'paid' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                  Paid
                </button>
              </div>
            </div>

            {loading ? (
              <p className="text-xs text-slate-400 py-4 text-center">Loading bills...</p>
            ) : filteredBills.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No bills match your filter.</p>
            ) : (
              <div className="space-y-3">
                {filteredBills.map((b) => {
                  const isCreditCardBill =
                    b.title.toLowerCase().includes('credit card') || b.title.toLowerCase().includes('card');

                  const isOverdue = b.status === 'Pending' && todayStr && b.due_date < todayStr;
                  const lateFee = Number(b.late_charges || 0);
                  const effectiveAmount = isOverdue
                    ? Number(b.amount || 0) + lateFee
                    : Number(b.amount || 0);

                  return (
                    <div
                      key={b.id}
                      className={`p-4 rounded-xl border flex items-center justify-between transition ${
                        b.status === 'Paid'
                          ? 'bg-slate-50/60 border-slate-200'
                          : isOverdue
                          ? 'bg-rose-50/40 border-rose-200 shadow-xs'
                          : 'bg-white border-amber-200 shadow-xs'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800 text-sm">{b.title}</span>
                          {b.is_recurring && (
                            <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md font-medium flex items-center gap-1">
                              <Repeat className="w-3 h-3" /> Recurring
                            </span>
                          )}
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                              b.status === 'Paid'
                                ? 'bg-emerald-100 text-emerald-700'
                                : isOverdue
                                ? 'bg-rose-100 text-rose-700 font-bold'
                                : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            {b.status === 'Paid' ? 'Paid' : isOverdue ? 'Overdue' : 'Pending'}
                          </span>
                        </div>

                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          <span className="flex items-center gap-1 font-mono">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" /> Due: {b.due_date}
                          </span>
                          {lateFee > 0 && b.status === 'Pending' && (
                            <span className="text-rose-600 font-medium">Late Fee: PKR {lateFee.toLocaleString()}</span>
                          )}
                        </div>
                      </div>

                      <div className="text-right space-y-2">
                        <div>
                          <p className={`text-base font-bold ${isOverdue ? 'text-rose-700' : 'text-slate-900'}`}>
                            PKR {effectiveAmount.toLocaleString()}
                          </p>
                        </div>

                        <div className="flex items-center justify-end gap-2">
                          {b.status === 'Pending' && (
                            <>
                              <button
                                onClick={() => handleOpenMarkPaidModal(b)}
                                className="text-[11px] text-slate-700 hover:text-slate-900 font-medium px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                              >
                                Mark Paid
                              </button>
                              {isCreditCardBill && (
                                <button
                                  onClick={() => handleOpenTransferModal(b)}
                                  className="text-[11px] text-white font-medium px-3 py-1 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition shadow-xs flex items-center gap-1"
                                >
                                  <CreditCard className="w-3.5 h-3.5" /> Transfer
                                </button>
                              )}
                            </>
                          )}
                          <button
                            onClick={() => handleDeleteBill(b)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Delete Bill"
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

      {payingBill && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-5">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Record Bill Payment</h3>
              <p className="text-xs text-slate-500 mt-0.5">Marking <strong>{payingBill.title}</strong> as paid.</p>
              <div className="mt-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs flex justify-between items-center">
                <span className="text-slate-600">Total Settlement:</span>
                <span className="font-bold text-indigo-900 text-sm">PKR {payingTotalAmount.toLocaleString()}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Paid From Account</label>
              <select
                value={selectedAccount}
                onChange={(e) => setSelectedAccount(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium"
              >
                {accounts.map((acc) => (
                  <option key={acc} value={acc}>{acc}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => setPayingBill(null)} className="flex-1 py-2.5 text-xs font-medium text-slate-600 bg-slate-100 rounded-xl">Cancel</button>
              <button onClick={handleConfirmMarkPaid} className="flex-1 py-2.5 text-xs font-medium text-white bg-indigo-600 rounded-xl">Confirm Payment</button>
            </div>
          </div>
        </div>
      )}

      {transferringBill && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-5">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Pay Bill via Transfer</h3>
              <p className="text-xs text-slate-500 mt-0.5">Paying <strong>{transferringBill.title}</strong></p>
              <div className="mt-2 p-2.5 bg-indigo-50 rounded-xl border border-indigo-100 text-xs flex justify-between items-center">
                <span className="text-indigo-800">Transfer Amount:</span>
                <span className="font-bold text-indigo-950 text-sm">PKR {transferTotalAmount.toLocaleString()}</span>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Pay From (Source Account)</label>
                <select
                  value={sourceAccount}
                  onChange={(e) => setSourceAccount(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium"
                >
                  {accounts.map((acc) => (
                    <option key={acc} value={acc}>{acc}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Transfer To (Credit Card)</label>
                <select
                  value={targetAccount}
                  onChange={(e) => setTargetAccount(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium text-indigo-700"
                >
                  {accounts.map((acc) => (
                    <option key={acc} value={acc}>{acc}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => setTransferringBill(null)} className="flex-1 py-2.5 text-xs font-medium text-slate-600 bg-slate-100 rounded-xl">Cancel</button>
              <button onClick={handlePayNowAndTransfer} className="flex-1 py-2.5 text-xs font-medium text-white bg-indigo-600 rounded-xl">Confirm Transfer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}