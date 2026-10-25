'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, PieChart, AlertTriangle, CheckCircle2, DollarSign, Trash2, Edit3, X } from 'lucide-react';

export interface Budget {
  id: string;
  category: string;
  monthly_limit: number;
}

export interface Transaction {
  id: string;
  category: string;
  amount: number;
  type: string;
  date: string;
}

const CATEGORIES = [
  'Groceries & Food',
  'Utilities & Bills',
  'Fuel & Transport',
  'Shopping & Apparel',
  'Healthcare & Medical',
  'Dining Out',
  'Education',
  'Misc',
  'Other'
];

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentYearMonth, setCurrentYearMonth] = useState<string>('');

  // Form State
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [customCategory, setCustomCategory] = useState('');
  const [monthlyLimit, setMonthlyLimit] = useState('');

  // Edit State
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [editLimit, setEditLimit] = useState('');

  useEffect(() => {
    const yearMonth = new Date().toISOString().slice(0, 7);
    setCurrentYearMonth(yearMonth);
    fetchBudgetsAndTransactions();
  }, []);

  const fetchBudgetsAndTransactions = async () => {
    setLoading(true);

    // 1. Fetch Budgets
    const { data: bData, error: bErr } = await supabase.from('budgets').select('*');
    if (bErr) console.error('Error fetching budgets:', bErr.message);
    else setBudgets(bData || []);

    // 2. Fetch Transactions
    const { data: tData, error: tErr } = await supabase.from('transactions').select('*');
    if (tErr) console.error('Error fetching transactions:', tErr.message);
    else setTransactions(tData || []);

    setLoading(false);
  };

  // Add or Update Budget
  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalCategory = category === 'Other' ? customCategory.trim() : category;
    
    if (!finalCategory || !monthlyLimit) {
      alert('Please provide category and limit.');
      return;
    }

    const { error } = await supabase.from('budgets').upsert(
      [
        {
          category: finalCategory,
          monthly_limit: parseFloat(monthlyLimit),
        },
      ],
      { onConflict: 'category' }
    );

    if (error) {
      alert('Error saving budget: ' + error.message);
    } else {
      setMonthlyLimit('');
      setCustomCategory('');
      setCategory(CATEGORIES[0]);
      fetchBudgetsAndTransactions();
    }
  };

  // Handle Edit Modal Submit
  const handleUpdateBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBudget || !editLimit) return;

    const { error } = await supabase
      .from('budgets')
      .update({ monthly_limit: parseFloat(editLimit) })
      .eq('id', editingBudget.id);

    if (error) {
      alert('Error updating budget: ' + error.message);
    } else {
      setEditingBudget(null);
      setEditLimit('');
      fetchBudgetsAndTransactions();
    }
  };

  const handleDeleteBudget = async (id: string) => {
    if (!confirm('Kya aap is category budget ko delete karna chahte hain?')) return;
    const { error } = await supabase.from('budgets').delete().eq('id', id);
    if (error) alert('Error deleting budget: ' + error.message);
    else fetchBudgetsAndTransactions();
  };

  // Calculate actual spending per category strictly for the Current Month
  const spendingMap: { [key: string]: number } = {};
  if (currentYearMonth) {
    transactions.forEach((t) => {
      if (
        (t.type === 'Expense' || t.type === 'Bill Payment') &&
        t.date &&
        t.date.startsWith(currentYearMonth)
      ) {
        const cat = t.category || 'Other';
        spendingMap[cat] = (spendingMap[cat] || 0) + Number(t.amount);
      }
    });
  }

  const totalBudgetLimit = budgets.reduce((sum, b) => sum + Number(b.monthly_limit), 0);
  const totalSpent = Object.values(spendingMap).reduce((sum, amt) => sum + amt, 0);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header & Overview */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Monthly Budget & Limits</h1>
          <p className="text-sm text-slate-500 mt-1">Set category spending thresholds and monitor monthly financial discipline</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl flex-1 md:w-44">
            <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wider">Total Limit</p>
            <p className="text-xl font-bold text-indigo-950 mt-0.5">PKR {totalBudgetLimit.toLocaleString()}</p>
          </div>
          <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex-1 md:w-44">
            <p className="text-xs font-semibold text-rose-700 uppercase tracking-wider">Spent This Month</p>
            <p className="text-xl font-bold text-rose-950 mt-0.5">PKR {totalSpent.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Set Budget Form */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-fit space-y-4">
          <h2 className="text-base font-semibold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Plus className="w-5 h-5 text-indigo-600" />
            Set Category Budget
          </h2>

          <form onSubmit={handleSaveBudget} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Expense Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {category === 'Other' && (
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Custom Category Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Subscription / Maintenance"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-slate-900"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Monthly Limit (PKR)</label>
              <input
                type="number"
                required
                placeholder="e.g. 50000"
                value={monthlyLimit}
                onChange={(e) => setMonthlyLimit(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-indigo-900"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-xl text-xs transition shadow-sm"
            >
              Save Budget Limit
            </button>
          </form>
        </div>

        {/* Right Column: Budgets Progress List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h2 className="text-base font-semibold text-slate-800">Category Budgets & Progress (Current Month)</h2>

            {loading ? (
              <p className="text-xs text-slate-400 py-4 text-center">Loading budgets...</p>
            ) : budgets.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No category budgets defined yet. Set your first budget on the left.</p>
            ) : (
              <div className="space-y-4">
                {budgets.map((b) => {
                  const spent = spendingMap[b.category] || 0;
                  const limit = Number(b.monthly_limit);
                  const percentage = limit > 0 ? Math.min(Math.round((spent / limit) * 100), 100) : 0;
                  const isOver = spent > limit;

                  return (
                    <div key={b.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800 text-sm">{b.category}</span>
                          {isOver ? (
                            <span className="text-[10px] bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" /> Over Budget
                            </span>
                          ) : (
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> On Track
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setEditingBudget(b);
                              setEditLimit(b.monthly_limit.toString());
                            }}
                            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                            title="Edit Limit"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteBudget(b.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Delete Budget"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="flex justify-between text-xs text-slate-600">
                        <span>Spent This Month: <strong className="text-slate-900">PKR {spent.toLocaleString()}</strong></span>
                        <span>Limit: <strong className="text-slate-900">PKR {limit.toLocaleString()}</strong></span>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${
                            isOver ? 'bg-rose-600' : percentage > 80 ? 'bg-amber-500' : 'bg-emerald-600'
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <div className="text-right text-[10px] text-slate-400 font-medium">
                        {percentage}% utilized
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Budget Modal */}
      {editingBudget && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Edit Budget — {editingBudget.category}</h3>
              <button onClick={() => setEditingBudget(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateBudget} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">New Monthly Limit (PKR)</label>
                <input
                  type="number"
                  required
                  value={editLimit}
                  onChange={(e) => setEditLimit(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingBudget(null)}
                  className="flex-1 py-2.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
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