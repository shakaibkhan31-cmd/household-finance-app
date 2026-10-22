'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Receipt, Plus, CheckCircle, Clock, AlertCircle } from 'lucide-react';

export interface Bill {
  id: string;
  title: string;
  category: string;
  amount: number;
  due_date: string;
  status: 'Pending' | 'Paid';
  paid_date?: string;
  created_at?: string;
}

const BILL_CATEGORIES = [
  'Electricity (K-Electric)',
  'Sui Gas (SSGC)',
  'Water / Tanker',
  'Internet / Wifi',
  'House Rent',
  'Building Maintenance',
  'School / Tuition Fees',
  'Other Utility'
];

export default function BillsPage() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(BILL_CATEGORIES[0]);
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');

  useEffect(() => {
    setDueDate(new Date().toISOString().split('T')[0]);
    fetchBills();
  }, []);

  // Fetch Bills from Supabase
  const fetchBills = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('bills')
      .select('*')
      .order('due_date', { ascending: true });

    if (error) {
      console.error('Error fetching bills:', error.message);
    } else {
      setBills(data || []);
    }
    setLoading(false);
  };

  // Add Bill
  const handleAddBill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !amount || !dueDate) return;

    const parsedAmount = parseFloat(amount);

    const { error } = await supabase.from('bills').insert([
      {
        title,
        category,
        amount: parsedAmount,
        due_date: dueDate,
        status: 'Pending',
      },
    ]);

    if (error) {
      alert('Error adding bill: ' + error.message);
    } else {
      setTitle('');
      setAmount('');
      fetchBills();
    }
  };

  // Mark Bill as Paid and Auto-record in Transactions
  const handleMarkAsPaid = async (bill: Bill) => {
    const today = new Date().toISOString().split('T')[0];

    // 1. Update Bill status
    const { error: billError } = await supabase
      .from('bills')
      .update({ status: 'Paid', paid_date: today })
      .eq('id', bill.id);

    if (billError) {
      alert('Error updating bill: ' + billError.message);
      return;
    }

    // 2. Auto Insert into Transactions Ledger
    const { error: txError } = await supabase.from('transactions').insert([
      {
        date: today,
        type: 'Bill Payment',
        account_name: 'Meezan Bank', // Default account, edited later in transactions if needed
        category: bill.category,
        amount: bill.amount,
        payment_method: 'Online Transfer',
        party_name: bill.title,
        description: `Bill Payment for ${bill.title}`,
        entered_by: 'Husband',
      },
    ]);

    if (txError) {
      console.error('Error auto-creating transaction:', txError.message);
    }

    fetchBills();
  };

  const pendingBills = bills.filter((b) => b.status === 'Pending');
  const paidBills = bills.filter((b) => b.status === 'Paid');
  const totalPendingAmount = pendingBills.reduce((sum, b) => sum + Number(b.amount), 0);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Bills & Payables</h1>
          <p className="text-sm text-slate-500 mt-1">Track monthly utility bills, due dates, and payment history</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl text-right">
          <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Total Pending Bills</p>
          <p className="text-2xl font-bold text-amber-900 mt-0.5">PKR {totalPendingAmount.toLocaleString()}</p>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Form to Add New Bill */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-fit space-y-4">
          <h2 className="text-base font-semibold text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
            <Plus className="w-5 h-5 text-indigo-600" />
            Add Upcoming Bill
          </h2>

          <form onSubmit={handleAddBill} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Bill Title / Service</label>
              <input
                type="text"
                required
                placeholder="e.g. KE K-Electric Bill Oct 2026"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                {BILL_CATEGORIES.map((cat) => (
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
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Due Date</label>
                <input
                  type="date"
                  required
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-xl text-xs transition shadow-sm mt-2"
            >
              Add Bill Record
            </button>
          </form>
        </div>

        {/* Right Column: Pending & Paid Bills Lists */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Pending Bills */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              Pending Bills ({pendingBills.length})
            </h3>

            {loading ? (
              <p className="text-center py-6 text-xs text-slate-400">Loading bills...</p>
            ) : pendingBills.length === 0 ? (
              <p className="text-center py-6 text-xs text-slate-400">No pending bills! All clear 🎉</p>
            ) : (
              <div className="space-y-3">
                {pendingBills.map((bill) => (
                  <div key={bill.id} className="flex items-center justify-between p-4 bg-amber-50/50 border border-amber-100 rounded-xl">
                    <div className="space-y-1">
                      <h4 className="font-semibold text-slate-800 text-xs">{bill.title}</h4>
                      <p className="text-[10px] text-slate-500 font-medium">{bill.category}</p>
                      <p className="text-[10px] text-amber-700 font-mono flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> Due: {bill.due_date}
                      </p>
                    </div>

                    <div className="text-right space-y-2">
                      <p className="font-bold text-slate-900 text-sm">PKR {Number(bill.amount).toLocaleString()}</p>
                      <button
                        onClick={() => handleMarkAsPaid(bill)}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-medium transition shadow-sm flex items-center gap-1 ml-auto"
                      >
                        <CheckCircle className="w-3.5 h-3.5" /> Mark Paid
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Paid History */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              Recent Paid Bills History
            </h3>

            {paidBills.length === 0 ? (
              <p className="text-center py-4 text-xs text-slate-400">No paid bills recorded yet.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {paidBills.map((bill) => (
                  <div key={bill.id} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-800 text-xs">{bill.title}</p>
                      <p className="text-[10px] text-slate-400">Paid on: {bill.paid_date || bill.due_date}</p>
                    </div>
                    <p className="font-semibold text-slate-700 text-xs">PKR {Number(bill.amount).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}