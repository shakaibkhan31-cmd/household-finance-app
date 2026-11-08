'use client';

import React, { useState, useEffect, Component, ErrorInfo, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { formatCurrency } from '@/lib/currency';
import TutorialModal from '@/components/TutorialModal';
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
  ArrowRight,
  Filter,
  X,
  AlertTriangle,
  Activity,
  PieChart
} from 'lucide-react';
import Link from 'next/link';

// Helper function to format date from YYYY-MM-DD to DD-MM-YYYY for display
const formatDateDisplay = (dateStr: string) => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return dateStr;
};

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean, error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Dashboard Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-center space-y-4">
          <h2 className="text-xl font-bold text-rose-600">Something went wrong on the Dashboard.</h2>
          <p className="text-xs text-slate-500 font-mono">{this.state.error?.message}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl cursor-pointer"
          >
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

interface Account {
  id: string;
  name?: string;
  account_name?: string;
  type?: string;
  account_type?: string;
  current_balance?: number;
  opening_balance?: number;
  user_id?: string;
}

interface Bill {
  id: string;
  provider?: string;
  title?: string;
  bill_name?: string;
  name?: string;
  category?: string;
  due_date?: string;
  amount?: number;
  bill_amount?: number;
  status?: string;
  payment_status?: string;
  notes?: string;
  description?: string;
  remarks?: string;
  user_id?: string;
}

interface Transaction {
  id: string;
  date?: string;
  transaction_date?: string;
  type?: string;
  category?: string;
  amount: number;
  description: string;
  account_name?: string;
  entered_by?: string;
  party_name?: string;
  user_id?: string;
}

interface Budget {
  id: string;
  category?: string;
  name?: string;
  title?: string;
  allocated_amount?: number;
  amount?: number;
  budget_amount?: number;
  limit?: number;
  monthly_limit?: number;
  budget_limit?: number;
  spent_amount?: number;
  user_id?: string;
}

export default function FinanceDashboard() {
  return (
    <ErrorBoundary>
      <DashboardContent />
    </ErrorBoundary>
  );
}

