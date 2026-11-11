'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { formatCurrency } from '@/lib/currency';
import { syncCreditCardDebt } from '@/lib/financeSync';
import { Plus, Clock, Calendar, CreditCard, Trash2, Edit2, AlertTriangle, Search, Repeat } from 'lucide-react';

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
  user_id?: string;
  household_id?: string;
}

const formatDateDisplay = (dateStr: string) => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return dateStr;
};

export default function BillsPage() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [accounts, setAccounts] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [todayStr, setTodayStr] = useState<string>('');
  const [currency, setCurrency] = useState('PKR');
  const [memberName, setMemberName] = useState<string>('Member');
  const [householdId, setHouseholdId] = useState<string | null>(null);

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
  const [actualPaidAmount, setActualPaidAmount] = useState<string>('');
  const [payingTotalAmount, setPayingTotalAmount] = useState<number>(0);
  const [selectedAccount, setSelectedAccount] = useState('');

  // Transfer Modal State
  const [transferringBill, setTransferringBill] = useState<Bill | null>(null);
  const [actualTransferAmount, setActualTransferAmount] = useState<string>('');
  const [transferTotalAmount, setTransferTotalAmount] = useState<number>(0);
  const [sourceAccount, setSourceAccount] = useState('');
  const [targetAccount, setTargetAccount] = useState('');

  // Edit Bill Modal State
  const [editingBill, setEditingBill] = useState<Bill | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState('Utilities & Bills');
  const [editAmount, setEditAmount] = useState('');
  const [editLateCharges, setEditLateCharges] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [editIsRecurring, setEditIsRecurring] = useState(false);
  const [editNotes, setEditNotes] = useState('');

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setTodayStr(today);
    fetchBillsAndAccounts();
  }, []);

  const fetchBillsAndAccounts = async () => {
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    // 1. Fetch User Profile for Currency, Household ID, and Full Name
    const { data: profile } = await supabase
      .from('profiles')
      .select('preferred_currency, full_name, household_id')
      .eq('id', user.id)
      .maybeSingle();

    if (profile) {
      if (profile.preferred_currency) {
        setCurrency(profile.preferred_currency);
      }
      if (profile.full_name) {
        setMemberName(profile.full_name);
      } else {
        setMemberName(user.email ? user.email.split('@')[0] : 'Member');
      }

      if (profile.household_id) {
        setHouseholdId(profile.household_id);

        // 2. Fetch Household Accounts
        const { data: accData } = await supabase
          .from('accounts')
          .select('name')
          .eq('household_id', profile.household_id);

        if (accData && accData.length > 0) {
          const names = accData.map((a: { name: string }) => a.name);
          setAccounts(names);
          setSelectedAccount(names[0]);
          setSourceAccount(names[0]);
          if (names.length > 1) setTargetAccount(names[1]);
        }

        // 3. Fetch Household Bills
        const { data, error } = await supabase
          .from('bills')
          .select('*')
          .eq('household_id', profile.household_id)
          .order('due_date', { ascending: true });

        if (error) {
          console.error('Error fetching bills:', error.message);
        } else {
          setBills(data || []);
        }
      }
    }
    setLoading(false);
  };

  const handleAddBill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !amount || !dueDate) {
      alert('Please fill required fields.');
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert('User not authenticated!');
      return;
    }

    if (!householdId) {
      alert('Household ID not found!');
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
        user_id: user.id,
        household_id: householdId,
      },
    ]);

    if (error) {
      alert('Error adding bill: ' + error.message);
    } else {
      setTitle('');
      setCategory('Utilities & Bills');
      setAmount('');
      setLateCharges('');
      setNotes('');
      setIsRecurring(false);
      fetchBillsAndAccounts();
    }
  };

  const handleOpenEditModal = (bill: Bill) => {
    setEditingBill(bill);
    setEditTitle(bill.title);
    setEditCategory(bill.category || 'Utilities & Bills');
    setEditAmount(bill.amount.toString());
    setEditLateCharges(bill.late_charges ? bill.late_charges.toString() : '');
    setEditDueDate(bill.due_date);
    setEditIsRecurring(!!bill.is_recurring);
    setEditNotes(bill.notes || '');
  };

  const handleUpdateBill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBill) return;

    const { error } = await supabase
      .from('bills')
      .update({
        title: editTitle,
        category: editCategory,
        amount: parseFloat(editAmount) || 0,
        late_charges: editLateCharges ? parseFloat(editLateCharges) : 0,
        due_date: editDueDate,
        is_recurring: editIsRecurring,
        notes: editNotes,
      })
      .eq('id', editingBill.id);

    if (error) {
      alert('Error updating bill: ' + error.message);
    } else {
      setEditingBill(null);
      alert('Bill updated successfully!');
      fetchBillsAndAccounts();
    }
  };

  const handleOpenMarkPaidModal = (bill: Bill) => {
    setPayingBill(bill);
    setActualPaidAmount(bill.amount.toString());
    const isOverdue = bill.status === 'Pending' && todayStr && bill.due_date < todayStr;
    const initialTotal = isOverdue
      ? Number(bill.amount || 0) + Number(bill.late_charges || 0)
      : Number(bill.amount || 0);
    setPayingTotalAmount(initialTotal);
  };

  const handleOpenTransferModal = (bill: Bill) => {
    setTransferringBill(bill);
    setActualTransferAmount(bill.amount.toString());
    const isOverdue = bill.status === 'Pending' && todayStr && bill.due_date < todayStr;
    const initialTotal = isOverdue
      ? Number(bill.amount || 0) + Number(bill.late_charges || 0)
      : Number(bill.amount || 0);
    setTransferTotalAmount(initialTotal);

    // Automatically select Credit Card as target account by default if bill title or category matches
    const matchingCreditAccount = accounts.find(
      acc => acc.toLowerCase().includes('credit') || acc.toLowerCase().includes('card') || bill.title.toLowerCase().includes(acc.toLowerCase())
    );
    if (matchingCreditAccount) {
      setTargetAccount(matchingCreditAccount);
    } else if (accounts.length > 1) {
      const alternative = accounts.find(acc => acc !== sourceAccount);
      if (alternative) setTargetAccount(alternative);
    }
  };

  const handleActualAmountChange = (val: string, type: 'markPaid' | 'transfer') => {
    const numericVal = parseFloat(val) || 0;
    if (type === 'markPaid') {
      setActualPaidAmount(val);
      const lateFee = payingBill && payingBill.status === 'Pending' && todayStr && payingBill.due_date < todayStr ? Number(payingBill.late_charges || 0) : 0;
      setPayingTotalAmount(numericVal + lateFee);
    } else {
      setActualTransferAmount(val);
      const lateFee = transferringBill && transferringBill.status === 'Pending' && todayStr && transferringBill.due_date < todayStr ? Number(transferringBill.late_charges || 0) : 0;
      setTransferTotalAmount(numericVal + lateFee);
    }
  };

  const handleConfirmMarkPaid = async () => {
    if (!payingBill || !selectedAccount || !householdId) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const finalPaidAmount = parseFloat(actualPaidAmount) || payingBill.amount;

    const { error: txErr } = await supabase.from('transactions').insert([
      {
        date: todayStr,
        type: 'Bill Payment',
        account_name: selectedAccount,
        category: payingBill.category || 'Utilities & Bills',
        amount: payingTotalAmount,
        party_name: payingBill.title,
        description: `Paid variable bill: ${payingBill.title} ${
          payingTotalAmount > finalPaidAmount ? '(Includes Late Fee)' : ''
        }`,
        entered_by: memberName,
        user_id: user.id,
        household_id: householdId,
      },
    ]);

    if (txErr) {
      alert('Error recording transaction: ' + txErr.message);
      return;
    }

    const { data: accList } = await supabase
      .from('accounts')
      .select('*')
      .eq('name', selectedAccount)
      .eq('household_id', householdId)
      .limit(1);

    if (accList && accList.length > 0) {
      const acc = accList[0];
      const isCard = (acc.type || acc.account_type || '').toLowerCase().includes('credit');
      const newBal = isCard 
        ? Number(acc.current_balance || 0) + payingTotalAmount 
        : Number(acc.current_balance || 0) - payingTotalAmount;
      await supabase
        .from('accounts')
        .update({ current_balance: newBal })
        .eq('id', acc.id);
    }

    const { error: billErr } = await supabase
      .from('bills')
      .update({
        status: 'Paid',
        amount: finalPaidAmount,
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
          amount: finalPaidAmount,
          late_charges: payingBill.late_charges || 0,
          due_date: nextDueDateStr,
          status: 'Pending',
          is_recurring: true,
          notes: 'Auto-generated recurring variable bill',
          user_id: user.id,
          household_id: householdId,
        },
      ]);
    }

    setPayingBill(null);
    alert('Variable bill marked as paid successfully!');
    fetchBillsAndAccounts();
  };

  const handleDeleteBill = async (bill: Bill) => {
    if (!confirm(`Kya aap waqai is bill entry ko delete karna chahte hain?`)) return;

    if (!householdId) return;

    if (bill.status === 'Paid') {
      const { data: txData } = await supabase
        .from('transactions')
        .select('*')
        .eq('household_id', householdId)
        .ilike('party_name', `%${bill.title}%`)
        .order('date', { ascending: false })
        .limit(1);

      if (txData && txData.length > 0) {
        const tx = txData[0];
        const accName = tx.account_name;
        const paidAmount = Number(tx.amount || bill.amount);

        const { data: accList } = await supabase
          .from('accounts')
          .select('*')
          .eq('name', accName)
          .eq('household_id', householdId)
          .limit(1);

        if (accList && accList.length > 0) {
          const acc = accList[0];
          const isCard = (acc.type || acc.account_type || '').toLowerCase().includes('credit');
          const restoredBal = isCard 
            ? Number(acc.current_balance || 0) - paidAmount 
            : Number(acc.current_balance || 0) + paidAmount;
          await supabase
            .from('accounts')
            .update({ current_balance: restoredBal })
            .eq('id', acc.id);
        }

        await supabase
          .from('transactions')
          .delete()
          .eq('id', tx.id);
      }
    }

    const { error } = await supabase
      .from('bills')
      .delete()
      .eq('id', bill.id);

    if (error) alert('Error deleting bill: ' + error.message);
    else fetchBillsAndAccounts();
  };

  const handlePayNowAndTransfer = async () => {
    if (!transferringBill || !sourceAccount || !targetAccount || !householdId) return;

    if (sourceAccount === targetAccount) {
      alert('Source and Destination accounts cannot be the same.');
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const finalTransferAmt = parseFloat(actualTransferAmount) || transferringBill.amount;

    const { error: txErr } = await supabase.from('transactions').insert([
      {
        date: todayStr,
        type: 'Transfer',
        account_name: sourceAccount,
        transfer_to: targetAccount,
        category: transferringBill.category || 'Internal Transfer',
        amount: transferTotalAmount,
        party_name: 'Credit Card Bill Payment',
        description: `Bill Payment for ${transferringBill.title || 'Bill'}`,
        entered_by: memberName,
        user_id: user.id,
        household_id: householdId,
      },
    ]);

    if (txErr) {
      alert('Error recording transfer transaction: ' + txErr.message);
      return;
    }

    // Source Account deduction
    const { data: srcAcc } = await supabase
      .from('accounts')
      .select('*')
      .eq('name', sourceAccount)
      .eq('household_id', householdId)
      .limit(1);

    if (srcAcc && srcAcc.length > 0) {
      const isSrcCard = (srcAcc[0].type || srcAcc[0].account_type || '').toLowerCase().includes('credit');
      const newBal = isSrcCard 
        ? Number(srcAcc[0].current_balance || 0) + transferTotalAmount 
        : Number(srcAcc[0].current_balance || 0) - transferTotalAmount;
      await supabase
        .from('accounts')
        .update({ current_balance: newBal })
        .eq('id', srcAcc[0].id);
    }

    // Destination Account (Credit Card) payment reduction
    const { data: destAcc } = await supabase
      .from('accounts')
      .select('*')
      .eq('name', targetAccount)
      .eq('household_id', householdId)
      .limit(1);

    if (destAcc && destAcc.length > 0) {
      const isDestCard = (destAcc[0].type || destAcc[0].account_type || '').toLowerCase().includes('credit');
      const newBal = isDestCard 
        ? Number(destAcc[0].current_balance || 0) - transferTotalAmount 
        : Number(destAcc[0].current_balance || 0) + transferTotalAmount;
      await supabase
        .from('accounts')
        .update({ current_balance: newBal })
        .eq('id', destAcc[0].id);
    }

    if (targetAccount.toLowerCase().includes('credit card') || targetAccount.toLowerCase().includes('card')) {
      await syncCreditCardDebt(targetAccount, transferTotalAmount);
    }

    await supabase
      .from('bills')
      .update({
        status: 'Paid',
        amount: finalTransferAmt,
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
          amount: finalTransferAmt,
          late_charges: transferringBill.late_charges || 0,
          due_date: nextDueDateStr,
          status: 'Pending',
          is_recurring: true,
          notes: 'Auto-generated recurring variable bill',
          user_id: user.id,
          household_id: householdId,
        },
      ]);
    }

    setTransferringBill(null);
    alert('Credit card variable bill paid successfully via transfer & synced!');
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
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 bg-slate-50 dark:bg-slate-950 min-h-screen transition-colors">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Bills & Payables</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Track variable utility bills, recurring statements, and credit card dues</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 p-5 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-amber-800 dark:text-amber-400 uppercase tracking-wider">Total Pending Bills</p>
            <p className="text-2xl font-bold text-amber-950 dark:text-amber-200 mt-1">{formatCurrency(totalPendingAmount, currency)}</p>
          </div>
          <Clock className="w-8 h-8 text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/40 p-1.5 rounded-xl shrink-0" />
        </div>

        <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 p-5 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-rose-800 dark:text-rose-400 uppercase tracking-wider">Overdue Bills ({overdueBillsCount})</p>
            <p className="text-2xl font-bold text-rose-950 dark:text-rose-200 mt-1">{formatCurrency(totalOverdueAmount, currency)}</p>
          </div>
          <AlertTriangle className="w-8 h-8 text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-900/40 p-1.5 rounded-xl shrink-0" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 h-fit space-y-4">
          <h2 className="text-base font-semibold text-slate-800 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Plus className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Add New Bill
          </h2>

          <form onSubmit={handleAddBill} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Bill Title</label>
              <input
                type="text"
                required
                placeholder="e.g. HBL Credit Card / KE Electric / School Fee"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 outline-none font-medium cursor-pointer"
              >
                <option value="Utilities & Bills">Utilities & Bills</option>
                <option value="Housing & Shelter">Housing & Shelter</option>
                <option value="Education">Education</option>
                <option value="School Transport">School Transport</option>
                <option value="Credit Card">Credit Card</option>
                <option value="Memberships & Subscriptions">Memberships & Subscriptions</option>
                <option value="Groceries & Food">Groceries & Food</option>
                <option value="Vehicle Maintenance">Vehicle Maintenance</option>
                <option value="Medical & Health">Medical & Health</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Amount ({currency})</label>
                <input
                  type="number"
                  required
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Due Date</label>
                <input
                  type="date"
                  required
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 outline-none font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Late Charges ({currency})</label>
              <input
                type="number"
                placeholder="e.g. 850"
                value={lateCharges}
                onChange={(e) => setLateCharges(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 outline-none font-semibold text-rose-700 dark:text-rose-400"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="recurring"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded border-slate-300 dark:border-slate-700 focus:ring-indigo-500"
              />
              <label htmlFor="recurring" className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1 cursor-pointer">
                <Repeat className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> Repeat Monthly (Variable Baseline)
              </label>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Notes</label>
              <input
                type="text"
                placeholder="e.g. Variable bill tracker"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-xl text-xs transition shadow-sm cursor-pointer"
            >
              Add Bill Entry
            </button>
          </form>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 md:p-6 space-y-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-3 pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="relative w-full md:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search bills..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 outline-none"
                />
              </div>

              <div className="flex gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
                <button
                  onClick={() => setFilterStatus('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 cursor-pointer ${filterStatus === 'all' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilterStatus('pending')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 cursor-pointer ${filterStatus === 'pending' ? 'bg-amber-500 hover:bg-amber-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                >
                  Pending
                </button>
                <button
                  onClick={() => setFilterStatus('overdue')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 cursor-pointer ${filterStatus === 'overdue' ? 'bg-rose-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                >
                  Overdue
                </button>
                <button
                  onClick={() => setFilterStatus('paid')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 cursor-pointer ${filterStatus === 'paid' ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
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
                      className={`p-3.5 md:p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition ${
                        b.status === 'Paid'
                          ? 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'
                          : isOverdue
                          ? 'bg-rose-50/40 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50 shadow-xs'
                          : 'bg-white dark:bg-slate-900 border-amber-200 dark:border-amber-900/50 shadow-xs'
                      }`}
                    >
                      <div className="space-y-1 w-full sm:w-auto pr-0 sm:pr-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-800 dark:text-white text-sm">{b.title}</span>
                          <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-md font-medium">
                            {b.category || 'Utilities & Bills'}
                          </span>
                          {b.is_recurring && (
                            <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-md font-medium flex items-center gap-1">
                              <Repeat className="w-3 h-3" /> Variable Recurring
                            </span>
                          )}
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                              b.status === 'Paid'
                                ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                                : isOverdue
                                ? 'bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 font-bold'
                                : 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300'
                            }`}
                          >
                            {b.status === 'Paid' ? 'Paid' : isOverdue ? 'Overdue' : 'Pending'}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                          <span className="flex items-center gap-1 font-mono">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" /> Due: {formatDateDisplay(b.due_date)}
                          </span>
                          {lateFee > 0 && b.status === 'Pending' && (
                            <span className="text-rose-600 dark:text-rose-400 font-medium">Late Fee: {formatCurrency(lateFee, currency)}</span>
                          )}
                          {b.notes && (
                            <span className="text-slate-600 dark:text-slate-400 italic">• {b.notes}</span>
                          )}
                        </div>
                      </div>

                      <div className="w-full sm:w-auto flex sm:flex-col items-center sm:items-end justify-between sm:justify-start pt-2 sm:pt-0 border-t sm:border-0 border-slate-100 dark:border-slate-800 gap-2 shrink-0">
                        <div>
                          <p className={`text-base font-bold whitespace-nowrap ${isOverdue ? 'text-rose-700 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>
                            {formatCurrency(effectiveAmount, currency)}
                          </p>
                        </div>

                        <div className="flex items-center justify-end gap-1.5">
                          {b.status === 'Pending' && (
                            <>
                              <button
                                onClick={() => handleOpenMarkPaidModal(b)}
                                className="text-[11px] text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white font-medium px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition cursor-pointer"
                              >
                                Mark Paid
                              </button>
                              {isCreditCardBill && (
                                <button
                                  onClick={() => handleOpenTransferModal(b)}
                                  className="text-[11px] text-white font-medium px-3 py-1 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition shadow-xs flex items-center gap-1 cursor-pointer"
                                >
                                  <CreditCard className="w-3.5 h-3.5" /> Transfer
                                </button>
                              )}
                            </>
                          )}
                          <button
                            onClick={() => handleOpenEditModal(b)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-lg transition cursor-pointer"
                            title="Edit Bill"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteBill(b)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition cursor-pointer"
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

      {/* Edit Bill Modal */}
      {editingBill && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-md w-full p-6 space-y-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Edit Bill Entry</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Modify bill details below.</p>
            </div>

            <form onSubmit={handleUpdateBill} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Bill Title</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Category</label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 outline-none font-medium cursor-pointer"
                >
                  <option value="Utilities & Bills">Utilities & Bills</option>
                  <option value="Housing & Shelter">Housing & Shelter</option>
                  <option value="Education">Education</option>
                  <option value="School Transport">School Transport</option>
                  <option value="Credit Card">Credit Card</option>
                  <option value="Memberships & Subscriptions">Memberships & Subscriptions</option>
                  <option value="Groceries & Food">Groceries & Food</option>
                  <option value="Vehicle Maintenance">Vehicle Maintenance</option>
                  <option value="Medical & Health">Medical & Health</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Amount ({currency})</label>
                  <input
                    type="number"
                    required
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 font-bold outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Due Date</label>
                  <input
                    type="date"
                    required
                    value={editDueDate}
                    onChange={(e) => setEditDueDate(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 outline-none font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Late Charges ({currency})</label>
                <input
                  type="number"
                  value={editLateCharges}
                  onChange={(e) => setEditLateCharges(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 outline-none font-semibold text-rose-700 dark:text-rose-400"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="editRecurring"
                  checked={editIsRecurring}
                  onChange={(e) => setEditIsRecurring(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 dark:border-slate-700 focus:ring-indigo-500"
                />
                <label htmlFor="editRecurring" className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1 cursor-pointer">
                  <Repeat className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> Repeat Monthly (Variable Baseline)
                </label>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Notes</label>
                <input
                  type="text"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 outline-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setEditingBill(null)} className="flex-1 py-2.5 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl cursor-pointer">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl cursor-pointer">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mark Paid Modal */}
      {payingBill && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-md w-full p-6 space-y-5">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Record Variable Bill Payment</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Enter actual received bill amount for <strong>{payingBill.title}</strong>.</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Actual Bill Amount ({currency})</label>
                <input
                  type="number"
                  required
                  value={actualPaidAmount}
                  onChange={(e) => handleActualAmountChange(e.target.value, 'markPaid')}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {payingBill.status === 'Pending' && todayStr && payingBill.due_date < todayStr && Number(payingBill.late_charges || 0) > 0 && (
                <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-200 dark:border-rose-900/50 text-xs text-rose-800 dark:text-rose-300 flex justify-between">
                  <span>Includes Overdue Late Fee:</span>
                  <span className="font-bold">{formatCurrency(Number(payingBill.late_charges || 0), currency)}</span>
                </div>
              )}

              <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl border border-indigo-100 dark:border-indigo-900/50 text-xs flex justify-between items-center">
                <span className="text-indigo-800 dark:text-indigo-300 font-semibold">Total Deduction:</span>
                <span className="font-bold text-indigo-950 dark:text-indigo-200 text-sm">{formatCurrency(payingTotalAmount, currency)}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Paid From Account</label>
              <select
                value={selectedAccount}
                onChange={(e) => setSelectedAccount(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 outline-none font-medium cursor-pointer"
              >
                {accounts.map((acc) => (
                  <option key={acc} value={acc}>{acc}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => setPayingBill(null)} className="flex-1 py-2.5 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl cursor-pointer">Cancel</button>
              <button onClick={handleConfirmMarkPaid} className="flex-1 py-2.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl cursor-pointer">Confirm Payment</button>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Modal */}
      {transferringBill && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-md w-full p-6 space-y-5">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Pay Statement via Transfer</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Enter statement amount for <strong>{transferringBill.title}</strong>.</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Actual Statement Amount ({currency})</label>
                <input
                  type="number"
                  required
                  value={actualTransferAmount}
                  onChange={(e) => handleActualAmountChange(e.target.value, 'transfer')}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl border border-indigo-100 dark:border-indigo-900/50 text-xs flex justify-between items-center">
                <span className="text-indigo-800 dark:text-indigo-300 font-semibold">Total Transfer:</span>
                <span className="font-bold text-indigo-950 dark:text-indigo-200 text-sm">{formatCurrency(transferTotalAmount, currency)}</span>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Pay From (Source Account)</label>
                <select
                  value={sourceAccount}
                  onChange={(e) => setSourceAccount(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 outline-none font-medium cursor-pointer"
                >
                  {accounts.map((acc) => (
                    <option key={acc} value={acc}>{acc}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Transfer To (Credit Card)</label>
                <select
                  value={targetAccount}
                  onChange={(e) => setTargetAccount(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 outline-none font-medium cursor-pointer"
                >
                  {accounts.map((acc) => (
                    <option key={acc} value={acc}>{acc}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => setTransferringBill(null)} className="flex-1 py-2.5 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl cursor-pointer">Cancel</button>
              <button onClick={handlePayNowAndTransfer} className="flex-1 py-2.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl cursor-pointer">Confirm Transfer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}