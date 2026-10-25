'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { syncCreditCardDebt } from '@/lib/financeSync';
import { Plus, CheckCircle, Clock, Calendar, CreditCard, DollarSign, Trash2, AlertTriangle } from 'lucide-react';

export interface Bill {
  id: string;
  title: string;
  category: string;
  amount: number;
  late_charges?: number;
  due_date: string;
  status: string; // 'Pending' or 'Paid'
  notes?: string;
  created_at?: string;
}

export default function BillsPage() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [accounts, setAccounts] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [todayStr, setTodayStr] = useState<string>('');

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Utilities & Bills');
  const [amount, setAmount] = useState('');
  const [lateCharges, setLateCharges] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');

  // Payment Modal State (For Mark Paid with Account Tracking)
  const [payingBill, setPayingBill] = useState<Bill | null>(null);
  const [payingTotalAmount, setPayingTotalAmount] = useState<number>(0);
  const [selectedAccount, setSelectedAccount] = useState('');

  // Transfer Modal State (For Pay Now & Transfer - Credit Cards Only)
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

    // Fetch Accounts
    const { data: accData } = await supabase.from('accounts').select('name');
    if (accData && accData.length > 0) {
      const names = accData.map((a: { name: string }) => a.name);
      setAccounts(names);
      setSelectedAccount(names[0]);
      setSourceAccount(names[0]);
      if (names.length > 1) setTargetAccount(names[1]);
    }

    // Fetch Bills
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

  // Add New Bill
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
      fetchBillsAndAccounts();
    }
  };

  // Open Mark Paid Modal with Overdue Check
  const handleOpenMarkPaidModal = (bill: Bill) => {
    const isOverdue = bill.status === 'Pending' && todayStr && bill.due_date < todayStr;
    const totalToPay = isOverdue
      ? Number(bill.amount || 0) + Number(bill.late_charges || 0)
      : Number(bill.amount || 0);

    setPayingBill(bill);
    setPayingTotalAmount(totalToPay);
  };

  // Open Transfer Modal with Overdue Check
  const handleOpenTransferModal = (bill: Bill) => {
    const isOverdue = bill.status === 'Pending' && todayStr && bill.due_date < todayStr;
    const totalToPay = isOverdue
      ? Number(bill.amount || 0) + Number(bill.late_charges || 0)
      : Number(bill.amount || 0);

    setTransferringBill(bill);
    setTransferTotalAmount(totalToPay);
  };

  // Confirm Mark Paid with Audit Trail & Account Deduction
  const handleConfirmMarkPaid = async () => {
    if (!payingBill || !selectedAccount) return;

    // 1. Record Bill Payment Transaction
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

    // 2. Deduct Amount from Account Balance
    const { data: accList } = await supabase.from('accounts').select('*').eq('name', selectedAccount).limit(1);
    if (accList && accList.length > 0) {
      const acc = accList[0];
      const newBal = Number(acc.current_balance || 0) - payingTotalAmount;
      await supabase.from('accounts').update({ current_balance: newBal }).eq('id', acc.id);
    }

    // 3. Update Bill Status to Paid and update amount to actual paid settlement amount
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

    setPayingBill(null);
    alert('Bill marked as paid successfully! Transaction ledger and account balance updated.');
    fetchBillsAndAccounts();
  };

  // Delete Bill with Account Balance Reversal (if bill was Paid)
  const handleDeleteBill = async (bill: Bill) => {
    if (!confirm('Kya aap waqai is bill entry ko delete karna chahte hain?')) return;

    // Agar bill 'Paid' tha, toh iska matlab pehle account se amount deduct hui thi. 
    // Delete hone par woh amount wapas account mein add (revert) honi chahiye.
    if (bill.status === 'Paid') {
      // Hum transactions table se is bill ki payment dhoond kar account pata laga sakte hain ya default account use kar sakte hain
      // Behtar tareeqay ke liye hum recent transaction check kar sakte hain, ya user se account puchen ya sabhi accounts mein check karein.
      // Yahan hum transactions table mein party_name ya description match karke account name nikal rahe hain:
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

        // Account balance wapas plus (restore) karna
        const { data: accList } = await supabase.from('accounts').select('*').eq('name', accName).limit(1);
        if (accList && accList.length > 0) {
          const acc = accList[0];
          const restoredBal = Number(acc.current_balance || 0) + paidAmount;
          await supabase.from('accounts').update({ current_balance: restoredBal }).eq('id', acc.id);
        }

        // Associated transaction bhi delete kar dein taake ledger clean rahe
        await supabase.from('transactions').delete().eq('id', tx.id);
      }
    }

    // Bill record delete karna
    const { error } = await supabase
      .from('bills')
      .delete()
      .eq('id', bill.id);

    if (error) {
      alert('Error deleting bill: ' + error.message);
    } else {
      fetchBillsAndAccounts();
    }
  };

  // Pay Now & Auto-Record Transfer (For Credit Cards with Auto-Sync Debt)
  const handlePayNowAndTransfer = async () => {
    if (!transferringBill || !sourceAccount || !targetAccount) return;

    if (sourceAccount === targetAccount) {
      alert('Source and Destination accounts cannot be the same.');
      return;
    }

    // 1. Insert Transfer Transaction
    const { error: txErr } = await supabase.from('transactions').insert([
      {
        date: todayStr,
        type: 'Transfer',
        account_name: sourceAccount,
        transfer_to: targetAccount,
        category: 'Internal Transfer',
        amount: transferTotalAmount,
        party_name: 'Credit Card Bill Payment',
        description: `Bill Payment for ${transferringBill.title || 'Bill'} ${
          transferTotalAmount > Number(transferringBill.amount) ? '(Includes Late Fee)' : ''
        }`,
        entered_by: 'Husband',
      },
    ]);

    if (txErr) {
      alert('Error recording transfer transaction: ' + txErr.message);
      return;
    }

    // 2. Adjust Source Account Balance (-)
    const { data: srcAcc } = await supabase.from('accounts').select('*').eq('name', sourceAccount).limit(1);
    if (srcAcc && srcAcc.length > 0) {
      const newBal = Number(srcAcc[0].current_balance || 0) - transferTotalAmount;
      await supabase.from('accounts').update({ current_balance: newBal }).eq('id', srcAcc[0].id);
    }

    // 3. Adjust Target Account Balance (+)
    const { data: destAcc } = await supabase.from('accounts').select('*').eq('name', targetAccount).limit(1);
    if (destAcc && destAcc.length > 0) {
      const newBal = Number(destAcc[0].current_balance || 0) + transferTotalAmount;
      await supabase.from('accounts').update({ current_balance: newBal }).eq('id', destAcc[0].id);
    }

    // 4. Auto-Sync / Settle Credit Card Debt in debts table via financeSync helper
    if (targetAccount.toLowerCase().includes('credit card') || targetAccount.toLowerCase().includes('card')) {
      await syncCreditCardDebt(targetAccount, -transferTotalAmount);
    }

    // 5. Update Bill Status to Paid and update amount to actual paid settlement amount
    await supabase
      .from('bills')
      .update({
        status: 'Paid',
        amount: transferTotalAmount,
      })
      .eq('id', transferringBill.id);

    setTransferringBill(null);
    alert('Bill paid successfully! Transfer recorded & Credit Card debt synced.');
    fetchBillsAndAccounts();
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Bills & Payables</h1>
        <p className="text-sm text-slate-500 mt-1">Track upcoming credit card bills, utility payments, and due dates</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Add New Bill */}
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
                placeholder="e.g. HBL Credit Card Bill / KE Electric"
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
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Late Charges (PKR) <span className="text-slate-400 font-normal">(Applied after due date)</span>
              </label>
              <input
                type="number"
                placeholder="e.g. 850"
                value={lateCharges}
                onChange={(e) => setLateCharges(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-semibold text-rose-700"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Notes / Remarks</label>
              <input
                type="text"
                placeholder="e.g. Oct Statement Bill"
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

        {/* Right Column: Bills List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h2 className="text-base font-semibold text-slate-800">Pending & Paid Bills</h2>

            {loading ? (
              <p className="text-xs text-slate-400 py-4 text-center">Loading bills...</p>
            ) : bills.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No bill entries found.</p>
            ) : (
              <div className="space-y-3">
                {bills.map((b) => {
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
                          <span className="font-bold text-slate-800 text-sm">
                            {b.title || 'Untitled Bill'}
                          </span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                              b.status === 'Paid'
                                ? 'bg-emerald-100 text-emerald-700'
                                : isOverdue
                                ? 'bg-rose-100 text-rose-700 font-bold'
                                : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            {b.status === 'Paid' ? 'Paid' : isOverdue ? 'Overdue (Late Fee Applied)' : 'Pending'}
                          </span>
                        </div>

                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          <span className="flex items-center gap-1 font-mono">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" /> Due: {b.due_date}
                          </span>
                          {lateFee > 0 && b.status === 'Pending' && (
                            <span className="text-rose-600 font-medium">
                              Late Fee: PKR {lateFee.toLocaleString()}
                            </span>
                          )}
                          {b.notes && <span>{b.notes}</span>}
                        </div>
                      </div>

                      <div className="text-right space-y-2">
                        <div>
                          <p
                            className={`text-base font-bold ${
                              isOverdue ? 'text-rose-700' : 'text-slate-900'
                            }`}
                          >
                            PKR {effectiveAmount.toLocaleString()}
                          </p>
                          {isOverdue && lateFee > 0 && (
                            <p className="text-[10px] text-rose-500 line-through">
                              Base: PKR {Number(b.amount).toLocaleString()}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center justify-end gap-2">
                          {b.status === 'Pending' && (
                            <>
                              {/* Mark Paid with Account Modal */}
                              <button
                                onClick={() => handleOpenMarkPaidModal(b)}
                                className="text-[11px] text-slate-700 hover:text-slate-900 font-medium px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                              >
                                Mark Paid
                              </button>

                              {/* Pay Now & Transfer (Only for Credit Card bills) */}
                              {isCreditCardBill && (
                                <button
                                  onClick={() => handleOpenTransferModal(b)}
                                  className="text-[11px] text-white font-medium px-3 py-1 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition shadow-xs flex items-center gap-1"
                                >
                                  <CreditCard className="w-3.5 h-3.5" /> Pay Now & Transfer
                                </button>
                              )}
                            </>
                          )}

                          {/* Delete Bill Button */}
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

      {/* Mark Paid Modal */}
      {payingBill && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-5">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Record Bill Payment</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Marking <strong>{payingBill.title}</strong> as paid.
              </p>
              <div className="mt-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs flex justify-between items-center">
                <span className="text-slate-600">Total Settlement Amount:</span>
                <span className="font-bold text-indigo-900 text-sm">
                  PKR {payingTotalAmount.toLocaleString()}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Paid From Account</label>
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

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setPayingBill(null)}
                className="flex-1 py-2.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmMarkPaid}
                className="flex-1 py-2.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition shadow-xs"
              >
                Confirm & Record Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pay Now & Transfer Modal (Credit Card Only) */}
      {transferringBill && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-5">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Pay Bill via Account Transfer</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Paying <strong>{transferringBill.title || 'Bill'}</strong>
              </p>
              <div className="mt-2 p-2.5 bg-indigo-50/60 rounded-xl border border-indigo-100 text-xs flex justify-between items-center">
                <span className="text-indigo-800 font-medium">Transfer Amount:</span>
                <span className="font-bold text-indigo-950 text-sm">
                  PKR {transferTotalAmount.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Pay From (Source Account)
                </label>
                <select
                  value={sourceAccount}
                  onChange={(e) => setSourceAccount(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                >
                  {accounts.map((acc) => (
                    <option key={acc} value={acc}>
                      {acc}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Transfer To (Credit Card / Target Account)
                </label>
                <select
                  value={targetAccount}
                  onChange={(e) => setTargetAccount(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-indigo-700"
                >
                  {accounts.map((acc) => (
                    <option key={acc} value={acc}>
                      {acc}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setTransferringBill(null)}
                className="flex-1 py-2.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={handlePayNowAndTransfer}
                className="flex-1 py-2.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition shadow-xs"
              >
                Confirm Payment & Transfer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}