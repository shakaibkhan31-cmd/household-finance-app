'use client';

import React, { useState, useEffect, Component, ErrorInfo, ReactNode } from 'react';
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
  Filter,
  X,
  AlertTriangle,
  Activity,
  PieChart
} from 'lucide-react';
import Link from 'next/link';

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean, error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Dashboard Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-center space-y-4">
          <h2 className="text-xl font-bold text-rose-600">Something went wrong on the Dashboard.</h2>
          <p className="text-xs text-slate-500 font-mono">{this.state.error?.message}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl cursor-pointer"
          >
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

interface Account {
  id: string;
  name?: string;
  account_name?: string;
  type?: string;
  account_type?: string;
  current_balance?: number;
  opening_balance?: number;
}

interface Bill {
  id: string;
  provider?: string;
  title?: string;
  bill_name?: string;
  name?: string;
  due_date?: string;
  amount?: number;
  bill_amount?: number;
  status?: string;
  payment_status?: string;
}

interface Transaction {
  id: string;
  date?: string;
  transaction_date?: string;
  type?: string;
  category?: string;
  amount: number;
  description: string;
  account_name?: string;
}

interface Budget {
  id: string;
  category?: string;
  name?: string;
  title?: string;
  allocated_amount?: number;
  amount?: number;
  budget_amount?: number;
  limit?: number;
  monthly_limit?: number;
  budget_limit?: number;
  spent_amount?: number;
}

export default function FinanceDashboard() {
  return (
    <ErrorBoundary>
      <DashboardContent />
    </ErrorBoundary>
  );
}

