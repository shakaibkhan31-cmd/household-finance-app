'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Wallet, Plus, Building2, CreditCard, DollarSign, Edit3, X, Trash2, Search, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

export interface Account {
  id: string;
  name: string;
  type: 'Bank' | 'Wallet' | 'Cash' | 'Credit Card';
  account_number?: string;
  current_balance: number;
  credit_limit?: number;
  created_at?: string;
}

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterType, setFilterType] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Form State (Add)
  const [name, setName] = useState('');
  const [type, setType] = useState<'Bank' | 'Wallet' | 'Cash' | 'Credit Card'>('Bank');
  const [accountNumber, setAccountNumber] = useState('');
  const [balance, setBalance] = useState('');
  const [creditLimit, setCreditLimit] = useState('');

  // Edit State
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [editName, setEditName] = useState('');
  const [editBalance, setEditBalance] = useState('');
  const [editCreditLimit, setEditCreditLimit] = useState('');
  const [editAccountNumber, setEditAccountNumber] = useState('');

  const fetchAccounts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching accounts:', error.message);
    } else {
      setAccounts(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !balance) return;

    const parsedBalance = parseFloat(balance);
    const parsedLimit = type === 'Credit Card' && creditLimit ? parseFloat(creditLimit) : 0;
    const isCash = type === 'Cash';

    const { error } = await supabase.from('accounts').insert([
      {
        name,
        type,
        account_number: isCash ? null : (accountNumber || null),
        current_balance: parsedBalance,
        credit_limit: parsedLimit,
      },
    ]);

    if (error) {
      alert('Error adding account: ' + error.message);
    } else {
      setName('');
      setAccountNumber('');
      setBalance('');
      setCreditLimit('');
      fetchAccounts();
    }
  };

  const handleOpenEdit = (acc: Account) => {
    setEditingAccount(acc);
    setEditName(acc.name);
    setEditBalance(acc.current_balance.toString());
    setEditCreditLimit(acc.credit_limit ? acc.credit_limit.toString() : '');
    setEditAccountNumber(acc.account_number || '');
  };

  const handleUpdateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAccount) return;

    const updatePayload: any = {
      name: editName,
      current_balance: parseFloat(editBalance),
      account_number: editAccountNumber || null,
    };

    if (editingAccount.type === 'Credit Card') {
      updatePayload.credit_limit = parseFloat(editCreditLimit || '0');
    }

    const { error } = await supabase
      .from('accounts')
      .update(updatePayload)
      .eq('id', editingAccount.id);

    if (error) {
      alert('Error updating account: ' + error.message);
    } else {
      setEditingAccount(null);
      fetchAccounts();
    }
  };

  const handleDeleteAccount = async (id: string, name: string) => {
    if (!confirm(`Kya aap waqai "${name}" account ko delete karna chahte hain?`)) return;

    const { error } = await supabase.from('accounts').delete().eq('id', id);
    if (error) {
      alert('Error deleting account: ' + error.message);
    } else {
      fetchAccounts();
    }
  };

  const totalBalance = accounts.reduce((sum, acc) => sum + Number(acc.current_balance), 0);
  const totalCreditLimit = accounts
    .filter((acc) => acc.type === 'Credit Card')
    .reduce((sum, acc) => sum + Number(acc.credit_limit || 0), 0);

  const filteredAccounts = accounts.filter((acc) => {
    const matchesType = filterType === 'All' || acc.type === filterType;
    const matchesSearch = acc.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (acc.account_number && acc.account_number.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesType && matchesSearch;
  });

  const isCreditCard = type === 'Credit Card';
  const isCash = type === 'Cash';

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 bg-slate-50 dark:bg-slate-950 min-h-screen transition-colors">
      {/* Header & Portfolio Stats */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Accounts & Wallets</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage bank accounts, digital wallets, credit cards, and cash reserves</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <div className="bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 p-4 rounded-2xl flex-1 md:w-48">
            <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Total Net Liquid Worth</p>
            <p className="text-xl font-bold text-indigo-900 dark:text-indigo-200 mt-0.5">PKR {totalBalance.toLocaleString()}</p>
          </div>
          {totalCreditLimit > 0 && (
            <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/50 p-4 rounded-2xl flex-1 md:w-48">
              <p className="text-xs font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider">Total Credit Limit</p>
              <p className="text-xl font-bold text-rose-900 dark:text-rose-200 mt-0.5">PKR {totalCreditLimit.toLocaleString()}</p>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Form: Add Account */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 h-fit space-y-4">
          <h2 className="text-base font-semibold text-slate-800 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
            <Plus className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Add New Account
          </h2>

          <form onSubmit={handleAddAccount} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Account Title / Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Meezan Bank / HBL Credit Card"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
              >
                <option value="Bank">Bank Account</option>
                <option value="Wallet">Digital Wallet</option>
                <option value="Credit Card">Credit Card</option>
                <option value="Cash">Physical Cash</option>
              </select>
            </div>

            {!isCash && (
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {isCreditCard ? 'Card Number (Optional)' : 'Account Number / IBAN (Optional)'}
                </label>
                <input
                  type="text"
                  placeholder={isCreditCard ? "e.g. 4532 •••• •••• 8890" : "e.g. PK00MEZN0001234..."}
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            )}

            {isCreditCard && (
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Credit Limit (PKR)</label>
                <input
                  type="number"
                  required
                  placeholder="300000"
                  value={creditLimit}
                  onChange={(e) => setCreditLimit(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                {isCreditCard ? 'Initial Outstanding Liability (PKR)' : 'Initial / Current Balance (PKR)'}
              </label>
              <input
                type="number"
                required
                placeholder="0.00"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-xl text-xs transition shadow-sm mt-2"
            >
              Add Account
            </button>
          </form>
        </div>

        {/* List: Accounts Cards & Filters */}
        <div className="lg:col-span-2 space-y-4">
          {/* Filter & Search Bar */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
              {['All', 'Bank', 'Wallet', 'Credit Card', 'Cash'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilterType(tab)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition shrink-0 ${
                    filterType === tab
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-56">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search accounts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 outline-none"
              />
            </div>
          </div>

          {/* Accounts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {loading ? (
              <div className="col-span-2 text-center py-12 text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs">
                Loading account portfolio...
              </div>
            ) : filteredAccounts.length === 0 ? (
              <div className="col-span-2 text-center py-12 text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs">
                No accounts found matching your filter.
              </div>
            ) : (
              filteredAccounts.map((acc) => (
                <div key={acc.id} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 relative group">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl">
                        {acc.type === 'Bank' ? <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" /> :
                         acc.type === 'Wallet' ? <Wallet className="w-5 h-5 text-purple-600 dark:text-purple-400" /> :
                         acc.type === 'Credit Card' ? <CreditCard className="w-5 h-5 text-rose-600 dark:text-rose-400" /> :
                         <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-800 dark:text-white text-sm">{acc.name}</h3>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">{acc.type}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(acc)}
                        className="text-xs text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-800 p-1.5 rounded-lg transition"
                        title="Edit Account Details"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteAccount(acc.id, acc.name)}
                        className="text-xs text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 p-1.5 rounded-lg transition"
                        title="Delete Account"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {acc.account_number && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-mono bg-slate-50 dark:bg-slate-800 px-2.5 py-1 rounded-lg w-fit">
                      {acc.account_number}
                    </p>
                  )}

                  {acc.type === 'Credit Card' ? (
                    <div className="border-t border-slate-100 dark:border-slate-800 pt-3 grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-[11px] text-slate-400">Credit Limit</p>
                        <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                          PKR {Number(acc.credit_limit || 0).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] text-slate-400">Outstanding</p>
                        <p className="text-sm font-bold text-rose-600 dark:text-rose-400 mt-0.5">
                          PKR {Number(acc.current_balance).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
                      <p className="text-[11px] text-slate-400">Available Balance</p>
                      <p className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                        PKR {Number(acc.current_balance).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Edit Modal */}
      {editingAccount && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-md w-full p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Edit Account</h3>
              <button onClick={() => setEditingAccount(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateAccount} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Account Title</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                />
              </div>

              {editingAccount.type !== 'Cash' && (
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Account / Card Number</label>
                  <input
                    type="text"
                    value={editAccountNumber}
                    onChange={(e) => setEditAccountNumber(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              )}

              {editingAccount.type === 'Credit Card' && (
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Credit Limit (PKR)</label>
                  <input
                    type="number"
                    required
                    value={editCreditLimit}
                    onChange={(e) => setEditCreditLimit(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {editingAccount.type === 'Credit Card' ? 'Outstanding Liability (PKR)' : 'Current Balance (PKR)'}
                </label>
                <input
                  type="number"
                  required
                  value={editBalance}
                  onChange={(e) => setEditBalance(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingAccount(null)}
                  className="flex-1 py-2.5 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition shadow-xs"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}