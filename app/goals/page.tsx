'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Plus, 
  Target, 
  CheckCircle2, 
  Trash2, 
  Edit3, 
  X, 
  Calendar, 
  Archive, 
  History, 
  Repeat, 
  ArrowUpRight,
  RotateCcw
} from 'lucide-react';

export interface Goal {
  id: string;
  title: string;
  target_amount: number;
  current_amount: number;
  target_date?: string;
  category?: string;
  notes?: string;
  is_archived?: boolean;
  monthly_target?: number;
}

export interface Transaction {
  id: string;
  date: string;
  type: string;
  account_name: string;
  transfer_to?: string;
  amount: number;
  party_name: string;
  description: string;
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
  const [availableAccounts, setAvailableAccounts] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [viewTab, setViewTab] = useState<'active' | 'archived'>('active');

  // Form State
  const [title, setTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('0');
  const [monthlyTarget, setMonthlyTarget] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [category, setCategory] = useState(GOAL_CATEGORIES[0]);
  const [notes, setNotes] = useState('');

  // Modals & History State
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [fundGoal, setFundGoal] = useState<Goal | null>(null);
  const [historyGoal, setHistoryGoal] = useState<Goal | null>(null);
  const [goalTransactions, setGoalTransactions] = useState<Transaction[]>([]);

  // Add Funds State
  const [fundAmountInput, setFundAmountInput] = useState('');
  const [sourceAccount, setSourceAccount] = useState('');
  const [destinationAccount, setDestinationAccount] = useState('');
  const [fundDate, setFundDate] = useState('');

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setFundDate(today);
    fetchGoalsAndAccounts();
  }, []);

  const fetchGoalsAndAccounts = async () => {
    setLoading(true);

    // Fetch Goals
    const { data: gData, error: gError } = await supabase
      .from('goals')
      .select('*')
      .order('created_at', { ascending: false });

    if (gError) console.error('Error fetching goals:', gError.message);
    else setGoals(gData || []);

    // Fetch Accounts
    const { data: accData, error: accError } = await supabase.from('accounts').select('name');
    if (accError) console.error('Error fetching accounts:', accError.message);
    else if (accData && accData.length > 0) {
      const accNames = accData.map((a: { name: string }) => a.name);
      setAvailableAccounts(accNames);
      setSourceAccount(accNames[0]);
      setDestinationAccount(accNames[0]);
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
        monthly_target: monthlyTarget ? parseFloat(monthlyTarget) : null,
        target_date: targetDate || null,
        category,
        notes,
        is_archived: false
      },
    ]);

    if (error) {
      alert('Error saving goal: ' + error.message);
    } else {
      resetForm();
      fetchGoalsAndAccounts();
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
        monthly_target: editingGoal.monthly_target || null,
        target_date: editingGoal.target_date || null,
        category: editingGoal.category,
        notes: editingGoal.notes,
      })
      .eq('id', editingGoal.id);

    if (error) {
      alert('Error updating goal: ' + error.message);
    } else {
      setEditingGoal(null);
      fetchGoalsAndAccounts();
    }
  };

  const handleToggleArchive = async (goal: Goal) => {
    const updatedStatus = !goal.is_archived;
    const { error } = await supabase
      .from('goals')
      .update({ is_archived: updatedStatus })
      .eq('id', goal.id);

    if (error) alert('Error updating status: ' + error.message);
    else fetchGoalsAndAccounts();
  };

  const handleAddFunds = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fundGoal || !fundAmountInput || !sourceAccount) {
      alert('Please select accounts and enter deposit amount.');
      return;
    }

    const depositAmount = parseFloat(fundAmountInput);
    const newTotal = Number(fundGoal.current_amount || 0) + depositAmount;
    const isSameAccount = sourceAccount === destinationAccount;

    // 1. Update Goal Current Amount
    const { error: goalErr } = await supabase
      .from('goals')
      .update({ current_amount: newTotal })
      .eq('id', fundGoal.id);

    if (goalErr) {
      alert('Error updating goal: ' + goalErr.message);
      return;
    }

    // 2. Insert Transaction Record with Goal ID in Party Name for filtration
    const { error: txErr } = await supabase.from('transactions').insert([
      {
        date: fundDate,
        type: isSameAccount ? 'Adjustment' : 'Transfer',
        account_name: sourceAccount,
        transfer_to: isSameAccount ? null : destinationAccount,
        category: 'Savings & Investment',
        amount: depositAmount,
        party_name: `Goal Allocation: ${fundGoal.title}`,
        description: isSameAccount 
          ? `Internal goal earmark within ${sourceAccount} for: ${fundGoal.title}` 
          : `Savings transfer towards goal: ${fundGoal.title}`,
      },
    ]);

    if (txErr) {
      alert('Goal updated, but error recording transaction trail: ' + txErr.message);
    }

    // 3. Update Account Balances if accounts are different
    if (!isSameAccount) {
      const { data: srcList } = await supabase.from('accounts').select('*').eq('name', sourceAccount).limit(1);
      if (srcList && srcList.length > 0) {
        const srcAcc = srcList[0];
        const updatedSrcBal = Number(srcAcc.current_balance || 0) - depositAmount;
        await supabase.from('accounts').update({ current_balance: updatedSrcBal }).eq('id', srcAcc.id);
      }

      if (destinationAccount) {
        const { data: destList } = await supabase.from('accounts').select('*').eq('name', destinationAccount).limit(1);
        if (destList && destList.length > 0) {
          const destAcc = destList[0];
          const updatedDestBal = Number(destAcc.current_balance || 0) + depositAmount;
          await supabase.from('accounts').update({ current_balance: updatedDestBal }).eq('id', destAcc.id);
        }
      }
    }

    setFundGoal(null);
    setFundAmountInput('');
    fetchGoalsAndAccounts();
  };

  const openHistoryModal = async (goal: Goal) => {
    setHistoryGoal(goal);
    // Fetch transactions matched with goal title
    const { data } = await supabase
      .from('transactions')
      .select('*')
      .ilike('party_name', `%Goal Allocation: ${goal.title}%`)
      .order('date', { ascending: false });

    setGoalTransactions(data || []);
  };

  const handleDeleteGoal = async (id: string) => {
    if (!confirm('Kya aap is financial goal ko delete karna chahte hain?')) return;
    const { error } = await supabase.from('goals').delete().eq('id', id);
    if (error) alert('Error deleting goal: ' + error.message);
    else fetchGoalsAndAccounts();
  };

  const resetForm = () => {
    setTitle('');
    setTargetAmount('');
    setCurrentAmount('0');
    setMonthlyTarget('');
    setTargetDate('');
    setCategory(GOAL_CATEGORIES[0]);
    setNotes('');
  };

  const activeGoals = goals.filter((g) => !g.is_archived);
  const archivedGoals = goals.filter((g) => g.is_archived);
  const displayedGoals = viewTab === 'active' ? activeGoals : archivedGoals;

  const totalTarget = activeGoals.reduce((sum, g) => sum + Number(g.target_amount), 0);
  const totalSaved = activeGoals.reduce((sum, g) => sum + Number(g.current_amount), 0);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header & Summary */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Financial Goals & Targets</h1>
          <p className="text-sm text-slate-500 mt-1">Set savings targets, track recurring rules, and view deposit history trails</p>
        </div>

        <div className="flex gap-3 w-full md:w-auto">
          <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl flex-1 md:w-44">
            <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wider">Active Targets</p>
            <p className="text-xl font-bold text-indigo-950 mt-0.5">PKR {totalTarget.toLocaleString()}</p>
          </div>
          <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex-1 md:w-44">
            <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Total Saved</p>
            <p className="text-xl font-bold text-emerald-950 mt-0.5">PKR {totalSaved.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Form */}
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
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Target Total (PKR)</label>
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

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Monthly Rule (PKR)</label>
                <input
                  type="number"
                  placeholder="e.g. 20000"
                  value={monthlyTarget}
                  onChange={(e) => setMonthlyTarget(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-emerald-800"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Target Date</label>
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Notes / Plan</label>
              <input
                type="text"
                placeholder="e.g. Save 20k every 1st of the month"
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

        {/* Right Section: Goals Grid & Tabs */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            
            {/* View Tabs */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex gap-2">
                <button
                  onClick={() => setViewTab('active')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    viewTab === 'active' 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Active Goals ({activeGoals.length})
                </button>
                <button
                  onClick={() => setViewTab('archived')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                    viewTab === 'archived' 
                      ? 'bg-slate-800 text-white' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Archive className="w-3.5 h-3.5" /> Archived ({archivedGoals.length})
                </button>
              </div>
            </div>

            {loading ? (
              <p className="text-xs text-slate-400 py-4 text-center">Loading goals...</p>
            ) : displayedGoals.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">
                {viewTab === 'active' ? 'No active goals found. Create one from the left.' : 'No archived goals.'}
              </p>
            ) : (
              <div className="space-y-4">
                {displayedGoals.map((g) => {
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
                          {!g.is_archived && (
                            <button
                              onClick={() => setFundGoal(g)}
                              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold text-xs rounded-lg transition"
                            >
                              + Add Funds
                            </button>
                          )}
                          <button
                            onClick={() => openHistoryModal(g)}
                            className="p-1.5 text-slate-600 hover:bg-slate-200 rounded-lg transition"
                            title="View Transaction History"
                          >
                            <History className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditingGoal(g)}
                            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                            title="Edit Goal"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleToggleArchive(g)}
                            className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition"
                            title={g.is_archived ? "Restore Goal" : "Archive Goal"}
                          >
                            {g.is_archived ? <RotateCcw className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
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
                        <div className="flex items-center gap-3">
                          {g.monthly_target && (
                            <span className="flex items-center gap-1 font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md">
                              <Repeat className="w-3 h-3" /> PKR {Number(g.monthly_target).toLocaleString()}/mo
                            </span>
                          )}
                          <span>{g.notes || ''}</span>
                        </div>
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
                <label className="block text-xs font-medium text-slate-700 mb-1">Deposit Date</label>
                <input
                  type="date"
                  required
                  value={fundDate}
                  onChange={(e) => setFundDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Source Account</label>
                <select
                  value={sourceAccount}
                  onChange={(e) => setSourceAccount(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                >
                  {availableAccounts.map((acc) => (
                    <option key={acc} value={acc}>{acc}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Destination / Savings Account</label>
                <select
                  value={destinationAccount}
                  onChange={(e) => setDestinationAccount(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-indigo-700"
                >
                  {availableAccounts.map((acc) => (
                    <option key={acc} value={acc}>{acc}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Deposit Amount (PKR)</label>
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
                  Save Allocation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Goal Deposit History Trail Modal */}
      {historyGoal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Deposit History Trail</h3>
                <p className="text-xs text-slate-500">{historyGoal.title}</p>
              </div>
              <button onClick={() => setHistoryGoal(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto space-y-2">
              {goalTransactions.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">No deposit history recorded for this goal yet.</p>
              ) : (
                goalTransactions.map((tx) => (
                  <div key={tx.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <p className="font-semibold text-slate-800">{tx.account_name} {tx.transfer_to ? `➔ ${tx.transfer_to}` : ''}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{tx.date}</p>
                    </div>
                    <p className="font-bold text-emerald-700">+ PKR {Number(tx.amount).toLocaleString()}</p>
                  </div>
                ))
              )}
            </div>

            <button
              onClick={() => setHistoryGoal(null)}
              className="w-full py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition mt-2"
            >
              Close
            </button>
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
                <label className="block text-xs font-medium text-slate-700 mb-1">Monthly Rule (PKR)</label>
                <input
                  type="number"
                  value={editingGoal.monthly_target || ''}
                  onChange={(e) => setEditingGoal({ ...editingGoal, monthly_target: parseFloat(e.target.value) })}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-emerald-800"
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