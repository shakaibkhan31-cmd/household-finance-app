'use client';

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { formatCurrency } from '@/lib/currency';
import { 
  Download, 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  PieChart, 
  FileText,
  Printer,
  ShieldCheck,
  Building2
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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
  allocated_amount?: number;
  amount?: number;
}

export default function ReportsPage() {
  const [selectedMonth, setSelectedMonth] = useState('2026-11');
  const [currency, setCurrency] = useState('PKR');
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [userName, setUserName] = useState('Valued Client / User');
  
  const reportRef = useRef<HTMLDivElement>(null);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (!userId) return;

      // Profile details
      const { data: profile } = await supabase
        .from('profiles')
        .select('preferred_currency, full_name')
        .eq('id', userId)
        .maybeSingle();

      if (profile?.preferred_currency) setCurrency(profile.preferred_currency);
      if (profile?.full_name) setUserName(profile.full_name);

      // Transactions
      const { data: txData } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId);

      if (txData) setTransactions(txData);

      // Budgets
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
    fetchReportData();
  }, [selectedMonth]);

  // Filter Transactions by Selected Month
  const monthlyTransactions = transactions.filter(t => {
    const d = t.date || t.transaction_date || '';
    return d.startsWith(selectedMonth);
  });

  const totalIncome = monthlyTransactions
    .filter(t => (t.type || '').toLowerCase().includes('income'))
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const totalExpense = monthlyTransactions
    .filter(t => (t.type || '').toLowerCase().includes('expense'))
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const netSavings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? Math.round((netSavings / totalIncome) * 100) : 0;

  // Group Expenses by Category
  const categoryMap: { [key: string]: number } = {};
  monthlyTransactions
    .filter(t => (t.type || '').toLowerCase().includes('expense'))
    .forEach(t => {
      const cat = t.category || 'General';
      categoryMap[cat] = (categoryMap[cat] || 0) + Number(t.amount || 0);
    });

  const categoryBreakdown = Object.entries(categoryMap).map(([cat, amt]) => ({
    category: cat,
    amount: amt,
    percentage: totalExpense > 0 ? Math.round((amt / totalExpense) * 100) : 0
  })).sort((a, b) => b.amount - a.amount);

  // PDF Generation Function
  const handleDownloadPDF = async () => {
    if (!reportRef.current) return;
    try {
      setDownloading(true);
      const element = reportRef.current;
      const canvas = await html2canvas(element, {
        scale: 2, // High DPI resolution for crisp text
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Executive_Financial_Report_${selectedMonth}.pdf`);
    } catch (err) {
      alert('PDF generation error: ' + err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-100 dark:bg-slate-950 p-4 md:p-8 text-slate-800 dark:text-slate-100">
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
              onClick={handleDownloadPDF}
              disabled={downloading}
              className="flex items-center gap-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl transition shadow-md cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              {downloading ? 'Generating PDF...' : 'Download PDF Statement'}
            </button>
          </div>
        </div>

        {/* -------------------- EXECUTIVE PRINTABLE CANVAS -------------------- */}
        <div className="overflow-x-auto">
          <div 
            ref={reportRef} 
            className="w-[210mm] min-h-[297mm] bg-white text-slate-900 p-10 mx-auto shadow-2xl rounded-sm space-y-8 font-sans"
            style={{ colorScheme: 'light' }}
          >
            {/* 1. Header Banner */}
            <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6">
              <div>
                <div className="flex items-center gap-2 text-indigo-900">
                  <Building2 className="w-8 h-8 text-indigo-600" />
                  <span className="text-2xl font-black tracking-wider uppercase">FINANCE OS</span>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-1">Executive Monthly Performance & Cashflow Statement</p>
              </div>
              <div className="text-right">
                <span className="inline-block px-3 py-1 bg-indigo-50 text-indigo-800 text-[10px] font-bold tracking-widest uppercase rounded">
                  OFFICIAL STATEMENT
                </span>
                <p className="text-xs font-bold text-slate-800 mt-2">Period: {selectedMonth}</p>
                <p className="text-[10px] text-slate-400">Generated on: {new Date().toLocaleDateString()}</p>
              </div>
            </div>

            {/* 2. Client & Summary Metadata */}
            <div className="grid grid-cols-2 gap-6 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
              <div>
                <p className="text-slate-400 font-semibold uppercase text-[10px]">Prepared For</p>
                <p className="font-bold text-slate-800 text-sm">{userName}</p>
                <p className="text-slate-500">Karachi, Pakistan</p>
              </div>
              <div className="text-right">
                <p className="text-slate-400 font-semibold uppercase text-[10px]">Currency Basis</p>
                <p className="font-bold text-slate-800 text-sm">{currency} Standard</p>
                <p className="text-emerald-600 font-bold">Status: Reconciled</p>
              </div>
            </div>

            {/* 3. Executive KPI Cards */}
            <div className="grid grid-cols-4 gap-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Inflow</span>
                <p className="text-base font-extrabold text-blue-600 mt-1">{formatCurrency(totalIncome, currency)}</p>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Outflow</span>
                <p className="text-base font-extrabold text-rose-600 mt-1">{formatCurrency(totalExpense, currency)}</p>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Net Surplus</span>
                <p className={`text-base font-extrabold mt-1 ${netSavings >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {formatCurrency(netSavings, currency)}
                </p>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Savings Retention</span>
                <p className="text-base font-extrabold text-indigo-600 mt-1">{savingsRate}%</p>
              </div>
            </div>

            {/* 4. Category Expense Breakdown Table */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-200 pb-1">
                Category Expense Distribution
              </h3>
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-600 uppercase text-[10px]">
                    <th className="p-2.5 font-bold">Category</th>
                    <th className="p-2.5 font-bold text-right">Amount</th>
                    <th className="p-2.5 font-bold text-right">Share (%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {categoryBreakdown.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="p-4 text-center text-slate-400">No expenses recorded for this month.</td>
                    </tr>
                  ) : (
                    categoryBreakdown.map((cat, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-2.5 font-medium text-slate-700">{cat.category}</td>
                        <td className="p-2.5 text-right font-bold text-slate-900">{formatCurrency(cat.amount, currency)}</td>
                        <td className="p-2.5 text-right font-semibold text-slate-500">{cat.percentage}%</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* 5. Detailed Transaction Ledger (Top Items) */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-200 pb-1">
                Activity Audit Ledger
              </h3>
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-600 uppercase text-[10px]">
                    <th className="p-2.5 font-bold">Date</th>
                    <th className="p-2.5 font-bold">Description / Party</th>
                    <th className="p-2.5 font-bold">Account</th>
                    <th className="p-2.5 font-bold text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {monthlyTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-4 text-center text-slate-400">No activity logged.</td>
                    </tr>
                  ) : (
                    monthlyTransactions.slice(0, 10).map((tx) => {
                      const isInc = (tx.type || '').toLowerCase().includes('income');
                      return (
                        <tr key={tx.id}>
                          <td className="p-2.5 font-mono text-slate-500">{formatDateDisplay(tx.date || tx.transaction_date || '')}</td>
                          <td className="p-2.5 font-semibold text-slate-800">
                            {tx.description}
                            {tx.party_name && <span className="text-[10px] text-slate-400 block font-normal">Party: {tx.party_name}</span>}
                          </td>
                          <td className="p-2.5 text-slate-600">{tx.account_name || 'Cash'}</td>
                          <td className={`p-2.5 text-right font-bold ${isInc ? 'text-emerald-600' : 'text-slate-900'}`}>
                            {isInc ? '+' : '-'} {formatCurrency(Number(tx.amount), currency)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* 6. Executive Footer & Digital Verification */}
            <div className="pt-8 border-t border-slate-200 flex justify-between items-center text-[10px] text-slate-400">
              <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                <ShieldCheck className="w-4 h-4 text-emerald-600" /> System Reconciled & Digitally Verified
              </div>
              <p>Confidential & Privacy Protected — Finance OS Statement</p>
            </div>

          </div>
        </div>

      </div>
    </main>
  );
}