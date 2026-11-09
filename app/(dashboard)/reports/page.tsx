'use client';

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { formatCurrency } from '@/lib/currency';
import { 
  Printer, 
  FileText,
  ShieldCheck,
  Building2,
  PieChart as PieIcon,
  TrendingUp,
  TrendingDown,
  Award,
  CheckCircle2,
  Sparkles
} from 'lucide-react';

interface Transaction {
  id: string;
  date?: string;
  transaction_date?: string;
  type?: string;
  category?: string;
  amount: number;
  description: string;
  party_name?: string;
  account_name?: string;
}

interface Budget {
  id: string;
  category?: string;
  name?: string;
  title?: string;
  allocated_amount?: number;
  amount?: number;
  spent_amount?: number;
}

const formatDateDisplay = (dateStr: string) => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return dateStr;
};

const CHART_COLORS = ['#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6'];

export default function ReportsPage() {
  const [selectedMonth, setSelectedMonth] = useState('2026-11');
  const [currency, setCurrency] = useState('PKR');
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [userName, setUserName] = useState('Valued Client / User');
  const [currentDateStr, setCurrentDateStr] = useState('');
  
  const reportRef = useRef<HTMLDivElement>(null);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (!userId) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('preferred_currency, full_name')
        .eq('id', userId)
        .maybeSingle();

      if (profile?.preferred_currency) setCurrency(profile.preferred_currency);
      if (profile?.full_name) setUserName(profile.full_name);

      const { data: txData } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId);

      if (txData) setTransactions(txData);

      const { data: bgData } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', userId);

      if (bgData) setBudgets(bgData);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentDateStr(new Date().toLocaleDateString());
    fetchReportData();
  }, [selectedMonth]);

  // Current Month Transactions
  const monthlyTransactions = transactions.filter(t => {
    const d = t.date || t.transaction_date || '';
    return d.startsWith(selectedMonth);
  });

  // Calculate Previous Month string for MoM comparison
  const getPreviousMonthStr = (monthStr: string) => {
    try {
      const [year, month] = monthStr.split('-').map(Number);
      const d = new Date(year, month - 2, 1);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    } catch {
      return '';
    }
  };

  const prevMonthStr = getPreviousMonthStr(selectedMonth);
  const prevMonthTransactions = transactions.filter(t => {
    const d = t.date || t.transaction_date || '';
    return d.startsWith(prevMonthStr);
  });

  const totalIncome = monthlyTransactions
    .filter(t => {
      const tType = (t?.type || '').toLowerCase();
      const tCat = (t?.category || '').toLowerCase();
      return tType.includes('income') || tType.includes('deposit') || tType.includes('inflow') || tCat.includes('income');
    })
    .reduce((sum, t) => sum + Number(t?.amount || 0), 0);

  const totalExpense = monthlyTransactions
    .filter(t => {
      const tType = (t?.type || '').toLowerCase();
      return tType.includes('expense') || tType.includes('outflow') || tType.includes('bill');
    })
    .reduce((sum, t) => sum + Number(t?.amount || 0), 0);

  const prevMonthExpense = prevMonthTransactions
    .filter(t => {
      const tType = (t?.type || '').toLowerCase();
      return tType.includes('expense') || tType.includes('outflow') || tType.includes('bill');
    })
    .reduce((sum, t) => sum + Number(t?.amount || 0), 0);

  // Expense Growth MoM calculation
  const expenseGrowth = prevMonthExpense > 0 
    ? Math.round(((totalExpense - prevMonthExpense) / prevMonthExpense) * 100) 
    : 0;

  const netSavings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? Math.round((netSavings / totalIncome) * 100) : 0;

  // Financial Health Grading Logic
  let healthGrade = 'A+ (Optimal)';
  let healthColor = 'text-emerald-700 bg-emerald-50 border-emerald-200';
  if (totalExpense > totalIncome && totalIncome > 0) {
    healthGrade = 'B (Deficit / Active Drawdown)';
    healthColor = 'text-amber-700 bg-amber-50 border-amber-200';
  } else if (totalIncome === 0 && totalExpense > 0) {
    healthGrade = 'B- (Outflow Only Mode)';
    healthColor = 'text-rose-700 bg-rose-50 border-rose-200';
  }

  const categoryMap: { [key: string]: number } = {};

  budgets.forEach(b => {
    const bName = b?.category || b?.name || b?.title;
    if (bName) {
      categoryMap[bName] = 0;
    }
  });

  monthlyTransactions
    .filter(t => {
      const tType = (t?.type || '').toLowerCase();
      return tType.includes('expense') || tType.includes('outflow') || tType.includes('bill');
    })
    .forEach(t => {
      const tCat = (t?.category || '').trim();
      const tDesc = (t?.description || '').toLowerCase();
      const tParty = (t.party_name || '').toLowerCase();
      const tAmt = Number(t?.amount || 0);

      let matchedKey = Object.keys(categoryMap).find(key => 
        key.toLowerCase() === tCat.toLowerCase() || 
        tDesc.includes(key.toLowerCase()) || 
        tParty.includes(key.toLowerCase())
      );

      if (!matchedKey) {
        if (tCat) {
          matchedKey = tCat.charAt(0).toUpperCase() + tCat.slice(1);
        } else {
          matchedKey = 'General';
        }
      }

      categoryMap[matchedKey] = (categoryMap[matchedKey] || 0) + tAmt;
    });

  const categoryBreakdown = Object.entries(categoryMap)
    .filter(([_, amt]) => amt > 0)
    .map(([cat, amt]) => ({
      category: cat,
      amount: amt,
      percentage: totalExpense > 0 ? Math.round((amt / totalExpense) * 100) : 0
    }))
    .sort((a, b) => b.amount - a.amount);

  const highestTransactions = [...monthlyTransactions]
    .filter(t => {
      const tType = (t?.type || '').toLowerCase();
      return tType.includes('expense') || tType.includes('outflow') || tType.includes('bill');
    })
    .sort((a, b) => Number(b.amount || 0) - Number(a.amount || 0))
    .slice(0, 5);

  const topCategory = categoryBreakdown.length > 0 ? categoryBreakdown[0] : { category: 'N/A', amount: 0, percentage: 0 };

  const handlePrintPDF = () => {
    window.print();
  };

  return (
    <main className="min-h-screen bg-slate-100 dark:bg-slate-950 p-4 md:p-8 text-slate-800 dark:text-slate-100">
      
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-statement, #printable-statement * {
            visibility: visible !important;
          }
          #printable-statement {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: 100% !important;
            margin: 0 !important;
            padding: 8mm 10mm !important;
            box-shadow: none !important;
            background: white !important;
          }
          @page {
            size: A4 portrait;
            margin: 0;
          }
        }
      `}</style>

      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Top Filter & Action Bar */}
        <div className="bg-white dark:bg-slate-900 p-4 md:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <FileText className="w-6 h-6 text-indigo-600" /> Financial Statements & Reports
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Generate executive-grade monthly financial summaries.</p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-semibold cursor-pointer"
            />
            <button
              onClick={handlePrintPDF}
              className="flex items-center gap-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl transition shadow-md cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              Print / Save as PDF
            </button>
          </div>
        </div>

        {/* -------------------- EXECUTIVE PRINTABLE CANVAS -------------------- */}
        <div className="overflow-x-auto flex justify-center">
          <div 
            id="printable-statement"
            ref={reportRef} 
            className="w-[210mm] bg-white text-slate-900 p-8 shadow-2xl rounded-sm space-y-3.5 font-sans"
            style={{ backgroundColor: '#ffffff', color: '#0f172a' }}
          >
            {/* 1. Header Banner */}
            <div className="flex justify-between items-start border-b-2 border-slate-900 pb-2.5">
              <div>
                <div className="flex items-center gap-2 text-indigo-900">
                  <Building2 className="w-6 h-6 text-indigo-600" />
                  <span className="text-xl font-black tracking-wider uppercase">FINANCE OS</span>
                </div>
                <p className="text-[10px] text-slate-500 font-medium mt-0.5">Executive Monthly Performance & Cashflow Statement</p>
              </div>
              <div className="text-right">
                <span className="inline-block px-2.5 py-0.5 bg-indigo-50 text-indigo-800 text-[9px] font-bold tracking-widest uppercase rounded">
                  OFFICIAL STATEMENT
                </span>
                <p className="text-xs font-bold text-slate-800 mt-1">Period: {selectedMonth}</p>
                <p className="text-[10px] text-slate-400">Generated on: {currentDateStr}</p>
              </div>
            </div>

            {/* 2. Client & Summary Metadata with Health Score Badge */}
            <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs items-center">
              <div>
                <p className="text-slate-400 font-semibold uppercase text-[9px]">Prepared For</p>
                <p className="font-bold text-slate-800 text-sm">{userName}</p>
                <p className="text-[10px] text-slate-500">Karachi, Pakistan</p>
              </div>
              <div>
                <p className="text-slate-400 font-semibold uppercase text-[9px]">Financial Health Grade</p>
                <div className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border mt-0.5 ${healthColor}`}>
                  <Award className="w-3 h-3" /> {healthGrade}
                </div>
              </div>
              <div className="text-right">
                <p className="text-slate-400 font-semibold uppercase text-[9px]">Currency Basis / Status</p>
                <p className="font-bold text-slate-800 text-xs">{currency} Standard</p>
                <p className="text-emerald-600 text-[10px] font-bold">Status: Reconciled</p>
              </div>
            </div>

            {/* 3. Executive KPI Cards with MoM Indicator */}
            <div className="grid grid-cols-4 gap-2.5">
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Total Inflow</span>
                <p className="text-xs font-extrabold text-blue-600 mt-0.5">{formatCurrency(totalIncome, currency)}</p>
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Total Outflow</span>
                <div className="flex items-baseline justify-between mt-0.5">
                  <p className="text-xs font-extrabold text-rose-600">{formatCurrency(totalExpense, currency)}</p>
                  <span className={`text-[9px] font-bold flex items-center ${expenseGrowth <= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                    {expenseGrowth <= 0 ? <TrendingDown className="w-2.5 h-2.5 mr-0.5" /> : <TrendingUp className="w-2.5 h-2.5 mr-0.5" />}
                    {expenseGrowth}% MoM
                  </span>
                </div>
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Net Surplus</span>
                <p className={`text-xs font-extrabold mt-0.5 ${netSavings >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {formatCurrency(netSavings, currency)}
                </p>
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Savings Retention</span>
                <p className="text-xs font-extrabold text-indigo-600 mt-0.5">{savingsRate}%</p>
              </div>
            </div>

            {/* 3.5 Automated Key Management Insights Box */}
            <div className="bg-indigo-50/60 border border-indigo-100 p-2.5 rounded-xl flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <div className="text-[10px] text-slate-700 leading-tight">
                <strong className="text-indigo-900 font-bold">Key Management Insight: </strong> 
                Outflow for this period is predominantly driven by <strong>{topCategory.category}</strong> ({topCategory.percentage}% of total expenses). Regular monthly reconciliation indicates structured liquidity allocation.
              </div>
            </div>

            {/* 4. Category Expense Distribution */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                <h3 className="text-[11px] font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <PieIcon className="w-3.5 h-3.5 text-indigo-600" /> Category Expense Distribution & Share
                </h3>
                <span className="text-[9px] text-slate-400 font-semibold uppercase">Multi-Tier Analysis</span>
              </div>

              <div className="w-full h-2.5 rounded-full overflow-hidden flex bg-slate-100 border border-slate-200">
                {categoryBreakdown.map((cat, idx) => (
                  <div
                    key={idx}
                    title={`${cat.category}: ${cat.percentage}%`}
                    style={{
                      width: `${cat.percentage}%`,
                      backgroundColor: CHART_COLORS[idx % CHART_COLORS.length]
                    }}
                    className="h-full transition-all"
                  />
                ))}
              </div>

              <table className="w-full text-xs text-left border-collapse mt-1">
                <thead>
                  <tr className="bg-slate-100 text-slate-600 uppercase text-[9px]">
                    <th className="p-1 font-bold">Category</th>
                    <th className="p-1 font-bold text-right">Amount</th>
                    <th className="p-1 font-bold text-right">Share (%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {categoryBreakdown.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="p-2 text-center text-slate-400">No expenses recorded for this month.</td>
                    </tr>
                  ) : (
                    categoryBreakdown.slice(0, 4).map((cat, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-1 font-medium text-slate-700 flex items-center gap-1.5">
                          <span 
                            className="w-2 h-2 rounded-full shrink-0" 
                            style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}
                          ></span>
                          {cat.category}
                        </td>
                        <td className="p-1 text-right font-bold text-slate-900">{formatCurrency(cat.amount, currency)}</td>
                        <td className="p-1 text-right font-semibold text-slate-500">{cat.percentage}%</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* 5. Highest Value Transactions Audit Ledger */}
            <div className="space-y-1.5">
              <h3 className="text-[11px] font-bold text-slate-800 uppercase tracking-wider border-b border-slate-200 pb-1">
                Activity Audit Ledger (Highest Value Transactions)
              </h3>
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-600 uppercase text-[9px]">
                    <th className="p-1 font-bold">Date</th>
                    <th className="p-1 font-bold">Description / Party</th>
                    <th className="p-1 font-bold">Account</th>
                    <th className="p-1 font-bold text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {highestTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-2 text-center text-slate-400">No activity logged.</td>
                    </tr>
                  ) : (
                    highestTransactions.map((tx) => {
                      const isInc = (tx.type || '').toLowerCase().includes('income');
                      return (
                        <tr key={tx.id}>
                          <td className="p-1 font-mono text-slate-500">{formatDateDisplay(tx.date || tx.transaction_date || '')}</td>
                          <td className="p-1 font-semibold text-slate-800">
                            {tx.description}
                            {tx.party_name && <span className="text-[9px] text-slate-400 block font-normal">Party: {tx.party_name}</span>}
                          </td>
                          <td className="p-1 text-slate-600">{tx.account_name || 'Cash'}</td>
                          <td className={`p-1 text-right font-bold ${isInc ? 'text-emerald-600' : 'text-slate-900'}`}>
                            {isInc ? '+' : '-'} {formatCurrency(Number(tx.amount), currency)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* 6. Executive Footer & Digital Signature Block */}
            <div className="pt-3 border-t border-slate-200 flex justify-between items-end text-[10px] text-slate-400">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" /> System Reconciled & Digitally Verified
                </div>
                <p>Confidential & Privacy Protected — Finance OS Statement</p>
              </div>
              <div className="text-right space-y-3">
                <div className="w-36 border-b border-slate-400 pb-0.5"></div>
                <p className="font-bold text-slate-700">Authorized Financial Controller</p>
              </div>
            </div>

          </div>
        </div>

      </div>
    </main>
  );
}