'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Supabase Client Config
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Debt {
  id: string;
  person_name: string;
  type: 'Given' | 'Taken' | 'Kameti';
  amount: number;
  remaining_balance: number;
  due_date: string;
  status: 'Active' | 'Settled';
  created_at?: string;
}

export default function DebtsTracker() {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Form State
  const [personName, setPersonName] = useState('');
  const [type, setType] = useState<'Given' | 'Taken' | 'Kameti'>('Given');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');

  // Fetch Debts
  const fetchDebts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('debts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching debts:', error);
    } else {
      setDebts(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDebts();
  }, []);

  // Add New Debt Record
  const handleAddDebt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!personName || !amount) return;

    const parsedAmount = parseFloat(amount);

    const { error } = await supabase.from('debts').insert([
      {
        person_name: personName,
        type,
        amount: parsedAmount,
        remaining_balance: parsedAmount,
        due_date: dueDate || null,
        status: 'Active',
      },
    ]);

    if (error) {
      alert('Error adding debt record: ' + error.message);
    } else {
      setPersonName('');
      setAmount('');
      setDueDate('');
      fetchDebts();
    }
  };

  // Mark Debt as Settled
  const handleSettleDebt = async (id: string) => {
    const { error } = await supabase
      .from('debts')
      .update({ status: 'Settled', remaining_balance: 0 })
      .eq('id', id);

    if (error) {
      alert('Error updating debt: ' + error.message);
    } else {
      fetchDebts();
    }
  };

  // Summary Totals
  const totalGiven = debts
    .filter((d) => d.type === 'Given' && d.status === 'Active')
    .reduce((sum, d) => sum + Number(d.remaining_balance), 0);

  const totalTaken = debts
    .filter((d) => d.type === 'Taken' && d.status === 'Active')
    .reduce((sum, d) => sum + Number(d.remaining_balance), 0);

  const totalKameti = debts
    .filter((d) => d.type === 'Kameti' && d.status === 'Active')
    .reduce((sum, d) => sum + Number(d.remaining_balance), 0);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 my-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Debts & Arrears Tracker</h2>
          <p className="text-sm text-slate-500">Informal Loans, Udhaar & Kameti Management</p>
        </div>
        <button
          onClick={fetchDebts}
          className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-md font-medium transition"
        >
          Refresh Debts
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
          <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">
            Money Receivables (Udhaar Diya)
          </p>
          <p className="text-2xl font-bold text-emerald-700 mt-1">
            PKR {totalGiven.toLocaleString()}
          </p>
        </div>

        <div className="bg-rose-50 border border-rose-200 rounded-lg p-4">
          <p className="text-xs font-semibold text-rose-600 uppercase tracking-wider">
            Money Payables (Udhaar Liya)
          </p>
          <p className="text-2xl font-bold text-rose-700 mt-1">
            PKR {totalTaken.toLocaleString()}
          </p>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider">
            Active Kameti / Committees
          </p>
          <p className="text-2xl font-bold text-amber-700 mt-1">
            PKR {totalKameti.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Main Grid: Form + List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <form onSubmit={handleAddDebt} className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-4">
          <h3 className="text-sm font-semibold text-slate-800 border-b pb-2">Add Debt / Loan Entry</h3>
          
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Person / Party Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Ali Ahmed / Kameti Name"
              value={personName}
              onChange={(e) => setPersonName(e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded-md focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              className="w-full px-3 py-2 text-sm border rounded-md focus:ring-1 focus:ring-blue-500 outline-none"
            >
              <option value="Given">Udhaar Diya (Given)</option>
              <option value="Taken">Udhaar Liya (Taken)</option>
              <option value="Kameti">Kameti / Committee</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Amount (PKR)</label>
            <input
              type="number"
              required
              placeholder="e.g. 50000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded-md focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Due Date (Optional)</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded-md focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-md text-sm transition"
          >
            Record Debt Entry
          </button>
        </form>

        {/* List */}
        <div className="lg:col-span-2 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-xs font-semibold text-slate-500 border-b border-slate-200 bg-slate-50">
                <th className="py-2.5 px-3">Party Name</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Balance</th>
                <th className="py-2.5 px-3">Due Date</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-6 text-slate-400">Loading debts...</td>
                </tr>
              ) : debts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-6 text-slate-400">No debt records found.</td>
                </tr>
              ) : (
                debts.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="py-3 px-3 font-medium text-slate-800">{item.person_name}</td>
                    <td className="py-3 px-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                        item.type === 'Given' ? 'bg-emerald-100 text-emerald-700' :
                        item.type === 'Taken' ? 'bg-rose-100 text-rose-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {item.type}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-800">
                      PKR {Number(item.remaining_balance).toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-slate-500 text-xs">
                      {item.due_date || 'N/A'}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${
                        item.status === 'Active' ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      {item.status === 'Active' && (
                        <button
                          onClick={() => handleSettleDebt(item.id)}
                          className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded font-medium transition"
                        >
                          Mark Settled
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}