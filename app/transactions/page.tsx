'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Search, Plus, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

export interface Transaction {
  id: string;
  date: string;
  type: string;
  account_name: string;
  category: string;
  amount: number;
  payment_method: string;
  party_name: string;
  description: string;
  entered_by: string;
  created_at?: string;
}

const TRANSACTION_TYPES = [
  'Expense',
  'Income Receipt',
  'Transfer',
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
  'Loan / Debt Related',
  'Other / Misc'
];

const PAYMENT_METHODS = ['Cash', 'Bank Transfer', 'Debit / Credit Card', 'Digital Wallet'];

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [availableAccounts, setAvailableAccounts] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Form State
  const [type, setType] = useState<string>('Expense');
  const [accountName, setAccountName] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS[0]);
  const [partyName, setPartyName] = useState('');
  const [description, setDescription] = useState('');
  const [enteredBy, setEnteredBy] = useState('Husband');
  const [date, setDate] = useState('');

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedAccount, setSelectedAccount] = useState('All');
  const [selectedType, setSelectedType] = useState('All');

  useEffect(() => {
    setDate(new Date().toISOString().split('T')[0]);
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
      setAccountName(fetchedAccountNames[0]);
    } else {
      setAvailableAccounts([]);
      setAccountName('');
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

  // Add Transaction
  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !accountName) {
      alert('Please select an account and enter an amount.');
      return;
    }

    const parsedAmount = parseFloat(amount);

    const { error } = await supabase.from('transactions').insert([
      {
        date,
        type,
        account_name: accountName,
        category,
        amount: parsedAmount,
        payment_method: paymentMethod,
        party_name: partyName,
        description,
        entered_by: enteredBy,
      },
    ]);

    if (error) {
      alert('Error recording transaction: ' + error.message);
    } else {
      setDescription('');
      setAmount('');
      setPartyName('');
      fetchTransactionsAndAccounts();
    }
  };

  // Filtered List Logic
  const filteredTransactions = transactions.filter((t) => {
    const matchesSearch = 
      t.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.party_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.account_name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = selectedCategory === 'All' || t.category === selectedCategory;
    const matchesAccount = selectedAccount === 'All' || t.account_name === selectedAccount;
    const matchesType = selectedType === 'All' || t.type === selectedType;

    return matchesSearch && matchesCategory && matchesAccount && matchesType;
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Transactions Ledger</h1>
        <p className="text-sm text-slate-500 mt-1">Excel-style detailed records, payment modes, and party trails</p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Transaction Entry Form */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-fit space-y-5">
          <h2 className="text-base font-semibold text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
            <Plus className="w-5 h-5 text-indigo-600" />
            New Ledger Entry
          </h2>

          {availableAccounts.length === 0 ? (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 space-y-2">
              <p className="font-semibold">No Accounts Found!</p>
              <p>Please go to the <strong>Accounts</strong> page from the sidebar and add your first bank account or wallet before recording transactions.</p>
            </div>
          ) : (
            <form onSubmit={handleAddTransaction} className="space-y-4">
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
                    onChange={(e) => setType(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-indigo-900"
                  >
                    {TRANSACTION_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Account Dropdown (Dynamic from Database) */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Account</label>
                <select
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  {availableAccounts.map((acc) => (
                    <option key={acc} value={acc}>{acc}</option>
                  ))}
                </select>
              </div>

              {/* Category & Amount */}
              <div className="grid grid-cols-2 gap-3">
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
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Paid to / Received From</label>
                <input
                  type="text"
                  placeholder="e.g. Imtiaz Super Market / Electric Co / Person Name"
                  value={partyName}
                  onChange={(e) => setPartyName(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              {/* Payment Method & Entered By */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    {PAYMENT_METHODS.map((pm) => (
                      <option key={pm} value={pm}>{pm}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Entered By</label>
                  <select
                    value={enteredBy}
                    onChange={(e) => setEnteredBy(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="Husband">Husband</option>
                    <option value="Wife">Wife</option>
                  </select>
                </div>
              </div>

              {/* Description / Notes */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Description / Remarks</label>
                <input
                  type="text"
                  placeholder="e.g. Monthly Grocery items & household supplies"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-xl text-xs transition shadow-sm mt-2"
              >
                Record Transaction
              </button>
            </form>
          )}
        </div>

        {/* Right Column: Ledger Table & Filters */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Search & Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3">
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

          {/* Transactions Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-[11px] font-semibold text-slate-500 border-b border-slate-200 uppercase tracking-wider">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Type & Category</th>
                    <th className="py-3 px-4">Party / Note</th>
                    <th className="py-3 px-4">Account & Method</th>
                    <th className="py-3 px-4 text-right">Amount</th>
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
                            <p className="font-medium text-slate-700">{t.name || t.account_name}</p>
                            <p className="text-[10px] text-slate-400">{t.payment_method}</p>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className={`font-bold flex items-center justify-end gap-1 text-sm ${
                              isCredit ? 'text-emerald-600' : 'text-slate-800'
                            }`}>
                              {isCredit ? (
                                <ArrowDownLeft className="w-4 h-4 text-emerald-500" />
                              ) : (
                                <ArrowUpRight className="w-4 h-4 text-rose-500" />
                              )}
                              PKR {Number(t.amount).toLocaleString()}
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