function DashboardContent() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [allBills, setAllBills] = useState<Bill[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [currency, setCurrency] = useState('PKR');
  const [memberName, setMemberName] = useState<string>('Member');

  // Tutorial State
  const [showTutorial, setShowTutorial] = useState(false);
  const [userId, setUserId] = useState('');

  // Date Filter States
  const [filterMode, setFilterMode] = useState<'month' | 'year' | 'custom'>('month');
  const [selectedMonth, setSelectedMonth] = useState('2026-11');
  const [selectedYear, setSelectedYear] = useState('2026');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [todayStr, setTodayStr] = useState('2026-11-04');

  // Quick Add Form States
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('Expense');
  const [description, setDescription] = useState('');
  const [enteredBy, setEnteredBy] = useState('Member');
  const [selectedAccount, setSelectedAccount] = useState('');

  // Mobile Quick Action Modal States
  const [showQuickModal, setShowQuickModal] = useState(false);
  const [modalType, setModalType] = useState<'Expense' | 'Income'>('Expense');
  const [quickAmount, setQuickAmount] = useState('');
  const [quickCategory, setQuickCategory] = useState('');
  const [quickAccount, setQuickAccount] = useState('');

  // Bill Pay Modal States
  const [selectedBillToPay, setSelectedBillToPay] = useState<Bill | null>(null);
  const [paymentAccountId, setPaymentAccountId] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);

      const { data: { session } } = await supabase.auth.getSession();
      let activeUser = session?.user;

      if (!activeUser) {
        const { data: { user: fetchedUser } } = await supabase.auth.getUser();
        activeUser = fetchedUser ?? undefined;
      }

      if (!activeUser) {
        setLoading(false);
        return;
      }

      setUserId(activeUser.id);

      const { data: profile } = await supabase
        .from('profiles')
        .select('preferred_currency, has_seen_tutorial, full_name')
        .eq('id', activeUser.id)
        .maybeSingle();

      if (profile && profile.preferred_currency) {
        setCurrency(profile.preferred_currency);
      }

      let computedName = activeUser.email ? activeUser.email.split('@')[0] : 'Member';
      if (profile && profile.full_name) {
        computedName = profile.full_name;
      }

      let targetUserId = activeUser.id;
      
      if (activeUser.email) {
        const cleanEmail = activeUser.email.trim().toLowerCase();
        
        let { data: memberRecord } = await supabase
          .from('family_members')
          .select('*')
          .ilike('member_email', cleanEmail)
          .maybeSingle();

        if (!memberRecord) {
          const { data: allMembers } = await supabase
            .from('family_members')
            .select('*');
          
          if (allMembers) {
            const matched = allMembers.find(m => m.member_email && m.member_email.trim().toLowerCase() === cleanEmail);
            if (matched) {
              memberRecord = matched;
            }
          }
        }

        if (memberRecord) {
          if (memberRecord.member_name) {
            computedName = memberRecord.member_name;
          }
          if (memberRecord.owner_id) {
            targetUserId = memberRecord.owner_id;
            setShowTutorial(false);
          }
        } else {
          if (profile && profile.has_seen_tutorial === false) {
            setShowTutorial(true);
          }
        }
      }
      setMemberName(computedName);

      const { data: accData, error: accErr } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', targetUserId);

      if (!accErr && accData && accData.length > 0) {
        setAccounts(accData);
        const firstAccName = accData[0]?.name || accData[0]?.account_name || '';
        if (!selectedAccount) setSelectedAccount(firstAccName);
        if (!paymentAccountId) setPaymentAccountId(firstAccName);
        if (!quickAccount) setQuickAccount(firstAccName);
      }

      const { data: txData, error: txErr } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', targetUserId);

      if (!txErr && txData) setTransactions(txData);

      const { data: billData, error: billErr } = await supabase
        .from('bills')
        .select('*')
        .eq('user_id', targetUserId);

      if (!billErr && billData) {
        setAllBills(billData);
      }

      const { data: budgetData, error: budgetErr } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', targetUserId);

      if (!budgetErr && budgetData) {
        setBudgets(budgetData);
        if (budgetData.length > 0 && !quickCategory) {
          const firstBudgetName = budgetData[0]?.category || budgetData[0]?.name || budgetData[0]?.title || 'General';
          setQuickCategory(firstBudgetName);
        }
      }

    } catch (err) {
      console.error('Fetch error caught:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setIsMounted(true);
    try {
      const now = new Date();
      setSelectedMonth(now.toISOString().slice(0, 7));
      setSelectedYear(now.getFullYear().toString());
      setTodayStr(now.toISOString().slice(0, 10));
    } catch (e) {
      // Fallback
    }
    fetchData();
  }, []);

  if (!isMounted) return null;

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !description || !selectedAccount) {
      return alert('Amount, Description, and Account are required!');
    }

    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      const currentUserId = session?.user?.id || userId;

      if (!currentUserId) {
        alert('User not authenticated!');
        setLoading(false);
        return;
      }

      const currentDate = new Date().toISOString().split('T')[0];
      const { error } = await supabase.from('transactions').insert([
        {
          type,
          amount: parseFloat(amount),
          description,
          entered_by: memberName,
          account_name: selectedAccount,
          date: currentDate,
          transaction_date: currentDate,
          user_id: currentUserId,
        },
      ]);

      if (error) {
        alert('Error: ' + error.message);
      } else {
        setAmount('');
        setDescription('');
        fetchData();
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMobileQuickSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickAmount || !quickAccount) {
      return alert('Amount and Account are required!');
    }

    const finalCategory = quickCategory || (modalType === 'Expense' ? (budgets[0]?.category || budgets[0]?.name || 'General') : 'Salary / Inflow');

    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      const currentUserId = session?.user?.id || userId;

      if (!currentUserId) {
        alert('User not authenticated!');
        setLoading(false);
        return;
      }

      const currentDate = new Date().toISOString().split('T')[0];
      const { error } = await supabase.from('transactions').insert([
        {
          type: modalType,
          amount: parseFloat(quickAmount),
          description: `${modalType} - ${finalCategory}`,
          category: finalCategory,
          entered_by: memberName,
          account_name: quickAccount || selectedAccount,
          date: currentDate,
          transaction_date: currentDate,
          user_id: currentUserId,
        },
      ]);

      if (error) {
        alert('Error: ' + error.message);
      } else {
        setQuickAmount('');
        setShowQuickModal(false);
        fetchData();
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPayBill = async () => {
    if (!selectedBillToPay) return;
    if (!paymentAccountId) return alert('Please select an account to pay from!');

    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      const currentUserId = session?.user?.id || userId;

      if (!currentUserId) {
        setLoading(false);
        return;
      }

      const currentDate = new Date().toISOString().split('T')[0];
      const billAmt = Number(selectedBillToPay.amount ?? selectedBillToPay.bill_amount ?? 0);
      
      // Bill Title / Provider for Party Name
      const billTitle = selectedBillToPay.title || selectedBillToPay.provider || selectedBillToPay.bill_name || selectedBillToPay.name || 'Utility Bill';
      
      // Bill Notes for Description / Remarks
      const billNotes = selectedBillToPay.notes || selectedBillToPay.description || selectedBillToPay.remarks || `Bill Payment: ${billTitle}`;
      
      const billCategory = selectedBillToPay.category || 'Utilities & Bills';

      // 1. Mark current bill as Paid
      await supabase
        .from('bills')
        .update({ status: 'Paid', payment_status: 'PAID' })
        .eq('id', selectedBillToPay.id)
        .eq('user_id', currentUserId);

      // 2. Insert transaction record with party_name and description
      await supabase.from('transactions').insert([
        {
          type: 'Expense',
          amount: billAmt,
          category: billCategory,
          description: billNotes,
          party_name: billTitle,
          entered_by: memberName,
          account_name: paymentAccountId,
          date: currentDate,
          transaction_date: currentDate,
          user_id: currentUserId,
        },
      ]);

      // 3. If recurring / variable recurring, generate next month's bill automatically
      const isRecurring = (selectedBillToPay as any).is_recurring || (selectedBillToPay as any).recurring || (selectedBillToPay as any).frequency;
      if (isRecurring) {
        let nextDueDate = currentDate;
        try {
          const currentDue = selectedBillToPay.due_date ? new Date(selectedBillToPay.due_date) : new Date();
          currentDue.setMonth(currentDue.getMonth() + 1);
          nextDueDate = currentDue.toISOString().split('T')[0];
        } catch (e) {
          const d = new Date();
          d.setDate(d.getDate() + 30);
          nextDueDate = d.toISOString().split('T')[0];
        }

        await supabase.from('bills').insert([
          {
            user_id: currentUserId,
            title: selectedBillToPay.title || billTitle,
            provider: selectedBillToPay.provider || billTitle,
            category: billCategory,
            amount: billAmt,
            bill_amount: billAmt,
            due_date: nextDueDate,
            status: 'Pending',
            payment_status: 'PENDING',
            notes: selectedBillToPay.notes || '',
            description: selectedBillToPay.description || '',
            is_recurring: true,
          }
        ]);
      }

      setSelectedBillToPay(null);
      fetchData();
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = transactions.filter((tx) => {
    if (!tx) return false;
    const txDate = (tx.date || tx.transaction_date || '').trim();
    if (!txDate) return false;
    const datePrefix = txDate.slice(0, 10);

    if (filterMode === 'month') {
      return selectedMonth ? datePrefix.startsWith(selectedMonth) : true;
    } else if (filterMode === 'year') {
      return selectedYear ? datePrefix.startsWith(selectedYear) : true;
    } else if (filterMode === 'custom') {
      if (!customStart || !customEnd) return true;
      return datePrefix >= customStart && datePrefix <= customEnd;
    }
    return true;
  }).sort((a, b) => {
    const dateA = (a.date || a.transaction_date || '');
    const dateB = (b.date || b.transaction_date || '');
    return dateB.localeCompare(dateA); // Latest date first
  });

  // Filter bills according to selected date range and pending status
  const bills = allBills.filter((b) => {
    const stat = (b?.status || b?.payment_status || '').toUpperCase();
    const isPending = stat === 'PENDING' || stat === 'UNPAID';
    if (!isPending) return false;

    const dueDate = (b?.due_date || '').trim();
    if (!dueDate) return true;
    const datePrefix = dueDate.slice(0, 10);

    if (filterMode === 'month') {
      return selectedMonth ? datePrefix.startsWith(selectedMonth) : true;
    } else if (filterMode === 'year') {
      return selectedYear ? datePrefix.startsWith(selectedYear) : true;
    } else if (filterMode === 'custom') {
      if (!customStart || !customEnd) return true;
      return datePrefix >= customStart && datePrefix <= customEnd;
    }
    return true;
  });

  const liquidAccounts = accounts.filter(a => {
    const accType = (a?.type || a?.account_type || '').toLowerCase();
    return !accType.includes('credit');
  });

  const creditCardAccounts = accounts.filter(a => {
    const accType = (a?.type || a?.account_type || '').toLowerCase();
    return accType.includes('credit');
  });

  const totalAvailableCash = liquidAccounts.reduce((acc, a) => {
    const bal = a?.current_balance ?? a?.opening_balance ?? 0;
    return acc + Number(bal || 0);
  }, 0);

  const totalCreditLiability = creditCardAccounts.reduce((acc, a) => {
    const bal = a?.current_balance ?? a?.opening_balance ?? 0;
    return acc + Number(bal || 0);
  }, 0);
  
  const filteredIncome = filteredTransactions
    .filter((t) => {
      const tType = (t?.type || '').trim().toLowerCase();
      const tCat = (t?.category || '').trim().toLowerCase();
      return tType.includes('income') || tType.includes('deposit') || tType.includes('inflow') || tCat.includes('income');
    })
    .reduce((sum, t) => sum + Number(t?.amount || 0), 0);

  const filteredExpense = filteredTransactions
    .filter((t) => {
      const tType = (t?.type || '').trim().toLowerCase();
      return tType.includes('expense') || tType.includes('outflow') || tType.includes('bill');
    })
    .reduce((sum, t) => sum + Number(t?.amount || 0), 0);

  const urgentBillsCount = bills.filter(b => {
    if (!b || !b.due_date || !todayStr) return false;
    return b.due_date <= todayStr;
  }).length;

  const processedBudgets = budgets.map((b) => {
    const bName = b?.category || b?.name || b?.title || 'General';
    const alloc = Number(b?.allocated_amount ?? b?.amount ?? b?.budget_amount ?? b?.limit ?? b?.monthly_limit ?? b?.budget_limit ?? 20000);
    
    const calcSpent = filteredTransactions
      .filter(t => {
        const tCat = (t?.category || '').toLowerCase();
        const tDesc = (t?.description || '').toLowerCase();
        const nameLower = bName.toLowerCase();
        return tCat.includes(nameLower) || tDesc.includes(nameLower);
      })
      .reduce((sum, t) => sum + Number(t?.amount || 0), 0);

    const spent = calcSpent > 0 ? calcSpent : Number(b?.spent_amount || 0);
    const pct = alloc > 0 ? Math.round((spent / alloc) * 100) : 0;

    return {
      ...b,
      bName,
      alloc,
      spent,
      pct: Math.min(pct, 100)
    };
  }).sort((itemA, itemB) => itemB.spent - itemA.spent);

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8 text-slate-800 dark:text-slate-100 transition-colors relative pb-28 md:pb-8">
      {showTutorial && <TutorialModal userId={userId} onFinish={() => { setShowTutorial(false); fetchData(); }} />}
      
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-800 gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">My Household Overview</h1>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 font-medium">Complete summary of your available funds, income, expenses, and pending bills.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchData}
              className="flex items-center gap-2 text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-4 py-2.5 rounded-xl transition border border-slate-200 dark:border-slate-700 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Data
            </button>
          </div>
        </div>

        {/* Smart Notification Alert Banner */}
        {urgentBillsCount > 0 && (
          <div className="bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 p-4 rounded-2xl flex items-center justify-between text-xs font-medium shadow-xs">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
              <span><strong>Attention Required:</strong> You have {urgentBillsCount} bill(s) due or overdue for payment.</span>
            </div>
            <Link href="/bills" className="font-bold underline hover:text-amber-800 dark:hover:text-amber-300">
              View Bills
            </Link>
          </div>
        )}

        {/* Date Filter Bar */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-indigo-500 mr-1" />
            <button
              onClick={() => setFilterMode('month')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                filterMode === 'month' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setFilterMode('year')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                filterMode === 'year' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              Yearly
            </button>
            <button
              onClick={() => setFilterMode('custom')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                filterMode === 'custom' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              Custom Range
            </button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {filterMode === 'month' && (
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 outline-none font-medium"
              />
            )}
            {filterMode === 'year' && (
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 outline-none font-medium"
              >
                <option value="2026">2026</option>
                <option value="2025">2025</option>
                <option value="2024">2024</option>
              </select>
            )}
            {filterMode === 'custom' && (
              <div className="flex items-center gap-1.5">
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 outline-none"
                />
                <span className="text-xs text-slate-400">to</span>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 outline-none"
                />
              </div>
            )}
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">Available Money</span>
              <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl">
                <Wallet className="w-5 h-5" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-3">
              {formatCurrency(Number(totalAvailableCash || 0), currency)}
            </h3>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-2 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> Across {liquidAccounts.length} Liquid Accounts & Wallets
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">Total Income</span>
              <div className="p-2.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl">
                <ArrowUpCircle className="w-5 h-5" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-3">
              {formatCurrency(Number(filteredIncome || 0), currency)}
            </h3>
            <p className="text-[11px] text-slate-400 font-medium mt-2">Selected Period Inflow</p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">Total Expenses</span>
              <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-xl">
                <ArrowDownCircle className="w-5 h-5" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-3">
              {formatCurrency(Number(filteredExpense || 0), currency)}
            </h3>
            <p className="text-[11px] text-rose-500 font-medium mt-2 flex items-center gap-1">
              <TrendingDown className="w-3.5 h-3.5" /> Selected Period Outflow
            </p>
          </div>
        </div>

        {/* Income vs Expense Balance & Budget Status */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-xs uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-500" /> Income vs Expense Balance
            </h3>
            
            <div className="space-y-3 pt-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-blue-600 dark:text-blue-400">Income: {formatCurrency(Number(filteredIncome || 0), currency)}</span>
                <span className="text-rose-600 dark:text-rose-400">Expenses: {formatCurrency(Number(filteredExpense || 0), currency)}</span>
              </div>
              
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-3.5 rounded-full overflow-hidden flex">
                <div 
                  className="bg-blue-500 h-full transition-all duration-500" 
                  style={{ width: `${filteredIncome + filteredExpense > 0 ? (filteredIncome / (filteredIncome + filteredExpense)) * 100 : 50}%` }}
                ></div>
                <div 
                  className="bg-rose-500 h-full transition-all duration-500" 
                  style={{ width: `${filteredIncome + filteredExpense > 0 ? (filteredExpense / (filteredIncome + filteredExpense)) * 100 : 50}%` }}
                ></div>
              </div>
              <p className="text-[11px] text-slate-400 text-center">Remaining Period Balance: {formatCurrency(Number((filteredIncome || 0) - (filteredExpense || 0)), currency)}</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider flex items-center gap-2">
                <PieChart className="w-4 h-4 text-emerald-500" /> Category Budget Limits
              </h3>
              <Link href="/budgets" className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
                View All
              </Link>
            </div>

            {processedBudgets.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">No budgets configured yet.</p>
            ) : (
              <div className="space-y-3 max-h-40 overflow-y-auto pr-1">
                {processedBudgets.map((b, idx) => (
                  <div key={b.id || idx} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-slate-700 dark:text-slate-200">{b.bName}</span>
                      <span className="text-slate-400">{formatCurrency(b.spent, currency)} / {formatCurrency(b.alloc, currency)}</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${b.pct > 80 ? 'bg-rose-500' : b.pct > 40 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                        style={{ width: `${b.pct}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <div className="lg:col-span-2 space-y-6">
            
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-indigo-500" /> Accounts & Wallets Summary
                </h3>
                <Link href="/accounts" className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1">
                  Manage <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {accounts.map((acc) => {
                  const accName = acc?.name || acc?.account_name || 'Account';
                  const accType = acc?.type || acc?.account_type || 'Bank';
                  const isCreditCard = accType.toLowerCase().includes('credit');
                  const accBal = Number(acc?.current_balance ?? acc?.opening_balance ?? 0);
                  return (
                    <div key={acc.id} className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 flex justify-between items-center">
                      <div>
                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">{accName}</p>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mt-0.5">{accType}</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-base font-bold ${isCreditCard ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>
                          {formatCurrency(accBal, currency)}
                        </p>
                        {isCreditCard && (
                          <span className="text-[9px] text-rose-500 font-bold uppercase tracking-wider block">Outstanding</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <PlusCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> Quick Transaction Entry
              </h3>

              <form onSubmit={handleAddTransaction} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Transaction Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 outline-none font-medium cursor-pointer"
                  >
                    <option value="Expense">Expense</option>
                    <option value="Income">Income</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Account / Wallet</label>
                  <select
                    value={selectedAccount}
                    onChange={(e) => setSelectedAccount(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 outline-none font-medium cursor-pointer"
                  >
                    {accounts.map((acc) => {
                      const accName = acc?.name || acc?.account_name || '';
                      return (
                        <option key={acc.id} value={accName}>
                          {accName}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Amount ({currency})</label>
                  <input
                    type="number"
                    placeholder="0.00"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 outline-none font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Description / Note</label>
                  <input
                    type="text"
                    placeholder="e.g. Groceries / Fuel"
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 outline-none"
                  />
                </div>

                <div className="sm:col-span-2 pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-xl transition text-xs shadow-sm cursor-pointer"
                  >
                    {loading ? 'Saving Entry...' : 'Save Quick Entry'}
                  </button>
                </div>
              </form>
            </div>

          </div>

          <div className="space-y-6">
            
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-amber-500" /> Pending Bills Due
                </h2>
                <Link href="/bills" className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1">
                  View All <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              {bills.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">No pending bills right now.</p>
              ) : (
                <div className="space-y-3">
                  {bills.map((bill) => {
                    const billAmt = Number(bill?.amount ?? bill?.bill_amount ?? 0);
                    const providerName = bill?.provider || bill?.title || bill?.bill_name || bill?.name || 'Utility Bill';

                    return (
                      <div key={bill.id} className="p-3.5 rounded-xl border bg-amber-50/40 dark:bg-amber-950/20 border-amber-200/80 dark:border-amber-900/40 space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-bold text-slate-800 dark:text-white text-xs">{providerName}</h4>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">Due Date: {formatDateDisplay(bill?.due_date || '')}</p>
                          </div>
                          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300">
                            Due
                          </span>
                        </div>

                        <div className="flex justify-between items-center pt-1">
                          <span className="text-sm font-bold text-slate-900 dark:text-white">{formatCurrency(billAmt, currency)}</span>
                          <button
                            onClick={() => {
                              setSelectedBillToPay(bill);
                              if (accounts.length > 0) {
                                setPaymentAccountId(accounts[0]?.name || accounts[0]?.account_name || '');
                              }
                            }}
                            className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold px-2.5 py-1 rounded-lg transition shadow-xs cursor-pointer"
                          >
                            <CheckCircle className="w-3 h-3" /> Pay Now
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-indigo-500" /> Recent Transactions
                </h2>
                <Link href="/transactions" className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1">
                  Full Ledger <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              {filteredTransactions.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">No recent transactions recorded for this period.</p>
              ) : (
                <div className="space-y-3">
                  {filteredTransactions.slice(0, 4).map((tx) => {
                    const isIncome = (tx?.type || '').toLowerCase().includes('income') || (tx?.type || '').toLowerCase().includes('inflow');
                    return (
                      <div key={tx.id} className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
                        <div className="overflow-hidden pr-2">
                          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{tx?.description}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{formatDateDisplay(tx?.date || tx?.transaction_date || '')}</p>
                        </div>
                        <span className={`text-xs font-bold shrink-0 ${isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-800 dark:text-slate-200'}`}>
                          {isIncome ? '+' : '-'} {formatCurrency(Number(tx?.amount || 0), currency)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

        </div>

      </div>

      {/* Mobile Persistent Quick Action Sticky Bar */}
      <div className="md:hidden fixed bottom-4 left-4 right-4 z-40 bg-slate-900/95 backdrop-blur-md border border-slate-800 p-3 rounded-2xl shadow-2xl flex items-center justify-between gap-3">
        <button
          onClick={() => { 
            setModalType('Expense'); 
            setShowQuickModal(true); 
            if(accounts.length > 0) setQuickAccount(accounts[0]?.name || accounts[0]?.account_name || ''); 
            if(budgets.length > 0) setQuickCategory(budgets[0]?.category || budgets[0]?.name || 'General');
          }}
          className="flex-1 py-2.5 bg-rose-600/90 hover:bg-rose-600 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-lg shadow-rose-600/20 cursor-pointer"
        >
          <span>+ Add Expense</span>
        </button>
        <button
          onClick={() => { 
            setModalType('Income'); 
            setShowQuickModal(true); 
            if(accounts.length > 0) setQuickAccount(accounts[0]?.name || accounts[0]?.account_name || ''); 
            setQuickCategory('Salary / Inflow');
          }}
          className="flex-1 py-2.5 bg-emerald-600/90 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/20 cursor-pointer"
        >
          <span>+ Add Income</span>
        </button>
      </div>

      {/* Quick Entry Modal Popup with Dynamic Categories */}
      {showQuickModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-t-3xl sm:rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in slide-in-from-bottom-4">
            
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${modalType === 'Expense' ? 'bg-rose-500' : 'bg-emerald-500'}`}></span>
                Quick {modalType} Entry
              </h3>
              <button
                onClick={() => setShowQuickModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleMobileQuickSubmit} className="space-y-4">
              
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Amount ({currency}) *
                </label>
                <input
                  type="number"
                  placeholder="0.00"
                  required
                  autoFocus
                  value={quickAmount}
                  onChange={(e) => setQuickAmount(e.target.value)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Category *
                </label>
                <select
                  value={quickCategory}
                  onChange={(e) => setQuickCategory(e.target.value)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-100 outline-none cursor-pointer"
                >
                  {modalType === 'Expense' ? (
                    budgets.length > 0 ? (
                      budgets.map((b) => {
                        const bName = b?.category || b?.name || b?.title || 'General';
                        return (
                          <option key={b.id} value={bName}>
                            {bName}
                          </option>
                        );
                      })
                    ) : (
                      <option value="General">General Expenses</option>
                    )
                  ) : (
                    <>
                      <option value="Salary / Inflow">Salary / Inflow</option>
                      <option value="Business Income">Business Income</option>
                      <option value="Support / Gift">Support / Gift</option>
                      <option value="Rental Income">Rental Income</option>
                      <option value="Other Inflow">Other Inflow</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Account / Wallet *
                </label>
                <select
                  value={quickAccount}
                  onChange={(e) => setQuickAccount(e.target.value)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-100 outline-none cursor-pointer"
                >
                  {accounts.map((acc) => {
                    const accName = acc?.name || acc?.account_name || '';
                    return (
                      <option key={acc.id} value={accName}>
                        {accName}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                <span>Transaction Date:</span>
                <span className="font-mono font-semibold text-indigo-400">{formatDateDisplay(todayStr)} (Today)</span>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowQuickModal(false)}
                  className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold rounded-xl text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={`flex-1 py-3 text-white font-semibold rounded-xl text-xs transition shadow-lg cursor-pointer ${
                    modalType === 'Expense' ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/20' : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20'
                  }`}
                >
                  {loading ? 'Saving...' : `Save ${modalType}`}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {selectedBillToPay && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-500" /> Confirm Bill Payment
              </h3>
              <button
                onClick={() => setSelectedBillToPay(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl space-y-1.5 border border-slate-100 dark:border-slate-800">
              <p className="text-xs text-slate-500 dark:text-slate-400">Bill Provider</p>
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                {selectedBillToPay?.provider || selectedBillToPay?.title || selectedBillToPay?.bill_name || selectedBillToPay?.name || 'Utility Bill'}
              </p>
              
              <div className="flex justify-between items-center pt-2 border-t border-slate-200/60 dark:border-slate-700/60 mt-2">
                <span className="text-xs text-slate-500 dark:text-slate-400">Amount Due</span>
                <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(Number(selectedBillToPay?.amount ?? selectedBillToPay?.bill_amount ?? 0), currency)}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Select Account to Pay From
              </label>
              <select
                value={paymentAccountId}
                onChange={(e) => setPaymentAccountId(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 outline-none font-medium cursor-pointer"
              >
                {accounts.map((acc) => {
                  const accName = acc?.name || acc?.account_name || '';
                  const accBal = Number(acc?.current_balance ?? acc?.opening_balance ?? 0);
                  return (
                    <option key={acc.id} value={accName}>
                      {accName} (Balance: {formatCurrency(accBal, currency)})
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedBillToPay(null)}
                className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={handleConfirmPayBill}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition shadow-xs cursor-pointer"
              >
                {loading ? 'Processing...' : 'Confirm & Pay'}
              </button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}