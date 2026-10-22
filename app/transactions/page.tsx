'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Search, Filter, Plus, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

export interface Transaction {
  id: string;
  date: string;
  type: 'Expense' | 'Income' | 'Transfer';
  account_name: string;
  category: string;
  amount: number;
  payment_method: string;
  description: string;
  entered_by: string;
  created_at?: string;
}

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
  'Other / Misc'
];

const PAYMENT_METHODS = ['Cash', 'Bank Transfer', 'Debit / Credit Card', 'Digital Wallet'];

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Form State
  const [type, setType] = useState<'Expense' | 'Income'>('Expense');
  const [accountName, setAccountName] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS[0]);
  const [description, setDescription] = useState('');
  const [enteredBy, setEnteredBy] = useState('Husband');
  const [date, setDate] = useState('');

useEffect(() => {
  setDate(new Date().toISOString().split('T')[0]);
}, []);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedAccount, setSelectedAccount] = useState('All');

  // Fetch Transactions & Accounts
  const fetchTransactions = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching transactions:', error.message);
    } else {
      setTransactions(data || []);
      // Extract unique account names for filter dropdown
      const uniqueAccounts = Array.from(new Set((data || []).map((t: Transaction) => t.account_name)));
      setAccounts(uniqueAccounts as string[]);
      if (uniqueAccounts.length > 0 && !accountName) {
        setAccountName(uniqueAccounts[0] as string);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  // Add Transaction
  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !accountName) return;

    const parsedAmount = parseFloat(amount);

    const { error } = await supabase.from('transactions').insert([
      {
        date,
        type,
        account_name: accountName,
        category,
        amount: parsedAmount,
        payment_method: paymentMethod,
        description,
        entered_by: enteredBy,
      },
    ]);

    if (error) {
      alert('Error recording transaction: ' + error.message);
    } else {
      setDescription('');
      setAmount('');
      fetchTransactions();
    }
  };

  // Filtered List Logic
  const filteredTransactions = transactions.filter((t) => {
    const matchesSearch = 
      t.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.account_name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = selectedCategory === 'All' || t.category === selectedCategory;
    const matchesAccount = selectedAccount === 'All' || t.account_name === selectedAccount;

    return matchesSearch && matchesCategory && matchesAccount;
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Transactions Ledger</h1>
        <p className="text-sm text-slate-500 mt-1">Excel-style detailed records, categories, and audit trail</p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Transaction Entry Form */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-fit space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-base font-semibold text-slate-800 flex items-center gap-2">
              <Plus className="w-5 h-5 text-indigo-600" />
              New Entry
            </h2>
            <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setType('Expense')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                  type === 'Expense' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-600'
                }`}
              >
                Kharch
              </button>
              <button
                type="button"
                onClick={() => setType('Income')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                  type === 'Income' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600'
                }`}
              >
                Aamdani
              </button>
            </div>
          </div>

          <form onSubmit={handleAddTransaction} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Account / Bank</label>
              <input
                type="text"
                required
                placeholder="e.g. Meezan Bank / Cash Wallet"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
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
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  {PAYMENT_METHODS.map((pm) => (
                    <option key={pm} value={pm}>{pm}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Description / Item Detail</label>
              <input
                type="text"
                placeholder="e.g. Weekly Imtiaz Super Market Grocery"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Entered By</label>
              <select
                value={enteredBy}
                onChange={(e) => setEnteredBy(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="Husband">Husband</option>
                <option value="Wife">Wife</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-xl text-sm transition shadow-sm mt-2"
            >
              Record Transaction
            </button>
          </form>
        </div>

        {/* Right Column: Filters & Ledger Data Table */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Search & Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search by note, category, account..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-1 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div className="flex gap-2">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-1 focus:ring-indigo-500 outline-none"
              >
                <option value="All">All Categories</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              <select
                value={selectedAccount}
                onChange={(e) => setSelectedAccount(e.target.value)}
                className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-1 focus:ring-indigo-500 outline-none"
              >
                <option value="All">All Accounts</option>
                {accounts.map((acc) => (
                  <option key={acc} value={acc}>{acc}</option>
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
                    <th className="py-3 px-4">Detail & Category</th>
                    <th className="py-3 px-4">Account & Method</th>
                    <th className="py-3 px-4">By</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-slate-400">Loading ledger records...</td>
                    </tr>
                  ) : filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-slate-400">No transactions match your query.</td>
                    </tr>
                  ) : (
                    filteredTransactions.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3.5 px-4 text-slate-500 font-mono">{t.date}</td>
                        <td className="py-3.5 px-4">
                          <p className="font-semibold text-slate-800">{t.description || 'No Description'}</p>
                          <span className="inline-block mt-0.5 text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium">
                            {t.category || 'General'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">
                          <p className="font-medium text-slate-700">{t.account_name}</p>
                          <p className="text-[10px] text-slate-400">{t.payment_method}</p>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                            t.entered_by === 'Husband' ? 'bg-indigo-50 text-indigo-600' : 'bg-purple-50 text-purple-600'
                          }`}>
                            {t.entered_by}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className={`font-bold flex items-center justify-end gap-1 text-sm ${
                            t.type === 'Income' ? 'text-emerald-600' : 'text-slate-800'
                          }`}>
                            {t.type === 'Income' ? (
                              <ArrowDownLeft className="w-4 h-4 text-emerald-500" />
                            ) : (
                              <ArrowUpRight className="w-4 h-4 text-rose-500" />
                            )}
                            PKR {Number(t.amount).toLocaleString()}
                          </div>
                        </td>
                      </tr>
                    ))
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