'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { HandCoins, Plus, CheckCircle, Users, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

export interface Debt {
  id: string;
  person_name: string;
  type: 'Given (Receivable)' | 'Taken (Payable)';
  amount: number;
  due_date: string;
  status: 'Active' | 'Settled';
  notes: string;
  created_at?: string;
}

export interface Kameti {
  id: string;
  title: string;
  monthly_amount: number;
  total_pool: number;
  my_turn_month: string;
  status: 'Active' | 'Completed';
  created_at?: string;
}

export default function DebtsPage() {
  const [activeTab, setActiveTab] = useState<'debts' | 'kameti'>('debts');
  
  // Debts State
  const [debts, setDebts] = useState<Debt[]>([]);
  const [personName, setPersonName] = useState('');
  const [debtType, setDebtType] = useState<'Given (Receivable)' | 'Taken (Payable)'>('Given (Receivable)');
  const [debtAmount, setDebtAmount] = useState('');
  const [debtDueDate, setDebtDueDate] = useState('');
  const [debtNotes, setDebtNotes] = useState('');

  // Kameti State
  const [kametis, setKametis] = useState<Kameti[]>([]);
  const [kametiTitle, setKametiTitle] = useState('');
  const [monthlyAmount, setMonthlyAmount] = useState('');
  const [totalPool, setTotalPool] = useState('');
  const [myTurnMonth, setMyTurnMonth] = useState('');

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setDebtDueDate(today);
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    if (activeTab === 'debts') {
      const { data, error } = await supabase.from('debts').select('*').order('due_date', { ascending: true });
      if (!error) setDebts(data || []);
    } else {
      const { data, error } = await supabase.from('kametis').select('*').order('created_at', { ascending: false });
      if (!error) setKametis(data || []);
    }
    setLoading(false);
  };

  // Add Debt
  const handleAddDebt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!personName || !debtAmount) return;

    const { error } = await supabase.from('debts').insert([
      {
        person_name: personName,
        type: debtType,
        amount: parseFloat(debtAmount),
        due_date: debtDueDate,
        status: 'Active',
        notes: debtNotes,
      },
    ]);

    if (error) {
      alert('Error adding debt: ' + error.message);
    } else {
      setPersonName('');
      setDebtAmount('');
      setDebtNotes('');
      fetchData();
    }
  };

  // Add Kameti
  const handleAddKameti = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kametiTitle || !monthlyAmount || !totalPool) return;

    const { error } = await supabase.from('kametis').insert([
      {
        title: kametiTitle,
        monthly_amount: parseFloat(monthlyAmount),
        total_pool: parseFloat(totalPool),
        my_turn_month: myTurnMonth || 'N/A',
        status: 'Active',
      },
    ]);

    if (error) {
      alert('Error adding kameti: ' + error.message);
    } else {
      setKametiTitle('');
      setMonthlyAmount('');
      setTotalPool('');
      setMyTurnMonth('');
      fetchData();
    }
  };

  // Settle Debt
  const handleSettleDebt = async (id: string) => {
    const { error } = await supabase.from('debts').update({ status: 'Settled' }).eq('id', id);
    if (!error) fetchData();
  };

  const totalReceivable = debts.filter(d => d.type === 'Given (Receivable)' && d.status === 'Active').reduce((s, d) => s + Number(d.amount), 0);
  const totalPayable = debts.filter(d => d.type === 'Taken (Payable)' && d.status === 'Active').reduce((s, d) => s + Number(d.amount), 0);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Debts & Kameti Management</h1>
          <p className="text-sm text-slate-500 mt-1">Track personal loans, lendings, borrowings, and rotating savings circles</p>
        </div>

        {/* Tabs Switcher */}
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveTab('debts')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${
              activeTab === 'debts' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Loans & Debts
          </button>
          <button
            onClick={() => setActiveTab('kameti')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${
              activeTab === 'kameti' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Kameti Circles
          </button>
        </div>
      </div>

      {activeTab === 'debts' ? (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Total Receivable (Logay)</p>
                <p className="text-2xl font-bold text-emerald-900 mt-1">PKR {totalReceivable.toLocaleString()}</p>
              </div>
              <ArrowDownLeft className="w-8 h-8 text-emerald-600" />
            </div>

            <div className="bg-rose-50 border border-rose-200 p-5 rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-rose-700 uppercase tracking-wider">Total Payable (Denay)</p>
                <p className="text-2xl font-bold text-rose-900 mt-1">PKR {totalPayable.toLocaleString()}</p>
              </div>
              <ArrowUpRight className="w-8 h-8 text-rose-600" />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Form */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-fit space-y-4">
              <h2 className="text-base font-semibold text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-600" />
                Add Loan Record
              </h2>

              <form onSubmit={handleAddDebt} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Person Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ali / Uncle / Friend"
                    value={personName}
                    onChange={(e) => setPersonName(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Type</label>
                  <select
                    value={debtType}
                    onChange={(e) => setDebtType(e.target.value as any)}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                  >
                    <option value="Given (Receivable)">Given (Logay - Receivable)</option>
                    <option value="Taken (Payable)">Taken (Denay - Payable)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Amount (PKR)</label>
                    <input
                      type="number"
                      required
                      placeholder="0"
                      value={debtAmount}
                      onChange={(e) => setDebtAmount(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Due Date</label>
                    <input
                      type="date"
                      required
                      value={debtDueDate}
                      onChange={(e) => setDebtDueDate(e.target.value)}
                      className="w-full px-2.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Notes / Purpose</label>
                  <input
                    type="text"
                    placeholder="e.g. Temporary cash help for emergency"
                    value={debtNotes}
                    onChange={(e) => setDebtNotes(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-xl text-xs transition shadow-sm mt-2"
                >
                  Save Record
                </button>
              </form>
            </div>

            {/* List */}
            <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
              <h2 className="text-base font-semibold text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
                <HandCoins className="w-5 h-5 text-indigo-600" />
                Active Loans & Debts Ledger
              </h2>

              {loading ? (
                <p className="text-center py-8 text-xs text-slate-400">Loading records...</p>
              ) : debts.length === 0 ? (
                <p className="text-center py-8 text-xs text-slate-400">No debt records found.</p>
              ) : (
                <div className="space-y-3">
                  {debts.map((d) => (
                    <div key={d.id} className={`p-4 rounded-xl border flex items-center justify-between ${
                      d.status === 'Settled' ? 'bg-slate-50 opacity-60 border-slate-200' : 'bg-white border-slate-200 shadow-sm'
                    }`}>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-slate-900 text-xs">{d.person_name}</h4>
                          <span className={`text-[10px] px-2 py-0.5 rounded-md font-medium ${
                            d.type.includes('Given') ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {d.type}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500">{d.notes || 'No remarks'}</p>
                        <p className="text-[10px] font-mono text-slate-400">Due: {d.due_date}</p>
                      </div>

                      <div className="text-right space-y-2">
                        <p className="font-bold text-slate-900 text-sm">PKR {Number(d.amount).toLocaleString()}</p>
                        {d.status === 'Active' ? (
                          <button
                            onClick={() => handleSettleDebt(d.id)}
                            className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[10px] font-medium transition"
                          >
                            Mark Settled
                          </button>
                        ) : (
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md">
                            Settled ✓
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Kameti Form */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-fit space-y-4">
            <h2 className="text-base font-semibold text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
              <Plus className="w-5 h-5 text-indigo-600" />
              Add Kameti Circle
            </h2>

            <form onSubmit={handleAddKameti} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Kameti Title / Committee Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Family Monthly Kameti 50k"
                  value={kametiTitle}
                  onChange={(e) => setKametiTitle(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Monthly Contribution (PKR)</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 10000"
                  value={monthlyAmount}
                  onChange={(e) => setMonthlyAmount(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Total Pool / Committee Amount (PKR)</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 200000"
                  value={totalPool}
                  onChange={(e) => setTotalPool(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">My Turn / Collection Month</label>
                <input
                  type="text"
                  placeholder="e.g. December 2026 / Month 5"
                  value={myTurnMonth}
                  onChange={(e) => setMyTurnMonth(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-xl text-xs transition shadow-sm mt-2"
              >
                Create Kameti Circle
              </button>
            </form>
          </div>

          {/* Kameti List */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
            <h2 className="text-base font-semibold text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" />
              Active Kameti Circles
            </h2>

            {loading ? (
              <p className="text-center py-8 text-xs text-slate-400">Loading kametis...</p>
            ) : kametis.length === 0 ? (
              <p className="text-center py-8 text-xs text-slate-400">No kameti circles registered yet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {kametis.map((k) => (
                  <div key={k.id} className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-slate-800 text-sm">{k.title}</h3>
                      <span className="text-[10px] font-semibold bg-indigo-100 text-indigo-800 px-2.5 py-1 rounded-full">
                        {k.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                        <p className="text-[10px] text-slate-400">Monthly Installment</p>
                        <p className="font-bold text-slate-800">PKR {Number(k.monthly_amount).toLocaleString()}</p>
                      </div>
                      <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                        <p className="text-[10px] text-slate-400">Total Pool</p>
                        <p className="font-bold text-slate-900">PKR {Number(k.total_pool).toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
                      <span>My Turn: <strong>{k.my_turn_month}</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}