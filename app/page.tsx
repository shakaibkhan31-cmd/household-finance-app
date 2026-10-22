'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { PlusCircle, Wallet, ArrowDownCircle, RefreshCw, CreditCard, Receipt, CheckCircle } from 'lucide-react';
import DebtsTracker from '@/components/DebtsTracker';

interface Account {
  id: string;
  account_name: string;
  account_type: string;
  opening_balance: number;
}

interface Transaction {
  id: string;
  transaction_date: string;
  type: string;
  amount: number;
  description: string;
  entered_by: string;
  account_id: string;
  accounts?: { account_name: string };
}

interface Bill {
  id: string;
  provider: string;
  bill_type: string;
  due_date: string;
  bill_amount: number;
  late_charges: number;
  payment_status: string;
}

export default function FinanceDashboard() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(false);

  // Form States
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('EXPENSE');
  const [description, setDescription] = useState('');
  const [enteredBy, setEnteredBy] = useState('Husband');
  const [selectedAccount, setSelectedAccount] = useState('');

  // Fetch All Data
  const fetchData = async () => {
    setLoading(true);

    // Fetch Accounts
    const { data: accData } = await supabase.from('accounts').select('*');
    if (accData) {
      setAccounts(accData);
      if (accData.length > 0 && !selectedAccount) {
        setSelectedAccount(accData[0].id);
      }
    }

    // Fetch Transactions
    const { data: txData } = await supabase
      .from('transactions')
      .select('*, accounts(account_name)')
      .order('created_at', { ascending: false });

    if (txData) setTransactions(txData);

    // Fetch Bills
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

  // Submit Transaction Handler
  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !description || !selectedAccount) {
      return alert('Khabardar: Amount, Description aur Account sab zaroori hain!');
    }

    setLoading(true);
    const { error } = await supabase.from('transactions').insert([
      {
        user_id: '00000000-0000-0000-0000-000000000000',
        type,
        amount: parseFloat(amount),
        description,
        entered_by: enteredBy,
        account_id: selectedAccount,
        transaction_date: new Date().toISOString().split('T')[0],
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

  // Mark Bill as Paid Handler
  const handlePayBill = async (bill: Bill) => {
    if (!selectedAccount) return alert('Pehle Niche Form Se Ek Account Select Karein!');

    if (!confirm(`${bill.provider} Ka PKR ${bill.bill_amount} Bill Paid Mark Karein?`)) return;

    setLoading(true);

    // 1. Update Bill Status
    await supabase.from('bills').update({ payment_status: 'PAID' }).eq('id', bill.id);

    // 2. Automatically Add Transaction in Ledger
    await supabase.from('transactions').insert([
      {
        user_id: '00000000-0000-0000-0000-000000000000',
        type: 'EXPENSE',
        amount: bill.bill_amount,
        description: `Bill Payment: ${bill.provider}`,
        entered_by: 'System',
        account_id: selectedAccount,
        transaction_date: new Date().toISOString().split('T')[0],
      },
    ]);

    fetchData();
  };

  // Calculations
  const totalOpening = accounts.reduce((acc, a) => acc + Number(a.opening_balance), 0);
  const totalIncome = transactions
    .filter((t) => t.type === 'INCOME')
    .reduce((acc, t) => acc + Number(t.amount), 0);
  const totalExpense = transactions
    .filter((t) => t.type === 'EXPENSE')
    .reduce((acc, t) => acc + Number(t.amount), 0);

  const netBalance = totalOpening + totalIncome - totalExpense;
  const totalUnpaidBills = bills
    .filter((b) => b.payment_status === 'UNPAID')
    .reduce((acc, b) => acc + Number(b.bill_amount), 0);

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-8 text-slate-800">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Household Finance Control Centre</h1>
            <p className="text-slate-500 text-sm mt-1">Multi-Account Ledger & Bills Control Center</p>
          </div>
          <button
            onClick={fetchData}
            className="mt-4 md:mt-0 flex items-center gap-2 text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh Data
          </button>
        </div>

        {/* Top Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs uppercase font-semibold text-slate-400">Total Available Cash</p>
              <h3 className={`text-2xl font-bold mt-1 ${netBalance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                PKR {netBalance.toLocaleString()}
              </h3>
            </div>
            <div className="p-3 bg-slate-100 text-slate-600 rounded-xl">
              <Wallet className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs uppercase font-semibold text-slate-400">Pending Bills Payable</p>
              <h3 className="text-2xl font-bold text-amber-600 mt-1">PKR {totalUnpaidBills.toLocaleString()}</h3>
            </div>
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <Receipt className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs uppercase font-semibold text-slate-400">Total Expenses</p>
              <h3 className="text-2xl font-bold text-rose-600 mt-1">PKR {totalExpense.toLocaleString()}</h3>
            </div>
            <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
              <ArrowDownCircle className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Accounts List Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-xs uppercase font-semibold text-slate-400 mb-3 flex items-center gap-1.5">
            <CreditCard className="w-4 h-4 text-indigo-500" /> Accounts & Wallets
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {accounts.map((acc) => {
              const accTx = transactions.filter((t) => t.account_id === acc.id);
              const accIncome = accTx.filter((t) => t.type === 'INCOME').reduce((s, t) => s + Number(t.amount), 0);
              const accExpense = accTx.filter((t) => t.type === 'EXPENSE').reduce((s, t) => s + Number(t.amount), 0);
              const accCurrent = Number(acc.opening_balance) + accIncome - accExpense;

              return (
                <div key={acc.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-xs font-medium text-slate-500">{acc.account_name}</p>
                  <p className="text-sm font-bold text-slate-800 mt-0.5">PKR {accCurrent.toLocaleString()}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pending Bills Tracker Section */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Receipt className="w-5 h-5 text-amber-500" /> Upcoming Bills & Payables
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {bills.map((bill) => (
              <div
                key={bill.id}
                className={`p-4 rounded-xl border ${
                  bill.payment_status === 'PAID'
                    ? 'bg-slate-50 border-slate-200 opacity-60'
                    : 'bg-amber-50/50 border-amber-200'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">{bill.provider}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Due: {bill.due_date}</p>
                  </div>
                  <span
                    className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                      bill.payment_status === 'PAID'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {bill.payment_status}
                  </span>
                </div>

                <div className="mt-4 flex justify-between items-end">
                  <div>
                    <p className="text-xs text-slate-400">Bill Amount</p>
                    <p className="text-lg font-bold text-slate-900">PKR {Number(bill.bill_amount).toLocaleString()}</p>
                  </div>
                  {bill.payment_status === 'UNPAID' && (
                    <button
                      onClick={() => handlePayBill(bill)}
                      className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition"
                    >
                      <CheckCircle className="w-3.5 h-3.5" /> Pay Now
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Debts & Arrears Tracker Component */}
        <DebtsTracker />

        {/* Form and Transactions Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* New Entry Form */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm lg:col-span-1 h-fit">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-indigo-600" /> Add Transaction
            </h2>
            <form onSubmit={handleAddTransaction} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-indigo-500"
                >
                  <option value="EXPENSE">Expense (Kharch)</option>
                  <option value="INCOME">Income (Aamdani)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Account</label>
                <select
                  value={selectedAccount}
                  onChange={(e) => setSelectedAccount(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-indigo-500"
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.account_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Amount (PKR)</label>
                <input
                  type="number"
                  placeholder="e.g. 2500"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Description</label>
                <input
                  type="text"
                  placeholder="e.g. Utility Bill payment"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Entered By</label>
                <select
                  value={enteredBy}
                  onChange={(e) => setEnteredBy(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-indigo-500"
                >
                  <option value="Husband">Husband</option>
                  <option value="Wife">Wife</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium p-3 rounded-xl transition text-sm shadow-sm"
              >
                {loading ? 'Saving...' : 'Save Transaction'}
              </button>
            </form>
          </div>

          {/* Master Transactions Table */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm lg:col-span-2">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Master Money Ledger</h2>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 text-xs uppercase font-medium">
                    <th className="py-3 px-2">Date</th>
                    <th className="py-3 px-2">Account</th>
                    <th className="py-3 px-2">Description</th>
                    <th className="py-3 px-2">By</th>
                    <th className="py-3 px-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50">
                      <td className="py-3 px-2 text-slate-500 text-xs">{tx.transaction_date}</td>
                      <td className="py-3 px-2 text-xs font-semibold text-indigo-600">
                        {tx.accounts?.account_name || 'N/A'}
                      </td>
                      <td className="py-3 px-2 font-medium text-slate-800">{tx.description}</td>
                      <td className="py-3 px-2 text-xs">
                        <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-md">
                          {tx.entered_by}
                        </span>
                      </td>
                      <td
                        className={`py-3 px-2 text-right font-semibold ${
                          tx.type === 'INCOME' ? 'text-emerald-600' : 'text-slate-800'
                        }`}
                      >
                        {tx.type === 'INCOME' ? '+' : '-'} PKR {Number(tx.amount).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>

      </div>
    </main>
  );
}