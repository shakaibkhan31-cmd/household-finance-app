'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Receipt, Plus, CheckCircle, Clock, AlertCircle } from 'lucide-react';

export interface Bill {
  id: string;
  title: string;
  category: string;
  bill_date: string;
  due_date: string;
  amount: number;
  previous_arrears: number;
  late_charges: number;
  total_payable: number;
  notes: string;
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
  const [billDate, setBillDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [amount, setAmount] = useState('');
  const [previousArrears, setPreviousArrears] = useState('0');
  const [lateCharges, setLateCharges] = useState('0');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setBillDate(today);
    setDueDate(today);
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

    const baseAmount = parseFloat(amount) || 0;
    const arrears = parseFloat(previousArrears) || 0;
    const charges = parseFloat(lateCharges) || 0;
    const calculatedTotal = baseAmount + arrears + charges;

    const { error } = await supabase.from('bills').insert([
      {
        title,
        category,
        bill_date: billDate,
        due_date: dueDate,
        amount: baseAmount,
        previous_arrears: arrears,
        late_charges: charges,
        total_payable: calculatedTotal,
        notes,
        status: 'Pending',
      },
    ]);

    if (error) {
      alert('Error adding bill: ' + error.message);
    } else {
      setTitle('');
      setAmount('');
      setPreviousArrears('0');
      setLateCharges('0');
      setNotes('');
      fetchBills();
    }
  };

  // Mark Bill as Paid and Auto-record in Transactions Ledger
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
    const payableAmount = bill.total_payable || bill.amount;
    const { error: txError } = await supabase.from('transactions').insert([
      {
        date: today,
        type: 'Bill Payment',
        account_name: 'Meezan Bank',
        category: bill.category,
        amount: payableAmount,
        payment_method: 'Online Transfer',
        party_name: bill.title,
        description: `Bill Payment: ${bill.title} ${bill.notes ? `(${bill.notes})` : ''}`,
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
  const totalPendingAmount = pendingBills.reduce(
    (sum, b) => sum + Number(b.total_payable || b.amount),
    0
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Bills & Payables</h1>
          <p className="text-sm text-slate-500 mt-1">
            Track monthly utility bills, arrears, late charges, and due dates
          </p>
        </div>
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl text-right">
          <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider">
            Total Pending Payable
          </p>
          <p className="text-2xl font-bold text-amber-900 mt-0.5">
            PKR {totalPendingAmount.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Form to Add New Bill */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-fit space-y-4">
          <h2 className="text-base font-semibold text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
            <Plus className="w-5 h-5 text-indigo-600" />
            Add Detailed Bill Entry
          </h2>

          <form onSubmit={handleAddBill} className="space-y-3.5">
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

            {/* Dates: Bill Date & Due Date */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Bill Issue Date</label>
                <input
                  type="date"
                  required
                  value={billDate}
                  onChange={(e) => setBillDate(e.target.value)}
                  className="w-full px-2.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Due Date</label>
                <input
                  type="date"
                  required
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-2.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>

            {/* Amounts breakdown */}
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[11px] font-medium text-slate-700 mb-1">Current Bill</label>
                <input
                  type="number"
                  required
                  placeholder="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-2.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-semibold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-700 mb-1">Arrears</label>
                <input
                  type="number"
                  placeholder="0"
                  value={previousArrears}
                  onChange={(e) => setPreviousArrears(e.target.value)}
                  className="w-full px-2.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-rose-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-700 mb-1">Late Fine</label>
                <input
                  type="number"
                  placeholder="0"
                  value={lateCharges}
                  onChange={(e) => setLateCharges(e.target.value)}
                  className="w-full px-2.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-amber-600"
                />
              </div>
            </div>

            {/* Total Payable Display */}
            <div className="p-3 bg-slate-100 rounded-xl flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-600">Calculated Total:</span>
              <span className="font-bold text-slate-900 text-sm">
                PKR {((parseFloat(amount) || 0) + (parseFloat(previousArrears) || 0) + (parseFloat(lateCharges) || 0)).toLocaleString()}
              </span>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Notes / Consumer No.</label>
              <input
                type="text"
                placeholder="e.g. Consumer # 0400012345 / Account # 10023"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-xl text-xs transition shadow-sm mt-2"
            >
              Record Bill
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
                  <div key={bill.id} className="flex items-center justify-between p-4 bg-amber-50/40 border border-amber-100 rounded-xl">
                    <div className="space-y-1">
                      <h4 className="font-semibold text-slate-800 text-xs">{bill.title}</h4>
                      <p className="text-[10px] text-slate-500 font-medium">
                        {bill.category} {bill.notes ? `• ${bill.notes}` : ''}
                      </p>
                      
                      <div className="flex gap-3 text-[10px] font-mono text-slate-500 pt-1">
                        <span>Issued: {bill.bill_date || 'N/A'}</span>
                        <span className="text-amber-700 font-semibold flex items-center gap-0.5">
                          <AlertCircle className="w-3 h-3" /> Due: {bill.due_date}
                        </span>
                      </div>
                    </div>

                    <div className="text-right space-y-2">
                      <p className="font-bold text-slate-900 text-sm">
                        PKR {Number(bill.total_payable || bill.amount).toLocaleString()}
                      </p>
                      {(bill.previous_arrears > 0 || bill.late_charges > 0) && (
                        <p className="text-[9px] text-slate-400">
                          Base: {bill.amount} | Arr: {bill.previous_arrears} | Fine: {bill.late_charges}
                        </p>
                      )}
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
              Paid