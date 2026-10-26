'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Target, CheckCircle2, Trash2, Edit3, X, TrendingUp, Calendar, DollarSign } from 'lucide-react';

export interface Goal {
  id: string;
  title: string;
  target_amount: number;
  current_amount: number;
  target_date?: string;
  category?: string;
  notes?: string;
}

const GOAL_CATEGORIES = [
  'Emergency Fund',
  'Savings & Investment',
  'Asset / Purchase',
  'Travel & Vacation',
  'Education',
  'Religious / Charity',
  'Other'
];

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Form State
  const [title, setTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('0');
  const [targetDate, setTargetDate] = useState('');
  const [category, setCategory] = useState(GOAL_CATEGORIES[0]);
  const [notes, setNotes] = useState('');

  // Edit / Add Fund State
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [fundGoal, setFundGoal] = useState<Goal | null>(null);
  const [fundAmountInput, setFundAmountInput] = useState('');

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('goals').select('*').order('created_at', { ascending: false });
    if (error) {
      console.error('Error fetching goals:', error.message);
    } else {
      setGoals(data || []);
    }
    setLoading(false);
  };

  const handleSaveGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !targetAmount) {
      alert('Please fill in title and target amount.');
      return;
    }

    const { error } = await supabase.from('goals').insert([
      {
        title,
        target_amount: parseFloat(targetAmount),
        current_amount: parseFloat(currentAmount || '0'),
        target_date: targetDate || null,
        category,
        notes,
      },
    ]);

    if (error) {
      alert('Error saving goal: ' + error.message);
    } else {
      resetForm();
      fetchGoals();
    }
  };

  const handleUpdateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGoal) return;

    const { error } = await supabase
      .from('goals')
      .update({
        title: editingGoal.title,
        target_amount: editingGoal.target_amount,
        target_date: editingGoal.target_date || null,
        category: editingGoal.category,
        notes: editingGoal.notes,
      })
      .eq('id', editingGoal.id);

    if (error) {
      alert('Error updating goal: ' + error.message);
    } else {
      setEditingGoal(null);
      fetchGoals();
    }
  };

  const handleAddFunds = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fundGoal || !fundAmountInput) return;

    const newTotal = Number(fundGoal.current_amount || 0) + parseFloat(fundAmountInput);

    const { error } = await supabase
      .from('goals')
      .update({ current_amount: newTotal })
      .eq('id', fundGoal.id);

    if (error) {
      alert('Error adding funds to goal: ' + error.message);
    } else {
      setFundGoal(null);
      setFundAmountInput('');
      fetchGoals();
    }
  };

  const handleDeleteGoal = async (id: string) => {
    if (!confirm('Kya aap is financial goal ko delete karna chahte hain?')) return;
    const { error } = await supabase.from('goals').delete().eq('id', id);
    if (error) alert('Error deleting goal: ' + error.message);
    else fetchGoals();
  };

  const resetForm = () => {
    setTitle('');
    setTargetAmount('');
    setCurrentAmount('0');
    setTargetDate('');
    setCategory(GOAL_CATEGORIES[0]);
    setNotes('');
  };

  const totalTarget = goals.reduce((sum, g) => sum + Number(g.target_amount), 0);
  const totalSaved = goals.reduce((sum, g) => sum + Number(g.current_amount), 0);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header & Overview Cards */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Financial Goals & Targets</h1>
          <p className="text-sm text-slate-500 mt-1">Set long-term savings goals and track your milestone achievements</p>
        </div>

        <div className="flex gap-3 w-full md:w-auto">
          <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl flex-1 md:w-44">
            <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wider">Total Targets</p>
            <p className="text-xl font-bold text-indigo-950 mt-0.5">PKR {totalTarget.toLocaleString()}</p>
          </div>
          <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex-1 md:w-44">
            <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Total Saved</p>
            <p className="text-xl font-bold text-emerald-950 mt-0.5">PKR {totalSaved.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Create Goal Form */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-fit space-y-4">
          <h2 className="text-base font-semibold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Plus className="w-5 h-5 text-indigo-600" />
            Create New Goal
          </h2>

          <form onSubmit={handleSaveGoal} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Goal Title</label>
              <input
                type="text"
                required
                placeholder="e.g. Emergency Fund / New Laptop"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
              >
                {GOAL_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Target (PKR)</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 500000"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-indigo-900"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Initial Saved (PKR)</label>
                <input
                  type="number"
                  placeholder="0"
                  value={currentAmount}
                  onChange={(e) => setCurrentAmount(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Target Date (Optional)</label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Notes / Plan</label>
              <input
                type="text"
                placeholder="e.g. Saving 20k per month"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-xl text-xs transition shadow-sm"
            >
              Save Goal
            </button>
          </form>
        </div>

        {/* Right Column: Goals Progress Grid */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h2 className="text-base font-semibold text-slate-800">Active Financial Goals</h2>

            {loading ? (
              <p className="text-xs text-slate-400 py-4 text-center">Loading goals...</p>
            ) : goals.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No active goals created yet. Set your first goal on the left.</p>
            ) : (
              <div className="space-y-4">
                {goals.map((g) => {
                  const target = Number(g.target_amount || 0);
                  const saved = Number(g.current_amount || 0);
                  const percentage = target > 0 ? Math.min(Math.round((saved / target) * 100), 100) : 0;
                  const isCompleted = saved >= target;

                  return (
                    <div key={g.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800 text-sm">{g.title}</span>
                          <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-medium">
                            {g.category || 'General'}
                          </span>
                          {isCompleted && (
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Achieved!
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setFundGoal(g)}
                            className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold text-xs rounded-lg transition"
                          >
                            + Add Funds
                          </button>
                          <button
                            onClick={() => setEditingGoal(g)}
                            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                            title="Edit Goal"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteGoal(g.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Delete Goal"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="flex justify-between text-xs text-slate-600">
                        <span>Saved: <strong className="text-emerald-700">PKR {saved.toLocaleString()}</strong></span>
                        <span>Target: <strong className="text-slate-900">PKR {target.toLocaleString()}</strong></span>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${
                            isCompleted ? 'bg-emerald-600' : 'bg-indigo-600'
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>{g.notes ? g.notes : ''}</span>
                        <div className="flex items-center gap-3">
                          {g.target_date && (
                            <span className="flex items-center gap-1 font-mono text-slate-400">
                              <Calendar className="w-3 h-3" /> Target: {g.target_date}
                            </span>
                          )}
                          <span className="font-bold text-indigo-900">{percentage}% completed</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Funds Modal */}
      {fundGoal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Add Savings to "{fundGoal.title}"</h3>
              <button onClick={() => setFundGoal(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddFunds} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Additional Saved Amount (PKR)</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 10000"
                  value={fundAmountInput}
                  onChange={(e) => setFundAmountInput(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-emerald-800"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setFundGoal(null)}
                  className="flex-1 py-2.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition shadow-xs"
                >
                  Deposit Funds
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Goal Modal */}
      {editingGoal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Edit Goal</h3>
              <button onClick={() => setEditingGoal(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateGoal} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={editingGoal.title}
                  onChange={(e) => setEditingGoal({ ...editingGoal, title: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Target Amount (PKR)</label>
                <input
                  type="number"
                  required
                  value={editingGoal.target_amount}
                  onChange={(e) => setEditingGoal({ ...editingGoal, target_amount: parseFloat(e.target.value) })}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Target Date</label>
                <input
                  type="date"
                  value={editingGoal.target_date || ''}
                  onChange={(e) => setEditingGoal({ ...editingGoal, target_date: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingGoal(null)}
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