function DashboardContent() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Date Filter States
  const [filterMode, setFilterMode] = useState<'month' | 'year' | 'custom'>('month');
  const [selectedMonth, setSelectedMonth] = useState('2026-10');
  const [selectedYear, setSelectedYear] = useState('2026');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [todayStr, setTodayStr] = useState('2026-10-27');

  // Quick Add Form States
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('Expense');
  const [description, setDescription] = useState('');
  const [enteredBy, setEnteredBy] = useState('Husband');
  const [selectedAccount, setSelectedAccount] = useState('');

  // Bill Pay Modal States
  const [selectedBillToPay, setSelectedBillToPay] = useState<Bill | null>(null);
  const [paymentAccountId, setPaymentAccountId] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);

      const { data: accData, error: accErr } = await supabase.from('accounts').select('*');
      if (!accErr && accData && accData.length > 0) {
        setAccounts(accData);
        const firstAccName = accData[0]?.name || accData[0]?.account_name || '';
        if (!selectedAccount) setSelectedAccount(firstAccName);
        if (!paymentAccountId) setPaymentAccountId(firstAccName);
      }

      const { data: txData, error: txErr } = await supabase.from('transactions').select('*');
      if (!txErr && txData) setTransactions(txData);

      const { data: billData, error: billErr } = await supabase.from('bills').select('*');
      if (!billErr && billData) {
        const pendingBills = billData.filter(b => {
          const stat = (b?.status || b?.payment_status || '').toUpperCase();
          return stat === 'PENDING' || stat === 'UNPAID';
        });
        setBills(pendingBills);
      }

      const { data: budgetData, error: budgetErr } = await supabase.from('budgets').select('*');
      if (!budgetErr && budgetData && budgetData.length > 0) {
        console.log('Fetched Budgets from DB:', budgetData);
        setBudgets(budgetData);
      } else {
        setBudgets([
          { id: '1', category: 'Groceries & Food', allocated_amount: 15000, spent_amount: 15000 },
          { id: '2', category: 'Fuel & Transport', allocated_amount: 10000, spent_amount: 0 },
          { id: '3', category: 'Healthcare & Medical', allocated_amount: 8000, spent_amount: 0 },
          { id: '4', category: 'Education', allocated_amount: 25000, spent_amount: 0 },
          { id: '5', category: 'Utilities & Bills', allocated_amount: 15000, spent_amount: 10890 },
          { id: '6', category: 'Subscriptions', allocated_amount: 5000, spent_amount: 0 }
        ]);
      }

    } catch (err) {
      console.error('Fetch error caught:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setIsMounted(true);
    try {
      const now = new Date();
      setSelectedMonth(now.toISOString().slice(0, 7));
      setSelectedYear(now.getFullYear().toString());
      setTodayStr(now.toISOString().slice(0, 10));
    } catch (e) {
      // Fallback
    }
    fetchData();
  }, []);

  if (!isMounted) return null;

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !description || !selectedAccount) {
      return alert('Amount, Description aur Account sab zaroori hain!');
    }

    try {
      setLoading(true);
      const currentDate = new Date().toISOString().split('T')[0];
      const { error } = await supabase.from('transactions').insert([
        {
          type,
          amount: parseFloat(amount),
          description,
          entered_by: enteredBy,
          account_name: selectedAccount,
          date: currentDate,
          transaction_date: currentDate,
        },
      ]);

      if (error) {
        alert('Error: ' + error.message);
      } else {
        setAmount('');
        setDescription('');
        fetchData();
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPayBill = async () => {
    if (!selectedBillToPay) return;
    if (!paymentAccountId) return alert('Kripya Bill Pay karne ke liye ek account select karein!');

    try {
      setLoading(true);
      const currentDate = new Date().toISOString().split('T')[0];
      const billAmt = Number(selectedBillToPay.amount ?? selectedBillToPay.bill_amount ?? 0);
      const billProvider = selectedBillToPay.provider || selectedBillToPay.title || selectedBillToPay.bill_name || selectedBillToPay.name || 'Bill Payment';

      await supabase.from('bills').update({ status: 'Paid', payment_status: 'PAID' }).eq('id', selectedBillToPay.id);

      await supabase.from('transactions').insert([
        {
          type: 'Expense',
          amount: billAmt,
          description: `Bill Payment: ${billProvider}`,
          entered_by: 'System',
          account_name: paymentAccountId,
          date: currentDate,
          transaction_date: currentDate,
        },
      ]);

      setSelectedBillToPay(null);
      fetchData();
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Safe date filtering
  const filteredTransactions = transactions.filter((tx) => {
    if (!tx) return false;
    const txDate = (tx.date || tx.transaction_date || '').trim();
    if (!txDate) return false;
    const datePrefix = txDate.slice(0, 10);

    if (filterMode === 'month') {
      return selectedMonth ? datePrefix.startsWith(selectedMonth) : true;
    } else if (filterMode === 'year') {
      return selectedYear ? datePrefix.startsWith(selectedYear) : true;
    } else if (filterMode === 'custom') {
      if (!customStart || !customEnd) return true;
      return datePrefix >= customStart && datePrefix <= customEnd;
    }
    return true;
  });

  const totalAvailableCash = accounts.reduce((acc, a) => {
    const bal = a?.current_balance ?? a?.opening_balance ?? 0;
    return acc + Number(bal || 0);
  }, 0);
  
  const filteredIncome = filteredTransactions
    .filter((t) => {
      const tType = (t?.type || '').trim().toLowerCase();
      const tCat = (t?.category || '').trim().toLowerCase();
      return tType.includes('income') || tType.includes('deposit') || tType.includes('inflow') || tCat.includes('income');
    })
    .reduce((sum, t) => sum + Number(t?.amount || 0), 0);

  const filteredExpense = filteredTransactions
    .filter((t) => {
      const tType = (t?.type || '').trim().toLowerCase();
      return tType.includes('expense') || tType.includes('outflow') || tType.includes('bill');
    })
    .reduce((sum, t) => sum + Number(t?.amount || 0), 0);

  const urgentBillsCount = bills.filter(b => {
    if (!b || !b.due_date || !todayStr) return false;
    return b.due_date <= todayStr;
  }).length;

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8 text-slate-800 dark:text-slate-100 transition-colors relative">
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
          <div className="flex items-center gap-2">
            <button
              onClick={fetchData}
              className="flex items-center gap-2 text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-4 py-2.5 rounded-xl transition border border-slate-200 dark:border-slate-700 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Data
            </button>
          </div>
        </div>

        {/* Smart Notification Alert Banner */}
        {urgentBillsCount > 0 && (
          <div className="bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 p-4 rounded-2xl flex items-center justify-between text-xs font-medium shadow-xs">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
              <span><strong>Attention Required:</strong> You have {urgentBillsCount} urgent or overdue bill(s) pending payment commitment.</span>
            </div>
            <Link href="/bills" className="font-bold underline hover:text-amber-800 dark:hover:text-amber-300">
              Review Bills
            </Link>
          </div>
        )}

        {/* Date Filter Bar */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-indigo-500 mr-1" />
            <button
              onClick={() => setFilterMode('month')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                filterMode === 'month' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              Month-wise
            </button>
            <button
              onClick={() => setFilterMode('year')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                filterMode === 'year' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              Year-wise
            </button>
            <button
              onClick={() => setFilterMode('custom')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
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
              PKR {Number(totalAvailableCash || 0).toLocaleString()}
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
              PKR {Number(filteredIncome || 0).toLocaleString()}
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
              PKR {Number(filteredExpense || 0).toLocaleString()}
            </h3>
            <p className="text-[11px] text-rose-500 font-medium mt-2 flex items-center gap-1">
              <TrendingDown className="w-3.5 h-3.5" /> Selected Period Expense
            </p>
          </div>
        </div>

        {/* Cash Flow Trend Visual & Budget Progress Health */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-xs uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-500" /> Cash Flow Ratio (Inflow vs Outflow)
            </h3>
            
            <div className="space-y-3 pt-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-blue-600 dark:text-blue-400">Inflow: PKR {Number(filteredIncome || 0).toLocaleString()}</span>
                <span className="text-rose-600 dark:text-rose-400">Outflow: PKR {Number(filteredExpense || 0).toLocaleString()}</span>
              </div>
              
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-3.5 rounded-full overflow-hidden flex">
                <div 
                  className="bg-blue-500 h-full transition-all duration-500" 
                  style={{ width: `${filteredIncome + filteredExpense > 0 ? (filteredIncome / (filteredIncome + filteredExpense)) * 100 : 50}%` }}
                ></div>
                <div 
                  className="bg-rose-500 h-full transition-all duration-500" 
                  style={{ width: `${filteredIncome + filteredExpense > 0 ? (filteredExpense / (filteredIncome + filteredExpense)) * 100 : 50}%` }}
                ></div>
              </div>
              <p className="text-[11px] text-slate-400 text-center">Net Period Variance: PKR {Number((filteredIncome || 0) - (filteredExpense || 0)).toLocaleString()}</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider flex items-center gap-2">
                <PieChart className="w-4 h-4 text-emerald-500" /> Budget Health Thresholds
              </h3>
              <Link href="/budgets" className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
                View All
              </Link>
            </div>

            {budgets.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">No budgets configured yet.</p>
            ) : (
              <div className="space-y-3 max-h-32 overflow-y-auto pr-1">
                {budgets.map((b, idx) => {
                  const bName = b?.category || b?.name || b?.title || 'General';
                  
                  // Comprehensive check for all possible allocated budget column names in Supabase
                  const alloc = Number(
                    b?.allocated_amount ?? 
                    b?.amount ?? 
                    b?.budget_amount ?? 
                    b?.limit ?? 
                    b?.monthly_limit ?? 
                    b?.budget_limit ?? 
                    20000
                  );

                  // Calculate exact spent from transactions matching category name
                  const calcSpent = filteredTransactions
                    .filter(t => {
                      const tCat = (t?.category || '').toLowerCase();
                      const tDesc = (t?.description || '').toLowerCase();
                      const nameLower = bName.toLowerCase();
                      return tCat.includes(nameLower) || tDesc.includes(nameLower);
                    })
                    .reduce((sum, t) => sum + Number(t?.amount || 0), 0);

                  const spent = calcSpent > 0 ? calcSpent : Number(b?.spent_amount || 0);
                  const pct = alloc > 0 ? Math.min(Math.round((spent / alloc) * 100), 100) : 0;

                  return (
                    <div key={b.id || idx} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold text-slate-700 dark:text-slate-200">{bName}</span>
                        <span className="text-slate-400">PKR {spent.toLocaleString()} / {alloc.toLocaleString()}</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${pct > 80 ? 'bg-rose-500' : pct > 50 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                          style={{ width: `${pct}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <div className="lg:col-span-2 space-y-6">
            
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
                {accounts.map((acc) => {
                  const accName = acc?.name || acc?.account_name || 'Account';
                  const accType = acc?.type || acc?.account_type || 'Bank';
                  const accBal = Number(acc?.current_balance ?? acc?.opening_balance ?? 0);
                  return (
                    <div key={acc.id} className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 flex justify-between items-center">
                      <div>
                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">{accName}</p>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mt-0.5">{accType}</p>
                      </div>
                      <p className="text-base font-bold text-slate-900 dark:text-white">
                        PKR {accBal.toLocaleString()}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

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
                    {accounts.map((acc) => {
                      const accName = acc?.name || acc?.account_name || '';
                      return (
                        <option key={acc.id} value={accName}>
                          {accName}
                        </option>
                      );
                    })}
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
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-xl transition text-xs shadow-sm cursor-pointer"
                  >
                    {loading ? 'Processing...' : 'Save Quick Entry'}
                  </button>
                </div>
              </form>
            </div>

          </div>

          <div className="space-y-6">
            
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-amber-500" /> Urgent Bills Due
                </h2>
                <Link href="/bills" className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1">
                  View All <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              {bills.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">No pending bills right now.</p>
              ) : (
                <div className="space-y-3">
                  {bills.map((bill) => {
                    const billAmt = Number(bill?.amount ?? bill?.bill_amount ?? 0);
                    const providerName = bill?.provider || bill?.title || bill?.bill_name || bill?.name || 'Utility Bill';

                    return (
                      <div key={bill.id} className="p-3.5 rounded-xl border bg-amber-50/40 dark:bg-amber-950/20 border-amber-200/80 dark:border-amber-900/40 space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-bold text-slate-800 dark:text-white text-xs">{providerName}</h4>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">Due: {bill?.due_date}</p>
                          </div>
                          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300">
                            Due
                          </span>
                        </div>

                        <div className="flex justify-between items-center pt-1">
                          <span className="text-sm font-bold text-slate-900 dark:text-white">PKR {billAmt.toLocaleString()}</span>
                          <button
                            onClick={() => {
                              setSelectedBillToPay(bill);
                              if (accounts.length > 0) {
                                setPaymentAccountId(accounts[0]?.name || accounts[0]?.account_name || '');
                              }
                            }}
                            className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold px-2.5 py-1 rounded-lg transition shadow-xs cursor-pointer"
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

            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-indigo-500" /> Recent Activity Feed
                </h2>
                <Link href="/transactions" className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1">
                  Ledger <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              {transactions.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">No recent transactions.</p>
              ) : (
                <div className="space-y-3">
                  {transactions.slice(0, 4).map((tx) => {
                    const isIncome = (tx?.type || '').toLowerCase().includes('income') || (tx?.type || '').toLowerCase().includes('inflow');
                    return (
                      <div key={tx.id} className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
                        <div className="overflow-hidden pr-2">
                          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{tx?.description}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{tx?.date || tx?.transaction_date}</p>
                        </div>
                        <span className={`text-xs font-bold shrink-0 ${isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-800 dark:text-slate-200'}`}>
                          {isIncome ? '+' : '-'} PKR {Number(tx?.amount || 0).toLocaleString()}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

        </div>

      </div>

      {selectedBillToPay && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-500" /> Confirm Bill Payment
              </h3>
              <button
                onClick={() => setSelectedBillToPay(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl space-y-1.5 border border-slate-100 dark:border-slate-800">
              <p className="text-xs text-slate-500 dark:text-slate-400">Bill Provider</p>
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                {selectedBillToPay?.provider || selectedBillToPay?.title || selectedBillToPay?.bill_name || selectedBillToPay?.name || 'Utility Bill'}
              </p>
              
              <div className="flex justify-between items-center pt-2 border-t border-slate-200/60 dark:border-slate-700/60 mt-2">
                <span className="text-xs text-slate-500 dark:text-slate-400">Amount Due</span>
                <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                  PKR {Number(selectedBillToPay?.amount ?? selectedBillToPay?.bill_amount ?? 0).toLocaleString()}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Select Account to Pay From
              </label>
              <select
                value={paymentAccountId}
                onChange={(e) => setPaymentAccountId(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 outline-none font-medium"
              >
                {accounts.map((acc) => {
                  const accName = acc?.name || acc?.account_name || '';
                  const accBal = Number(acc?.current_balance ?? acc?.opening_balance ?? 0);
                  return (
                    <option key={acc.id} value={accName}>
                      {accName} (Bal: PKR {accBal.toLocaleString()})
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedBillToPay(null)}
                className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={handleConfirmPayBill}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition shadow-xs cursor-pointer"
              >
                {loading ? 'Processing...' : 'Confirm & Pay'}
              </button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}