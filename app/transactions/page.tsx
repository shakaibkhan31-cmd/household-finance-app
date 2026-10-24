'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Search, Plus, ArrowUpRight, ArrowDownLeft, Trash2, Edit3, X, ArrowRightLeft, Calendar } from 'lucide-react';

export interface Transaction {
  id: string;
  date: string;
  type: string;
  account_name: string;
  transfer_to?: string;
  category: string;
  amount: number;
  party_name: string;
  description: string;
  entered_by: string;
  created_at?: string;
}

const TRANSACTION_TYPES = [
  'Expense',
  'Income Receipt',
  'Transfer',
  'Loan Given',
  'Loan Received',
  'Loan Repayment',
  'Refund',
  'Adjustment',
  'Bill Payment'
];

const CATEGORIES = [
  'Groceries & Food',
  'Utilities & Bills',
  'Rent & Housing',
  'Vehicle & Fuel',
  'Healthcare & Medical',
  'Education',
  'Shopping & Personal',
  'Entertainment & Dining',
  'Maintenance & Repairs',
  'Salary / Business Income',
  'Support / Gift',
  'Donation / Charity',
  'Loan / Debt Related',
  'Other / Misc'
];

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [availableAccounts, setAvailableAccounts] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [type, setType] = useState<string>('Expense');
  const [accountName, setAccountName] = useState('');
  const [transferTo, setTransferTo] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [amount, setAmount] = useState('');
  const [partyName, setPartyName] = useState('');
  const [description, setDescription] = useState('');
  const [enteredBy, setEnteredBy] = useState('Husband');
  const [date, setDate] = useState('');
  const [dueDate, setDueDate] = useState('');

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedAccount, setSelectedAccount] = useState('All');
  const [selectedType, setSelectedType] = useState('All');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setDate(today);
    setDueDate(today);
    fetchTransactionsAndAccounts();
  }, []);

  // Fetch Accounts strictly from Supabase 'accounts' table & Transactions
  const fetchTransactionsAndAccounts = async () => {
    setLoading(true);
    
    // 1. Fetch real accounts from Supabase
    const { data: accData, error: accError } = await supabase.from('accounts').select('name');
    if (accError) {
      console.error('Error fetching accounts:', accError.message);
    } else if (accData && accData.length > 0) {
      const fetchedAccountNames = accData.map((a: { name: string }) => a.name);
      setAvailableAccounts(fetchedAccountNames);
      
      const firstAcc = fetchedAccountNames[0];
      if (!accountName) setAccountName(firstAcc);
      
      if (!transferTo) {
        const differentAcc = fetchedAccountNames.find(acc => acc !== (accountName || firstAcc));
        setTransferTo(differentAcc || firstAcc);
      }
    } else {
      setAvailableAccounts([]);
      setAccountName('');
      setTransferTo('');
    }

    // 2. Fetch transactions
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching transactions:', error.message);
    } else {
      setTransactions(data || []);
    }
    setLoading(false);
  };

  // Add or Update Transaction
  const handleSaveTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !accountName) {
      alert('Please select an account and enter an amount.');
      return;
    }

    const parsedAmount = parseFloat(amount);
    const isTransfer = type === 'Transfer';

    if (isTransfer && accountName === transferTo) {
      alert('Source and Destination accounts cannot be the same for a transfer.');
      return;
    }

    if (editingId) {
      // UPDATE TRANSACTION
      const { error } = await supabase
        .from('transactions')
        .update({
          date,
          type,
          account_name: accountName,
          transfer_to: isTransfer ? transferTo : null,
          category: isTransfer ? 'Internal Transfer' : category,
          amount: parsedAmount,
          party_name: isTransfer ? 'Self Transfer' : partyName,
          description,
          entered_by: enteredBy,
        })
        .eq('id', editingId);

      if (error) {
        alert('Error updating transaction: ' + error.message);
        return;
      }
      setEditingId(null);
    } else {
      // INSERT TRANSACTION
      const { error } = await supabase.from('transactions').insert([
        {
          date,
          type,
          account_name: accountName,
          transfer_to: isTransfer ? transferTo : null,
          category: isTransfer ? 'Internal Transfer' : category,
          amount: parsedAmount,
          party_name: isTransfer ? 'Self Transfer' : partyName,
          description,
          entered_by: enteredBy,
        },
      ]);

      if (error) {
        alert('Error recording transaction: ' + error.message);
        return;
      }

      // AUTO-UPDATE ACCOUNT BALANCES
      if (isTransfer) {
        const { data: srcAcc } = await supabase.from('accounts').select('*').eq('name', accountName).limit(1);
        if (srcAcc && srcAcc.length > 0) {
          const newBal = Number(srcAcc[0].current_balance || 0) - parsedAmount;
          await supabase.from('accounts').update({ current_balance: newBal }).eq('id', srcAcc[0].id);
        }

        const { data: destAcc } = await supabase.from('accounts').select('*').eq('name', transferTo).limit(1);
        if (destAcc && destAcc.length > 0) {
          const newBal = Number(destAcc[0].current_balance || 0) + parsedAmount;
          await supabase.from('accounts').update({ current_balance: newBal }).eq('id', destAcc[0].id);
        }
      } else {
        const { data: accList } = await supabase.from('accounts').select('*').eq('name', accountName).limit(1);
        if (accList && accList.length > 0) {
          const acc = accList[0];
          let currentBal = Number(acc.current_balance || 0);
          
          const isCredit = ['Income Receipt', 'Loan Received', 'Refund'].includes(type);

          if (isCredit) {
            currentBal += parsedAmount;
          } else {
            currentBal -= parsedAmount;
          }

          await supabase.from('accounts').update({ current_balance: currentBal }).eq('id', acc.id);
        }
      }

      // AUTO-SYNC WITH DEBTS TABLE WITH CUSTOM DUE DATE
      if (type === 'Loan Given') {
        const { error: debtErr } = await supabase.from('debts').insert([
          {
            person_name: partyName || 'Unknown Party',
            type: 'Personal Loan',
            direction: 'Given (Receivable)',
            amount: parsedAmount,
            due_date: dueDate || date,
            status: 'Active',
            notes: description || `Loan Given via ${accountName}`,
          },
        ]);
        if (debtErr) alert('Error syncing with Debts table: ' + debtErr.message);
      } else if (type === 'Loan Received') {
        const { error: debtErr } = await supabase.from('debts').insert([
          {
            person_name: partyName || 'Unknown Party',
            type: 'Personal Loan',
            direction: 'Taken (Payable)',
            amount: parsedAmount,
            due_date: dueDate || date,
            status: 'Active',
            notes: description || `Loan Received in ${accountName}`,
          },
        ]);
        if (debtErr) alert('Error syncing with Debts table: ' + debtErr.message);
      } else if (type === 'Loan Repayment') {
        const { data: activeDebts } = await supabase
          .from('debts')
          .select('*')
          .eq('status', 'Active')
          .limit(1);

        if (activeDebts && activeDebts.length > 0) {
          const targetDebt = activeDebts[0];
          const updatedAmount = Math.max(0, Number(targetDebt.amount) - parsedAmount);
          await supabase
            .from('debts')
            .update({ 
              amount: updatedAmount,
              status: updatedAmount === 0 ? 'Settled' : 'Active'
            })
            .eq('id', targetDebt.id);
        }
      }

      // AUTO-SYNC WITH DEBTS IF ACCOUNT IS CREDIT CARD
      if (accountName.toLowerCase().includes('credit card') && !isTransfer) {
        const { data: existingDebts } = await supabase
          .from('debts')
          .select('*')
          .eq('type', 'Credit Card')
          .eq('status', 'Active')
          .limit(1);

        if (existingDebts && existingDebts.length > 0) {
          const cardDebt = existingDebts[0];
          const newTotal = Number(cardDebt.amount) + parsedAmount;
          await supabase.from('debts').update({ amount: newTotal }).eq('id', cardDebt.id);
        } else {
          await supabase.from('debts').insert([
            {
              person_name: 'Credit Card Outstanding',
              type: 'Credit Card',
              direction: 'Taken (Payable)',
              amount: parsedAmount,
              due_date: date,
              status: 'Active',
              notes: `Auto-created from Transaction: ${description || category}`,
            },
          ]);
        }
      }
    }

    // Reset Form
    resetForm();
    fetchTransactionsAndAccounts();
  };

  // Edit Button Click
  const handleEditClick = (t: Transaction) => {
    setEditingId(t.id);
    setDate(t.date);
    setType(t.type);
    setAccountName(t.account_name);
    setTransferTo(t.transfer_to || availableAccounts.find(acc => acc !== t.account_name) || availableAccounts[0]);
    setCategory(t.category);
    setAmount(t.amount.toString());
    setPartyName(t.party_name || '');
    setDescription(t.description || '');
    setEnteredBy(t.entered_by || 'Husband');
  };

  // Delete Transaction
  const handleDeleteTransaction = async (id: string) => {
    if (!confirm('Kya aap waqai is transaction ko delete karna chahte hain?')) return;

    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (error) {
      alert('Error deleting transaction: ' + error.message);
    } else {
      fetchTransactionsAndAccounts();
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setAmount('');
    setPartyName('');
    setDescription('');
    const today = new Date().toISOString().split('T')[0];
    setDate(today);
    setDueDate(today);
  };

  const isTransferType = type === 'Transfer';
  const isLoanType = type === 'Loan Given' || type === 'Loan Received';

  // Filtered List Logic
  const filteredTransactions = transactions.filter((t) => {
    const matchesSearch = 
      t.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.party_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.account_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.transfer_to?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = selectedCategory === 'All' || t.category === selectedCategory;
    const matchesAccount = selectedAccount === 'All' || t.account_name === selectedAccount || t.transfer_to === selectedAccount;
    const matchesType = selectedType === 'All' || t.type === selectedType;

    const txDate = t.date;
    const matchesFromDate = !fromDate || txDate >= fromDate;
    const matchesToDate = !toDate || txDate <= toDate;

    return matchesSearch && matchesCategory && matchesAccount && matchesType && matchesFromDate && matchesToDate;
  });

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Transactions Ledger</h1>
        <p className="text-sm text-slate-500 mt-1">Excel-style detailed records, transfers, and party trails</p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Transaction Entry / Edit Form */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-fit space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-base font-semibold text-slate-800 flex items-center gap-2">
              <Plus className="w-5 h-5 text-indigo-600" />
              {editingId ? 'Edit Transaction' : 'New Ledger Entry'}
            </h2>
            {editingId && (
              <button onClick={resetForm} className="text-xs text-rose-600 font-medium flex items-center gap-1 hover:underline">
                <X className="w-3.5 h-3.5" /> Cancel
              </button>
            )}
          </div>

          {availableAccounts.length === 0 ? (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 space-y-2">
              <p className="font-semibold">No Accounts Found!</p>
              <p>Please go to the <strong>Accounts</strong> page from the sidebar and add your first bank account or wallet before recording transactions.</p>
            </div>
          ) : (
            <form onSubmit={handleSaveTransaction} className="space-y-4">
              {/* Date & Type Dropdown */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Transaction Type</label>
                  <select
                    value={type}
                    onChange={(e) => {
                      const newType = e.target.value;
                      setType(newType);
                      if (newType === 'Transfer' && transferTo === accountName) {
                        const diff = availableAccounts.find(acc => acc !== accountName);
                        if (diff) setTransferTo(diff);
                      }
                    }}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-indigo-900"
                  >
                    {TRANSACTION_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Account Dropdown */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  {isTransferType ? 'From Account (Source)' : 'Account'}
                </label>
                <select
                  value={accountName}
                  onChange={(e) => {
                    const newAcc = e.target.value;
                    setAccountName(newAcc);
                    if (newAcc === transferTo) {
                      const diff = availableAccounts.find(acc => acc !== newAcc);
                      if (diff) setTransferTo(diff);
                    }
                  }}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                >
                  {availableAccounts.map((acc) => (
                    <option key={acc} value={acc}>{acc}</option>
                  ))}
                </select>
              </div>

              {/* Conditionally show Transfer To field if type is Transfer */}
              {isTransferType && (
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Transfer To (Destination)</label>
                  <select
                    value={transferTo}
                    onChange={(e) => setTransferTo(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-indigo-700"
                  >
                    {availableAccounts
                      .filter((acc) => acc !== accountName)
                      .map((acc) => (
                        <option key={acc} value={acc}>{acc}</option>
                      ))}
                  </select>
                </div>
              )}

              {/* Category & Amount */}
              <div className={`grid ${isTransferType ? 'grid-cols-1' : 'grid-cols-2'} gap-3`}>
                {!isTransferType && (
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                )}

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
              </div>

              {/* Paid To / Received From Field (Hidden if Transfer) */}
              {!isTransferType && (
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Paid to / Received From</label>
                  <input
                    type="text"
                    placeholder="e.g. Imtiaz Super Market / Electric Co"
                    value={partyName}
                    onChange={(e) => setPartyName(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              )}

              {/* Conditionally show Due Date if Loan Given or Loan Received */}
              {isLoanType && (
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Loan Due Date</label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-indigo-900"
                  />
                </div>
              )}

              {/* Entered By */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Entered By</label>
                <select
                  value={enteredBy}
                  onChange={(e) => setEnteredBy(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="Husband">Husband</option>
                  <option value="Wife">Wife</option>
                </select>
              </div>

              {/* Description / Remarks */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Description / Remarks</label>
                <input
                  type="text"
                  placeholder="e.g. Monthly Grocery items"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-xl text-xs transition shadow-sm mt-2"
              >
                {editingId ? 'Update Transaction' : 'Record Transaction'}
              </button>
            </form>
          )}
        </div>

        {/* Right Column: Ledger Table & Filters */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Search & Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search by party, note, category, account..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-1 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="flex gap-2">
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-1 focus:ring-indigo-500 outline-none"
                >
                  <option value="All">All Types</option>
                  {TRANSACTION_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>

                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-1 focus:ring-indigo-500 outline-none"
                >
                  <option value="All">All Categories</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Date Range Filter Bar */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
              <Calendar className="w-4 h-4 text-indigo-600" />
              <span className="font-medium text-[11px] text-slate-500">Date Range:</span>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="px-2 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <span className="text-slate-400">to</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="px-2 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500"
              />
              {(fromDate || toDate) && (
                <button
                  onClick={() => { setFromDate(''); setToDate(''); }}
                  className="text-[11px] text-rose-600 hover:underline font-medium ml-auto"
                >
                  Clear Dates
                </button>
              )}
            </div>
          </div>

          {/* Transactions Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-[11px] font-semibold text-slate-500 border-b border-slate-200 uppercase tracking-wider">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Type & Category</th>
                    <th className="py-3 px-4">Party / Note</th>
                    <th className="py-3 px-4">Account</th>
                    <th className="py-3 px-4 text-right">Amount / Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-slate-400">Loading transactions...</td>
                    </tr>
                  ) : filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-slate-400">No transactions match your query.</td>
                    </tr>
                  ) : (
                    filteredTransactions.map((t) => {
                      const isCredit = ['Income Receipt', 'Loan Received', 'Refund'].includes(t.type);
                      const isTransferRow = t.type === 'Transfer';
                      return (
                        <tr key={t.id} className="hover:bg-slate-50/80 transition">
                          <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">{t.date}</td>
                          <td className="py-3.5 px-4">
                            <span className="font-semibold text-slate-800 text-[11px] block">{t.type}</span>
                            <span className="inline-block mt-0.5 text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium">
                              {t.category || 'General'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <p className="font-semibold text-indigo-900">{t.party_name || 'N/A'}</p>
                            <p className="text-[10px] text-slate-400">{t.description || '-'}</p>
                          </td>
                          <td className="py-3.5 px-4 text-slate-600">
                            {isTransferRow ? (
                              <div className="flex items-center gap-1 font-medium text-slate-700 bg-slate-100 px-2 py-1 rounded-lg w-fit">
                                <span>{t.account_name}</span>
                                <ArrowRightLeft className="w-3 h-3 text-indigo-600" />
                                <span>{t.transfer_to}</span>
                              </div>
                            ) : (
                              <span className="font-medium text-slate-700 bg-slate-100 px-2 py-1 rounded-lg">
                                {t.account_name}
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className={`font-bold flex items-center justify-end gap-1 text-sm ${
                              isCredit ? 'text-emerald-600' : isTransferRow ? 'text-indigo-600' : 'text-slate-800'
                            }`}>
                              {!isTransferRow && (
                                isCredit ? (
                                  <ArrowDownLeft className="w-4 h-4 text-emerald-500" />
                                ) : (
                                  <ArrowUpRight className="w-4 h-4 text-rose-500" />
                                )
                              )}
                              PKR {Number(t.amount).toLocaleString()}
                            </div>
                            <div className="flex items-center justify-end gap-2 mt-1.5">
                              <button
                                onClick={() => handleEditClick(t)}
                                className="text-[10px] text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-0.5 bg-indigo-50 px-2 py-0.5 rounded"
                              >
                                <Edit3 className="w-3 h-3" /> Edit
                              </button>
                              <button
                                onClick={() => handleDeleteTransaction(t.id)}
                                className="text-[10px] text-rose-600 hover:text-rose-800 font-medium flex items-center gap-0.5 bg-rose-50 px-2 py-0.5 rounded"
                              >
                                <Trash2 className="w-3 h-3" /> Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}