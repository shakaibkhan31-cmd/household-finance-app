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
  Calendar,
  Search,
  ArrowUpRight,
  Filter,
  DollarSign,
  Clock
} from 'lucide-react';
import DebtsTracker from '@/components/DebtsTracker';

interface Account {
  id: string;
  name: string;
  type: string;
  current_balance: number;
}

interface Transaction {
  id: string;
  date: string;
  type: string;
  amount: number;
  description: string;
  entered_by: string;
  account_name: string;
}

interface Bill {
  id: string;
  provider: string;
  bill_type?: string;
  due_date: string;
  amount?: number;
  bill_amount?: number;
  status: string;
}

export default function FinanceDashboard() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchLedger, setSearchLedger] = useState('');
  const [filterType, setFilterType] = useState('All');

  // Form States
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

    const { data: txData } = await supabase
      .from('transactions')
      .select('*')
      .order('date', { ascending: false });

    if (txData) setTransactions(txData);

    const { data: billData } = await supabase
      .from('bills')
      .select('*')
      .order('due_date', { ascending: true });

    if (billData) setBills(billData);

    setLoading(false);
  };

  useEffect(() => {
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

  // Calculations
  const totalAvailableCash = accounts.reduce((acc, a) => acc + Number(a.current_balance || 0), 0);
  
  const totalExpense = transactions
    .filter((t) => t.type === 'Expense' || t.type === 'EXPENSE')
    .reduce((acc, t) => acc + Number(t.amount || 0), 0);

  const totalIncome = transactions
    .filter((t) => t.type === 'Income' || t.type === 'INCOME')
    .reduce((acc, t) => acc + Number(t.amount || 0), 0);

  const totalUnpaidBills = bills
    .filter((b) => b.status === 'Pending' || b.status === 'UNPAID')
    .reduce((acc, b) => acc + Number(b.amount ?? b.bill_amount ?? 0), 0);

  const filteredTransactions = transactions.filter((tx) => {
    const matchesSearch = tx.description.toLowerCase().includes(searchLedger.toLowerCase()) || 
                          tx.account_name.toLowerCase().includes(searchLedger.toLowerCase());
    const matchesFilter = filterType === 'All' || 
                          (filterType === 'Income' && (tx.type === 'Income' || tx.type === 'INCOME')) ||
                          (filterType === 'Expense' && (tx.type === 'Expense' || tx.type === 'EXPENSE'));
    return matchesSearch && matchesFilter;
  });

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8 text-slate-800 dark:text-slate-100 transition-colors">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header & Quick Action */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-800 gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Financial Control Dashboard</h1>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 font-medium">Real-time multi-account balances, expense tracking & liability schedules</p>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <button
              onClick={fetchData}
              className="flex-1 md:flex-initial flex items-center justify-center gap-2 text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-4 py-2.5 rounded-xl transition border border-slate-200 dark:border-slate-700"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Data
            </button>
          </div>
        </div>

        {/* Executive Metrics Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Net Cash */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">Net Liquidity</span>
              <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl">
                <Wallet className="w-5 h-5" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-3">
              PKR {totalAvailableCash.toLocaleString()}
            </h3>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-2 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> Total Across {accounts.length} Accounts
            </p>
          </div>

          {/* Total Income */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">Total Income</span>
              <div className="p-2.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl">
                <ArrowUpCircle className="w-5 h-5" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-3">
              PKR {totalIncome.toLocaleString()}
            </h3>
            <p className="text-[11px] text-slate-400 font-medium mt-2">Recorded Inflow</p>
          </div>

          {/* Expenses */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">Total Expenses</span>
              <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-xl">
                <ArrowDownCircle className="w-5 h-5" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-3">
              PKR {totalExpense.toLocaleString()}
            </h3>
            <p className="text-[11px] text-rose-500 font-medium mt-2 flex items-center gap-1">
              <TrendingDown className="w-3.5 h-3.5" /> Outflow Ledger
            </p>
          </div>

          {/* Pending Bills */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">Unpaid Payables</span>
              <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-xl">
                <Receipt className="w-5 h-5" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-3">
              PKR {totalUnpaidBills.toLocaleString()}
            </h3>
            <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium mt-2">Due Bills & Commitments</p>
          </div>

        </div>

        {/* Accounts & Wallets Portfolio */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-indigo-500" /> Account Balances Portfolio
            </h3>
            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2.5 py-1 rounded-lg">
              {accounts.length} Active Accounts
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {accounts.map((acc) => (
              <div key={acc.id} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800/80 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">{acc.name}</span>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-slate-200/60 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                    {acc.type || 'Bank'}
                  </span>
                </div>
                <p className="text-lg font-bold text-slate-900 dark:text-white">
                  PKR {Number(acc.current_balance || 0).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Bills Tracker Section */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Receipt className="w-5 h-5 text-amber-500" /> Upcoming Bills & Payables
            </h2>
            <span className="text-xs font-medium text-slate-400">
              Pending: {bills.filter(b => b.status === 'Pending' || b.status === 'UNPAID').length}
            </span>
          </div>

          {bills.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6">No bills recorded in system.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {bills.map((bill) => {
                const isPaid = bill.status === 'Paid' || bill.status === 'PAID';
                const billAmt = Number(bill.amount ?? bill.bill_amount ?? 0);
                return (
                  <div
                    key={bill.id}
                    className={`p-4 rounded-2xl border transition ${
                      isPaid
                        ? 'bg-slate-50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-800 opacity-60'
                        : 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200/80 dark:border-amber-900/40'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-slate-800 dark:text-white text-sm">{bill.provider}</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1 font-mono">
                          <Clock className="w-3 h-3 text-slate-400" /> Due: {bill.due_date}
                        </p>
                      </div>
                      <span
                        className={`text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full ${
                          isPaid
                            ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                            : 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300'
                        }`}
                      >
                        {bill.status}
                      </span>
                    </div>

                    <div className="mt-4 flex justify-between items-end">
                      <div>
                        <p className="text-[11px] text-slate-400">Amount</p>
                        <p className="text-base font-bold text-slate-900 dark:text-white">PKR {billAmt.toLocaleString()}</p>
                      </div>
                      {!isPaid && (
                        <button
                          onClick={() => handlePayBill(bill)}
                          className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-1.5 rounded-xl transition shadow-xs"
                        >
                          <CheckCircle className="w-3.5 h-3.5" /> Pay Now
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Debts & Arrears Component */}
        <DebtsTracker />

        {/* Add Entry & Master Ledger */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Quick Add Form */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm lg:col-span-1 h-fit space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> Quick Add Entry
            </h2>

            <form onSubmit={handleAddTransaction} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 outline-none font-medium"
                >
                  <option value="Expense">Expense (Kharch)</option>
                  <option value="Income">Income (Aamdani)</option>
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
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 outline-none font-bold text-indigo-600 dark:text-indigo-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
                <input
                  type="text"
                  placeholder="e.g. Utility bill / Grocery"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Entered By</label>
                <select
                  value={enteredBy}
                  onChange={(e) => setEnteredBy(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 outline-none font-medium"
                >
                  <option value="Husband">Husband</option>
                  <option value="Wife">Wife</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-xl transition text-xs shadow-sm mt-2"
              >
                {loading ? 'Saving...' : 'Record Transaction'}
              </button>
            </form>
          </div>

          {/* Filterable Master Ledger */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm lg:col-span-2 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Master Money Ledger</h2>
              
              {/* Filter & Search Bar */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1 sm:w-48">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search ledger..."
                    value={searchLedger}
                    onChange={(e) => setSearchLedger(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 outline-none"
                  />
                </div>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 outline-none font-medium"
                >
                  <option value="All">All Types</option>
                  <option value="Expense">Expense</option>
                  <option value="Income">Income</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase font-semibold">
                    <th className="py-2.5 px-2">Date</th>
                    <th className="py-2.5 px-2">Account</th>
                    <th className="py-2.5 px-2">Description</th>
                    <th className="py-2.5 px-2">By</th>
                    <th className="py-2.5 px-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        No ledger records found matching filter.
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map((tx) => {
                      const isIncome = tx.type === 'Income' || tx.type === 'INCOME';
                      return (
                        <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                          <td className="py-3 px-2 text-slate-500 dark:text-slate-400 font-mono">{tx.date}</td>
                          <td className="py-3 px-2 font-semibold text-indigo-600 dark:text-indigo-400">
                            {tx.account_name || 'N/A'}
                          </td>
                          <td className="py-3 px-2 font-medium text-slate-800 dark:text-slate-200">{tx.description}</td>
                          <td className="py-3 px-2">
                            <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-md font-medium">
                              {tx.entered_by || 'Husband'}
                            </span>
                          </td>
                          <td
                            className={`py-3 px-2 text-right font-bold ${
                              isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-800 dark:text-slate-200'
                            }`}
                          >
                            {isIncome ? '+' : '-'} PKR {Number(tx.amount).toLocaleString()}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>

        </div>

      </div>
    </main>
  );
}