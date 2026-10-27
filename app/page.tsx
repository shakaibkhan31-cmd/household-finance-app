'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  PlusCircle, 
  Wallet, 
  ArrowDownCircle, 
  ArrowUpCircle,
  RefreshCw, 
  CreditCard, 
  Receipt, 
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Clock,
  ArrowRight,
  Calendar,
  Filter
} from 'lucide-react';
import Link from 'next/link';

interface Account {
  id: string;
  name: string;
  type: string;
  current_balance: number;
}

interface Bill {
  id: string;
  provider: string;
  due_date: string;
  amount?: number;
  bill_amount?: number;
  status: string;
}

interface Transaction {
  id: string;
  date: string;
  type: string;
  amount: number;
  description: string;
  account_name: string;
}

export default function FinanceDashboard() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);

  // Date Filter States
  const [filterMode, setFilterMode] = useState<'month' | 'year' | 'custom'>('month');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  // Quick Add Form States
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('Expense');
  const [description, setDescription] = useState('');
  const [enteredBy, setEnteredBy] = useState('Husband');
  const [selectedAccount, setSelectedAccount] = useState('');

  const fetchData = async () => {
    setLoading(true);

    const { data: accData } = await supabase.from('accounts').select('*').order('name', { ascending: true });
    if (accData && accData.length > 0) {
      setAccounts(accData);
      if (!selectedAccount) setSelectedAccount(accData[0].name);
    }

    const { data: txData } = await supabase.from('transactions').select('*').order('date', { ascending: false });
    if (txData) setTransactions(txData);

    const { data: billData } = await supabase
      .from('bills')
      .select('*')
      .eq('status', 'Pending')
      .order('due_date', { ascending: true })
      .limit(3);

    if (billData) setBills(billData);

    setLoading(false);
  };

  useEffect(() => {
    const now = new Date();
    setSelectedMonth(now.toISOString().slice(0, 7));
    setSelectedYear(now.getFullYear().toString());
    fetchData();
  }, []);

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !description || !selectedAccount) {
      return alert('Amount, Description aur Account sab zaroori hain!');
    }

    setLoading(true);
    const { error } = await supabase.from('transactions').insert([
      {
        type,
        amount: parseFloat(amount),
        description,
        entered_by: enteredBy,
        account_name: selectedAccount,
        date: new Date().toISOString().split('T')[0],
      },
    ]);

    if (error) {
      alert('Error: ' + error.message);
    } else {
      setAmount('');
      setDescription('');
      fetchData();
    }
    setLoading(false);
  };

  const handlePayBill = async (bill: Bill) => {
    if (!selectedAccount) return alert('Pehle ek Account select karein!');
    const billAmt = Number(bill.amount ?? bill.bill_amount ?? 0);
    if (!confirm(`${bill.provider} ka PKR ${billAmt.toLocaleString()} bill paid mark karein?`)) return;

    setLoading(true);
    await supabase.from('bills').update({ status: 'Paid' }).eq('id', bill.id);

    await supabase.from('transactions').insert([
      {
        type: 'Expense',
        amount: billAmt,
        description: `Bill Payment: ${bill.provider}`,
        entered_by: 'System',
        account_name: selectedAccount,
        date: new Date().toISOString().split('T')[0],
      },
    ]);

    fetchData();
  };

  // Robust filtering of transactions
  const filteredTransactions = transactions.filter((tx) => {
    if (!tx.date) return false;
    const txDateStr = tx.date.split('T')[0]; // Handle timestamps if any

    if (filterMode === 'month') {
      return selectedMonth ? txDateStr.startsWith(selectedMonth) : true;
    } else if (filterMode === 'year') {
      return selectedYear ? txDateStr.startsWith(selectedYear) : true;
    } else if (filterMode === 'custom') {
      if (!customStart || !customEnd) return true;
      return txDateStr >= customStart && txDateStr <= customEnd;
    }
    return true;
  });

  const totalAvailableCash = accounts.reduce((acc, a) => acc + Number(a.current_balance || 0), 0);
  
  const filteredIncome = filteredTransactions
    .filter((t) => {
      const tType = (t.type || '').toUpperCase();
      return tType === 'INCOME' || tType === 'INCOME';
    })
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const filteredExpense = filteredTransactions
    .filter((t) => {
      const tType = (t.type || '').toUpperCase();
      return tType === 'EXPENSE' || tType === 'EXPENSE';
    })
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8 text-slate-800 dark:text-slate-100 transition-colors">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-800 gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Executive Dashboard</h1>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 font-medium">Overview of liquid assets, filtered cash flows, and urgent payables</p>
          </div>
          <button
            onClick={fetchData}
            className="flex items-center gap-2 text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-4 py-2.5 rounded-xl transition border border-slate-200 dark:border-slate-700"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Data
          </button>
        </div>

        {/* Date Filter Bar */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-indigo-500 mr-1" />
            <button
              onClick={() => setFilterMode('month')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                filterMode === 'month' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              Month-wise
            </button>
            <button
              onClick={() => setFilterMode('year')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                filterMode === 'year' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              Year-wise
            </button>
            <button
              onClick={() => setFilterMode('custom')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                filterMode === 'custom' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              Custom Dates
            </button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {filterMode === 'month' && (
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 outline-none font-medium"
              />
            )}
            {filterMode === 'year' && (
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 outline-none font-medium"
              >
                <option value="2026">2026</option>
                <option value="2025">2025</option>
                <option value="2024">2024</option>
              </select>
            )}
            {filterMode === 'custom' && (
              <div className="flex items-center gap-1.5">
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 outline-none"
                />
                <span className="text-xs text-slate-400">to</span>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 outline-none"
                />
              </div>
            )}
          </div>
        </div>

        {/* Executive Metrics Overview (Filtered) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">Total Liquidity</span>
              <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl">
                <Wallet className="w-5 h-5" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-3">
              PKR {totalAvailableCash.toLocaleString()}
            </h3>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-2 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> Across {accounts.length} Wallets/Banks
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">Filtered Inflow</span>
              <div className="p-2.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl">
                <ArrowUpCircle className="w-5 h-5" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-3">
              PKR {filteredIncome.toLocaleString()}
            </h3>
            <p className="text-[11px] text-slate-400 font-medium mt-2">Selected Period Income</p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">Filtered Outflow</span>
              <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-xl">
                <ArrowDownCircle className="w-5 h-5" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-3">
              PKR {filteredExpense.toLocaleString()}
            </h3>
            <p className="text-[11px] text-rose-500 font-medium mt-2 flex items-center gap-1">
              <TrendingDown className="w-3.5 h-3.5" /> Selected Period Expense
            </p>
          </div>
        </div>

        {/* Two Column Layout: Accounts & Quick Actions vs Pending Bills */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left 2 Cols: Accounts & Quick Form */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Accounts Portfolio Cards */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-indigo-500" /> Active Accounts Summary
                </h3>
                <Link href="/accounts" className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1">
                  Manage <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {accounts.map((acc) => (
                  <div key={acc.id} className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 flex justify-between items-center">
                    <div>
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">{acc.name}</p>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mt-0.5">{acc.type || 'Bank'}</p>
                    </div>
                    <p className="text-base font-bold text-slate-900 dark:text-white">
                      PKR {Number(acc.current_balance || 0).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Transaction Form */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <PlusCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> Quick Transaction Entry
              </h3>

              <form onSubmit={handleAddTransaction} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 outline-none font-medium"
                  >
                    <option value="Expense">Expense</option>
                    <option value="Income">Income</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Account</label>
                  <select
                    value={selectedAccount}
                    onChange={(e) => setSelectedAccount(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 outline-none font-medium"
                  >
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.name}>
                        {acc.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Amount (PKR)</label>
                  <input
                    type="number"
                    placeholder="0.00"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 outline-none font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
                  <input
                    type="text"
                    placeholder="e.g. Grocery / Fuel"
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 outline-none"
                  />
                </div>

                <div className="sm:col-span-2 pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-xl transition text-xs shadow-sm"
                  >
                    {loading ? 'Processing...' : 'Save Quick Entry'}
                  </button>
                </div>
              </form>
            </div>

          </div>

          {/* Right Col: Urgent Pending Bills */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4 h-fit">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Receipt className="w-5 h-5 text-amber-500" /> Urgent Bills Due
              </h2>
              <Link href="/bills" className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1">
                View All <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {bills.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">No pending bills right now.</p>
            ) : (
              <div className="space-y-3">
                {bills.map((bill) => {
                  const billAmt = Number(bill.amount ?? bill.bill_amount ?? 0);
                  return (
                    <div key={bill.id} className="p-3.5 rounded-xl border bg-amber-50/40 dark:bg-amber-950/20 border-amber-200/80 dark:border-amber-900/40 space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-slate-800 dark:text-white text-xs">{bill.provider}</h4>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">Due: {bill.due_date}</p>
                        </div>
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300">
                          Due
                        </span>
                      </div>

                      <div className="flex justify-between items-center pt-1">
                        <span className="text-sm font-bold text-slate-900 dark:text-white">PKR {billAmt.toLocaleString()}</span>
                        <button
                          onClick={() => handlePayBill(bill)}
                          className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold px-2.5 py-1 rounded-lg transition shadow-xs"
                        >
                          <CheckCircle className="w-3 h-3" /> Pay
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

      </div>
    </main>
  );
}