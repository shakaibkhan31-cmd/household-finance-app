'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Search, Plus, ArrowUpRight, ArrowDownLeft, Trash2, Edit3, X, ArrowRightLeft, Calendar, Download, CheckSquare, Square, ChevronLeft, ChevronRight } from 'lucide-react';

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

export interface Debt {
  id: string;
  person_name: string;
  direction: string;
  amount: number;
  type: string;
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

const DEFAULT_CATEGORIES = [
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
  'Misc',
  'Other'
];

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [availableAccounts, setAvailableAccounts] = useState<string[]>([]);
  const [activeDebts, setActiveDebts] = useState<Debt[]>([]);
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentMonthPrefix, setCurrentMonthPrefix] = useState<string>('');

  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [type, setType] = useState<string>('Expense');
  const [accountName, setAccountName] = useState('');
  const [transferTo, setTransferTo] = useState('');
  const [selectedDebtId, setSelectedDebtId] = useState('');
  const [category, setCategory] = useState(DEFAULT_CATEGORIES[0]);
  const [amount, setAmount] = useState('');
  const [partyName, setPartyName] = useState('');
  const [description, setDescription] = useState('');
  const [enteredBy, setEnteredBy] = useState('Husband');
  const [date, setDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [adjustmentDirection, setAdjustmentDirection] = useState<'add' | 'subtract'>('add');

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedAccount, setSelectedAccount] = useState('All');
  const [selectedType, setSelectedType] = useState('All');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Bulk Selection State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setDate(today);
    setDueDate(today);
    setCurrentMonthPrefix(today.slice(0, 7));
    fetchDataAndSync();
  }, []);

  // Fetch Accounts, Active Debts, Transactions, and Dynamic Categories from Budgets table
  const fetchDataAndSync = async () => {
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

    // 2. Fetch Categories dynamically from Budgets table
    const { data: bData } = await supabase.from('budgets').select('category');
    if (bData && bData.length > 0) {
      const budgetCats = bData.map((b: { category: string }) => b.category);
      const combinedCats = Array.from(new Set([...budgetCats, ...DEFAULT_CATEGORIES]));
      setCategories(combinedCats);
      if (!category) setCategory(combinedCats[0]);
    } else {
      setCategories(DEFAULT_CATEGORIES);
    }

    // 3. Fetch Active Debts for Repayment Dropdown
    const { data: debtsData } = await supabase
      .from('debts')
      .select('id, person_name, direction, amount, type')
      .eq('status', 'Active');

    if (debtsData && debtsData.length > 0) {
      setActiveDebts(debtsData);
      if (!selectedDebtId) setSelectedDebtId(debtsData[0].id);
    } else {
      setActiveDebts([]);
      setSelectedDebtId('');
    }

    // 4. Fetch transactions
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

  // Handle Transaction Type Change with Auto Category Mapping
  const handleTypeChange = (newType: string) => {
    setType(newType);

    if (newType === 'Transfer' && transferTo === accountName) {
      const diff = availableAccounts.find(acc => acc !== accountName);
      if (diff) setTransferTo(diff);
    }

    // Auto select categories based on transaction type
    if (['Loan Given', 'Loan Received', 'Loan Repayment'].includes(newType)) {
      setCategory('Loan / Debt Related');
    } else if (newType === 'Income Receipt') {
      setCategory('Salary / Business Income');
    } else if (newType === 'Bill Payment') {
      setCategory('Utilities & Bills');
    } else if (newType === 'Adjustment') {
      setCategory('Other');
    }
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
    const isRepayment = type === 'Loan Repayment';
    const isAdjustment = type === 'Adjustment';

    if (isTransfer && accountName === transferTo) {
      alert('Source and Destination accounts cannot be the same for a transfer.');
      return;
    }

    // Validation: Prevent overpaying loan on repayment
    if (isRepayment && selectedDebtId) {
      const targetDebt = activeDebts.find(d => d.id === selectedDebtId);
      if (targetDebt) {
        const debtMaxAmount = Number(targetDebt.amount);
        if (parsedAmount > debtMaxAmount) {
          alert(`Repayment amount cannot be greater than the outstanding loan balance of PKR ${debtMaxAmount.toLocaleString()}.`);
          return;
        }
      }
    }

    // Find party name automatically if Loan Repayment or Adjustment
    let finalPartyName = partyName;
    if (isRepayment && selectedDebtId) {
      const matchedDebt = activeDebts.find(d => d.id === selectedDebtId);
      if (matchedDebt) {
        finalPartyName = matchedDebt.person_name;
      }
    } else if (isAdjustment) {
      finalPartyName = partyName || `Balance Adjustment (${adjustmentDirection === 'add' ? 'Increase' : 'Decrease'})`;
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
          party_name: isTransfer ? 'Self Transfer' : finalPartyName,
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
          party_name: isTransfer ? 'Self Transfer' : finalPartyName,
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
          
          let isCredit = ['Income Receipt', 'Loan Received', 'Refund'].includes(type);

          if (isAdjustment) {
            isCredit = adjustmentDirection === 'add';
          }

          if (isCredit) {
            currentBal += parsedAmount;
          } else {
            currentBal -= parsedAmount;
          }

          await supabase.from('accounts').update({ current_balance: currentBal }).eq('id', acc.id);
        }
      }

      // AUTO-SYNC WITH DEBTS TABLE
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
      } else if (type === 'Loan Repayment' && selectedDebtId) {
        const targetDebt = activeDebts.find(d => d.id === selectedDebtId);
        if (targetDebt) {
          const updatedAmount = Math.max(0, Number(targetDebt.amount) - parsedAmount);
          const { error: updateErr } = await supabase
            .from('debts')
            .update({ 
              amount: updatedAmount,
              status: updatedAmount === 0 ? 'Settled' : 'Active'
            })
            .eq('id', targetDebt.id);

          if (updateErr) alert('Error updating Debt repayment: ' + updateErr.message);
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
    fetchDataAndSync();
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

  // Delete Transaction with Account Balance Reversal
  const handleDeleteTransaction = async (t: Transaction) => {
    if (!confirm('Kya aap waqai is transaction ko delete karna chahte hain? Account balance wapas adjust ho jayega.')) return;

    const txAmount = Number(t.amount);
    const isCredit = ['Income Receipt', 'Loan Received', 'Refund'].includes(t.type);
    const isTransfer = t.type === 'Transfer';

    if (isTransfer && t.transfer_to) {
      const { data: srcAcc } = await supabase.from('accounts').select('*').eq('name', t.account_name).limit(1);
      if (srcAcc && srcAcc.length > 0) {
        const restoredBal = Number(srcAcc[0].current_balance || 0) + txAmount;
        await supabase.from('accounts').update({ current_balance: restoredBal }).eq('id', srcAcc[0].id);
      }
      const { data: destAcc } = await supabase.from('accounts').select('*').eq('name', t.transfer_to).limit(1);
      if (destAcc && destAcc.length > 0) {
        const reducedBal = Number(destAcc[0].current_balance || 0) - txAmount;
        await supabase.from('accounts').update({ current_balance: reducedBal }).eq('id', destAcc[0].id);
      }
    } else {
      const { data: accList } = await supabase.from('accounts').select('*').eq('name', t.account_name).limit(1);
      if (accList && accList.length > 0) {
        const acc = accList[0];
        let currentBal = Number(acc.current_balance || 0);

        if (isCredit) {
          currentBal -= txAmount;
        } else {
          currentBal += txAmount;
        }

        await supabase.from('accounts').update({ current_balance: currentBal }).eq('id', acc.id);
      }
    }

    const { error } = await supabase.from('transactions').delete().eq('id', t.id);
    if (error) {
      alert('Error deleting transaction: ' + error.message);
    } else {
      fetchDataAndSync();
    }
  };

  // Bulk Delete Selected Transactions
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Kya aap waqai selected ${selectedIds.length} transactions ko delete karna chahte hain?`)) return;

    for (const id of selectedIds) {
      const t = transactions.find(item => item.id === id);
      if (t) {
        const txAmount = Number(t.amount);
        const isCredit = ['Income Receipt', 'Loan Received', 'Refund'].includes(t.type);
        const isTransfer = t.type === 'Transfer';

        if (isTransfer && t.transfer_to) {
          const { data: srcAcc } = await supabase.from('accounts').select('*').eq('name', t.account_name).limit(1);
          if (srcAcc && srcAcc.length > 0) {
            const restoredBal = Number(srcAcc[0].current_balance || 0) + txAmount;
            await supabase.from('accounts').update({ current_balance: restoredBal }).eq('id', srcAcc[0].id);
          }
          const { data: destAcc } = await supabase.from('accounts').select('*').eq('name', t.transfer_to).limit(1);
          if (destAcc && destAcc.length > 0) {
            const reducedBal = Number(destAcc[0].current_balance || 0) - txAmount;
            await supabase.from('accounts').update({ current_balance: reducedBal }).eq('id', destAcc[0].id);
          }
        } else {
          const { data: accList } = await supabase.from('accounts').select('*').eq('name', t.account_name).limit(1);
          if (accList && accList.length > 0) {
            const acc = accList[0];
            let currentBal = Number(acc.current_balance || 0);

            if (isCredit) {
              currentBal -= txAmount;
            } else {
              currentBal += txAmount;
            }

            await supabase.from('accounts').update({ current_balance: currentBal }).eq('id', acc.id);
          }
        }
      }
    }

    const { error } = await supabase.from('transactions').delete().in('id', selectedIds);
    if (error) {
      alert('Error performing bulk delete: ' + error.message);
    } else {
      setSelectedIds([]);
      fetchDataAndSync();
    }
  };

  // Export Filtered Transactions to CSV
  const exportToCSV = () => {
    const headers = ['Date', 'Type', 'Category', 'Party Name', 'Account', 'Transfer To', 'Amount (PKR)', 'Entered By', 'Description'];
    const rows = filteredTransactions.map(t => [
      t.date,
      t.type,
      t.category,
      `"${t.party_name || ''}"`,
      t.account_name,
      t.transfer_to || '',
      t.amount,
      t.entered_by || '',
      `"${t.description || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `transactions_ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
  const isRepaymentType = type === 'Loan Repayment';
  const isRefundType = type === 'Refund';
  const isAdjustmentType = type === 'Adjustment';

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

  // Monthly KPI Calculations
  const monthlyExpenses = currentMonthPrefix
    ? transactions
        .filter((t) => t.date && t.date.startsWith(currentMonthPrefix) && (t.type === 'Expense' || t.type === 'Bill Payment'))
        .reduce((sum, t) => sum + Number(t.amount), 0)
    : 0;

  const monthlyIncome = currentMonthPrefix
    ? transactions
        .filter((t) => t.date && t.date.startsWith(currentMonthPrefix) && (t.type === 'Income Receipt'))
        .reduce((sum, t) => sum + Number(t.amount), 0)
    : 0;

  // Pagination Logic
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage) || 1;
  const paginatedTransactions = filteredTransactions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const toggleSelectAll = () => {
    if (selectedIds.length === paginatedTransactions.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedTransactions.map(t => t.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header & Monthly KPI Summary */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Transactions Ledger</h1>
          <p className="text-sm text-slate-500 mt-1">Excel-style detailed records, transfers, and dynamically synced budget categories</p>
        </div>

        <div className="flex gap-3 w-full md:w-auto">
          <div className="bg-rose-50 border border-rose-200 p-3.5 rounded-2xl flex-1 md:w-40">
            <p className="text-[11px] font-semibold text-rose-800 uppercase tracking-wider">This Month Expense</p>
            <p className="text-lg font-bold text-rose-950 mt-0.5">PKR {monthlyExpenses.toLocaleString()}</p>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-2xl flex-1 md:w-40">
            <p className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider">This Month Income</p>
            <p className="text-lg font-bold text-emerald-950 mt-0.5">PKR {monthlyIncome.toLocaleString()}</p>
          </div>
        </div>
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
                    onChange={(e) => handleTypeChange(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-indigo-900"
                  >
                    {TRANSACTION_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Adjustment Mode Options */}
              {isAdjustmentType && (
                <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2">
                  <label className="block text-xs font-semibold text-amber-900">Adjustment Action</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setAdjustmentDirection('add')}
                      className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition ${
                        adjustmentDirection === 'add'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-white text-slate-700 border border-slate-200'
                      }`}
                    >
                      + Add Balance
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdjustmentDirection('subtract')}
                      className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition ${
                        adjustmentDirection === 'subtract'
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'bg-white text-slate-700 border border-slate-200'
                      }`}
                    >
                      - Deduct Balance
                    </button>
                  </div>
                </div>
              )}

              {/* Account Dropdown */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  {isTransferType ? 'From Account (Source)' : isRefundType ? 'Refund Deposited In' : 'Account'}
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

              {/* Conditionally show Select Debt for Repayment */}
              {isRepaymentType && (
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Select Loan to Repay</label>
                  {activeDebts.length === 0 ? (
                    <p className="text-xs text-rose-500 font-medium p-2 bg-rose-50 rounded-lg">No active loan records found in Debts & Kameti.</p>
                  ) : (
                    <select
                      value={selectedDebtId}
                      onChange={(e) => setSelectedDebtId(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs bg-amber-50 border border-amber-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none font-semibold text-amber-900"
                    >
                      {activeDebts.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.person_name} ({d.direction}) - PKR {Number(d.amount).toLocaleString()}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              {/* Category & Amount (Synced with Budgets) */}
              <div className={`grid ${isTransferType ? 'grid-cols-1' : 'grid-cols-2'} gap-3`}>
                {!isTransferType && (
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      {isRefundType ? 'Expense Category to Offset' : 'Category (Synced)'}
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                    >
                      {categories.map((cat) => (
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

              {/* Paid To / Received From Field */}
              {!isTransferType && !isRepaymentType && (
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    {isRefundType
                      ? 'Refunded By (Store / Merchant / Person)'
                      : isAdjustmentType
                      ? 'Adjustment Reason / Reference'
                      : 'Paid to / Received From'}
                  </label>
                  <input
                    type="text"
                    placeholder={
                      isRefundType
                        ? 'e.g. Imtiaz Super Market / Daraz'
                        : isAdjustmentType
                        ? 'e.g. Missing Cash Reconcile / ATM Mismatch'
                        : 'e.g. Imtiaz Super Market / Electric Co'
                    }
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
                  placeholder={
                    isRefundType
                      ? 'e.g. Returned defective item / Order cancellation'
                      : isAdjustmentType
                      ? 'e.g. Audited cash drawer mismatch'
                      : 'e.g. Monthly Grocery items'
                  }
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
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>

                <button
                  onClick={exportToCSV}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-medium flex items-center gap-1.5 transition shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" /> CSV
                </button>
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

            {/* Bulk Selection Banner */}
            {selectedIds.length > 0 && (
              <div className="flex items-center justify-between bg-indigo-50 border border-indigo-100 p-2.5 rounded-xl text-xs">
                <span className="font-semibold text-indigo-900">{selectedIds.length} transaction(s) selected</span>
                <button
                  onClick={handleBulkDelete}
                  className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white font-medium rounded-lg transition"
                >
                  Delete Selected
                </button>
              </div>
            )}
          </div>

          {/* Transactions Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-[11px] font-semibold text-slate-500 border-b border-slate-200 uppercase tracking-wider">
                    <th className="py-3 px-3 w-10 text-center">
                      <button onClick={toggleSelectAll}>
                        {selectedIds.length > 0 && selectedIds.length === paginatedTransactions.length ? (
                          <CheckSquare className="w-4 h-4 text-indigo-600" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-400" />
                        )}
                      </button>
                    </th>
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
                      <td colSpan={6} className="text-center py-8 text-slate-400">Loading transactions...</td>
                    </tr>
                  ) : paginatedTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-slate-400">No transactions match your query.</td>
                    </tr>
                  ) : (
                    paginatedTransactions.map((t) => {
                      const isCredit = ['Income Receipt', 'Loan Received', 'Refund'].includes(t.type);
                      const isTransferRow = t.type === 'Transfer';
                      const isSelected = selectedIds.includes(t.id);

                      return (
                        <tr key={t.id} className={`hover:bg-slate-50/80 transition ${isSelected ? 'bg-indigo-50/40' : ''}`}>
                          <td className="py-3.5 px-3 text-center">
                            <button onClick={() => toggleSelectOne(t.id)}>
                              {isSelected ? <CheckSquare className="w-4 h-4 text-indigo-600" /> : <Square className="w-4 h-4 text-slate-400" />}
                            </button>
                          </td>
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
                                onClick={() => handleDeleteTransaction(t)}
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

            {/* Pagination Controls Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
              <span>Showing page <strong>{currentPage}</strong> of <strong>{totalPages}</strong></span>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 bg-white border border-slate-200 rounded-lg disabled:opacity-50 flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" /> Previous
                </button>
                <button
                  onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 bg-white border border-slate-200 rounded-lg disabled:opacity-50 flex items-center gap-1"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}