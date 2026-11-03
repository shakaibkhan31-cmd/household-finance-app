'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { 
  Sparkles, ArrowRight, CheckCircle2, 
  Users, PieChart, Landmark, ShieldCheck, Lock, 
  HelpCircle, ChevronDown, Check, X, Zap,
  CreditCard, TrendingUp, Bell, Layers, Shield, Wallet, BookOpen, Smartphone
} from 'lucide-react';

export default function LandingPage() {
  const [monthlyExpense, setMonthlyExpense] = useState<number>(100000);
  const [currentYear, setCurrentYear] = useState<number | string>('2026');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());

    const checkActiveSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          window.location.replace('/dashboard');
        } else {
          setIsCheckingAuth(false);
        }
      } catch (err) {
        console.error('Session check error:', err);
        setIsCheckingAuth(false);
      }
    };
    checkActiveSession();
  }, []);

  const estimatedSavings = Math.round(monthlyExpense * 0.12);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const faqs = [
    {
      q: "What is Household Finance?",
      a: "Household Finance is a household financial management application that helps you track income, expenses, accounts, budgets, bills, debts, Kameti and savings goals in one place."
    },
    {
      q: "I have never tracked my expenses. Can I still use it?",
      a: "Absolutely. You can start with your basic accounts and everyday income and expenses. You don't need prior accounting knowledge."
    },
    {
      q: "I already use Excel or a notebook. Why should I switch?",
      a: "Household Finance brings your financial records, accounts, budgets, bills and family access together in one connected system rather than maintaining scattered records."
    },
    {
      q: "Is there a free trial?",
      a: "Yes. You get 34 days of full access without needing a credit card."
    },
    {
      q: "Can my spouse or family members use it?",
      a: "Yes. You can invite authorised family members and assign roles and permissions."
    },
    {
      q: "Can I manage multiple bank accounts and wallets?",
      a: "Yes. You can manage cash, bank accounts, digital wallets and credit cards."
    },
    {
      q: "Can I track loans and Kameti?",
      a: "Yes. The application includes debt and Kameti management."
    },
    {
      q: "Can I use it on my mobile phone?",
      a: "Yes. Household Finance is designed to work on mobile devices and larger screens."
    },
    {
      q: "Is my financial information private?",
      a: "The application includes account authentication and household-level access controls. Refer to the Privacy Policy for more information."
    },
    {
      q: "What happens after my free trial?",
      a: "After your 34-day trial, you can continue with the annual subscription at PKR 10,000, subject to the subscription terms presented in your account."
    }
  ];

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin"></div>
          <span className="text-xs font-semibold text-slate-400">Loading Control Centre...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 antialiased selection:bg-indigo-500 selection:text-white transition-colors pb-24 md:pb-0 overflow-x-hidden">
      
      {/* Navigation Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-2">
          
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-600/30 shrink-0">
              HF
            </div>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-bold tracking-tight text-white truncate">Household Finance</h1>
              <p className="text-[9px] sm:text-[10px] text-indigo-400 font-medium truncate">Financial Control & Clarity</p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-xs font-medium text-slate-300">
            <a href="#why-us" className="hover:text-indigo-400 transition">Why Household Finance</a>
            <a href="#features" className="hover:text-indigo-400 transition">Features</a>
            <a href="#how-it-works" className="hover:text-indigo-400 transition">How It Works</a>
            <a href="#pricing" className="hover:text-indigo-400 transition">Pricing</a>
            <a href="#faq" className="hover:text-indigo-400 transition">FAQ</a>
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            <Link 
              href="/login" 
              className="px-3 sm:px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white transition"
            >
              Sign In
            </Link>
            <Link 
              href="/signup" 
              className="px-3 sm:px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition shadow-lg shadow-indigo-600/20 whitespace-nowrap"
            >
              Start Free Trial
            </Link>
          </div>

        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-28 pb-16 md:pt-44 md:pb-32 overflow-hidden bg-gradient-to-b from-indigo-950/40 via-slate-950 to-slate-950">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[400px] sm:w-[600px] h-[400px] sm:h-[600px] bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
          
          <div className="space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" /> 34-DAY FREE TRIAL · NO CREDIT CARD REQUIRED
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
              Know Where Your Money Goes. Take Control of Where It Goes Next.
            </h1>

            <p className="text-xs sm:text-sm md:text-base text-slate-400 leading-relaxed max-w-xl mx-auto lg:mx-0">
              Managing household finances shouldn't feel complicated. Whether you already track your expenses or have never kept a proper record, Household Finance helps you understand and manage your family's money in one simple place. Track income, expenses, budgets, bills, debts and savings — without complicated spreadsheets or scattered records.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              <Link 
                href="/signup" 
                className="w-full sm:w-auto px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs transition shadow-xl shadow-indigo-600/25 text-center flex items-center justify-center gap-2"
              >
                <span>Start Your Free Trial</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a 
                href="#how-it-works" 
                className="w-full sm:w-auto px-6 py-3.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-semibold rounded-xl text-xs transition text-center"
              >
                Explore How It Works
              </a>
            </div>

            <div className="flex items-center justify-center lg:justify-start gap-6 pt-4 text-xs text-slate-400 border-t border-slate-800/80">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> 34 days of full access
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> No credit card required
              </span>
            </div>
          </div>

          {/* Hero Visual Mockup */}
          <div className="relative">
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-2xl space-y-4 backdrop-blur-xl">
              
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-rose-500/80"></span>
                  <span className="w-3 h-3 rounded-full bg-amber-500/80"></span>
                  <span className="w-3 h-3 rounded-full bg-emerald-500/80"></span>
                </div>
                <span className="text-[9px] sm:text-[10px] font-mono text-slate-500 truncate">app.household-finance.com/dashboard</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-rose-950/30 border border-rose-900/40 p-3 sm:p-4 rounded-2xl">
                  <p className="text-[9px] sm:text-[10px] uppercase font-semibold text-rose-400">Monthly Expenses</p>
                  <p className="text-base sm:text-lg font-bold text-rose-200 mt-1">PKR 84,500</p>
                </div>
                <div className="bg-emerald-950/30 border border-emerald-900/40 p-3 sm:p-4 rounded-2xl">
                  <p className="text-[9px] sm:text-[10px] uppercase font-semibold text-emerald-400">Monthly Income</p>
                  <p className="text-base sm:text-lg font-bold text-emerald-200 mt-1">PKR 150,000</p>
                </div>
              </div>

              <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-4 space-y-3">
                <p className="text-xs font-bold text-slate-300 flex items-center justify-between">
                  <span>Household Budget Performance</span>
                  <span className="text-[10px] text-indigo-400 font-semibold">Active Sync</span>
                </p>
                
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                      <span>Groceries & Food</span>
                      <span className="text-slate-200">32,000 / 40,000</span>
                    </div>
                    <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                      <div className="bg-indigo-500 h-full w-[80%] rounded-full"></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                      <span>Utilities & Bills</span>
                      <span className="text-slate-200">18,500 / 22,000</span>
                    </div>
                    <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                      <div className="bg-amber-500 h-full w-[84%] rounded-full"></div>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          </div>

        </div>
      </section>

      {/* Problem Awareness Section */}
      <section className="py-20 bg-slate-900/50 border-y border-slate-800/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-10 text-center">
          <div className="space-y-3 max-w-2xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-white">Salary Comes In. Expenses Add Up. But Where Does the Money Go?</h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              You earn, spend, pay bills and manage family commitments every month. But without a clear picture of your finances, it can be difficult to understand:
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-left">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl text-xs text-slate-300 flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-indigo-400 shrink-0"></span>
              <span>How much money is actually available?</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl text-xs text-slate-300 flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-indigo-400 shrink-0"></span>
              <span>Where is most of your money going?</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl text-xs text-slate-300 flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-indigo-400 shrink-0"></span>
              <span>Are household expenses staying within budget?</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl text-xs text-slate-300 flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-indigo-400 shrink-0"></span>
              <span>Which bills and payments are coming up?</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl text-xs text-slate-300 flex items-center gap-3 sm:col-span-2 lg:col-span-2">
              <span className="w-2 h-2 rounded-full bg-indigo-400 shrink-0"></span>
              <span>How much can you realistically save?</span>
            </div>
          </div>

          <div className="bg-indigo-950/30 border border-indigo-900/40 p-6 rounded-2xl max-w-xl mx-auto space-y-2">
            <p className="text-xs text-indigo-300 font-medium">
              You don't need to become an accountant to answer these questions. You just need a simple way to keep track.
            </p>
            <p className="text-xs font-bold text-white pt-2">
              Household Finance brings your financial picture together so you can make decisions with greater clarity and confidence.
            </p>
          </div>
        </div>
      </section>

      {/* Who Is It For? Section */}
      <section id="why-us" className="py-20 bg-slate-950 border-b border-slate-800/80">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-12">
          
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-2xl md:text-3xl font-bold text-white">Whether You Track Every Rupee or Have Never Tracked Your Spending — Start Here.</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold">
                <BookOpen className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Already Managing Your Finances?</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Replace scattered spreadsheets, notebooks and separate records with one organised household finance system. Keep your accounts, transactions, budgets, bills and financial commitments connected.
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Never Kept a Proper Expense Record?</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Start without complicated accounting or bookkeeping. Record everyday income and expenses, and let the application organise your financial information into a clearer picture.
              </p>
            </div>
          </div>

          <p className="text-center text-xs text-indigo-400 font-semibold">
            You don't need to be good at accounting. You just need a better way to understand your money.
          </p>
        </div>
      </section>

      {/* Main Features / Modules Section */}
      <section id="features" className="py-20 bg-slate-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-12">
          
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-2xl md:text-3xl font-bold text-white">Everything You Need to Manage Your Household Money.</h2>
            <p className="text-xs text-slate-400">Comprehensive financial modules designed for total clarity.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white">Income & Expense Tracking</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Know how much money comes in and where it goes. Record salaries, business income, household expenses, personal spending and other transactions.
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
                <Wallet className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white">Accounts & Wallet Management</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Bring your cash, bank accounts, digital wallets and credit cards into one organised view.
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">
                <PieChart className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white">Budgets & Spending Control</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Set monthly budgets for household categories and monitor your spending as the month progresses. Understand how much you have spent and how much budget remains.
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center font-bold">
                <Bell className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white">Bills & Recurring Payments</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Organise electricity, gas, internet, school fees and other recurring household commitments. Track due dates and payment status.
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold">
                <Landmark className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white">Loans, Debts & Kameti</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Keep track of money you owe, money others owe you, repayments and Kameti contributions.
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white">Savings Goals</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Set financial targets, monitor progress and keep your household savings plans visible.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Family Collaboration Section */}
      <section className="py-20 bg-slate-950 border-t border-slate-800/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-8 text-center">
          <div className="space-y-3 max-w-2xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-white">Better Financial Clarity Starts With Better Family Coordination.</h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Household expenses are not always managed by one person. Invite your spouse or authorised family members to participate in household financial tracking.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left max-w-xl mx-auto">
            <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl text-xs text-slate-300 flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Invite family members</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl text-xs text-slate-300 flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Assign appropriate roles and permissions</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl text-xs text-slate-300 flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Keep household transactions organised</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl text-xs text-slate-300 flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Maintain a shared view of household finances</span>
            </div>
          </div>

          <div>
            <Link 
              href="/signup" 
              className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition shadow-lg shadow-indigo-600/20"
            >
              <span>Start Managing Money Together</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-slate-900/40 border-t border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-12">
          
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-2xl md:text-3xl font-bold text-white">Start Understanding Your Money in Three Simple Steps.</h2>
            <p className="text-xs text-slate-400">Start simple. Build better financial habits over time.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                01
              </div>
              <h3 className="text-sm font-bold text-white">Create Your Account</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Sign up and start your 34-day free trial. No credit card required.
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                02
              </div>
              <h3 className="text-sm font-bold text-white">Set Up Your Household</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Add your cash, bank accounts and wallets. Set budgets and invite family members if needed.
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                03
              </div>
              <h3 className="text-sm font-bold text-white">Track, Understand and Manage</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Record income and expenses, monitor bills and review your household financial position.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Mobile Experience Section */}
      <section className="py-20 bg-slate-950 border-t border-slate-800/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-8 text-center">
          <div className="space-y-3 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-semibold">
              <Smartphone className="w-3.5 h-3.5" /> Fully Responsive
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-white">Your Household Finances, Wherever Life Takes You.</h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Record expenses as they happen. Check account balances, review transactions and stay connected with your household financial position. Household Finance works on mobile devices as well as larger screens.
            </p>
          </div>
        </div>
      </section>

      {/* Financial Awareness Section */}
      <section className="py-20 bg-slate-900/40 border-t border-slate-800/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-10 text-center">
          <div className="space-y-3 max-w-2xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-white">You Can't Take Control of What You Can't See.</h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Small expenses can go unnoticed. Multiple bills can become difficult to manage. Savings goals can get pushed aside.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-left">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-xs text-slate-300">
              ✓ Identify where your money is going
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-xs text-slate-300">
              ✓ Understand your spending patterns
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-xs text-slate-300">
              ✓ Recognise unnecessary expenses
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-xs text-slate-300">
              ✓ Monitor your budget
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-xs text-slate-300 sm:col-span-2 lg:col-span-2">
              ✓ Make more informed financial decisions
            </div>
          </div>

          <p className="text-xs font-bold text-indigo-400">
            Financial clarity is the first step towards better financial control.
          </p>
        </div>
      </section>

      {/* Interactive Savings Calculator */}
      <section className="py-20 bg-slate-950">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-12 space-y-6 shadow-2xl">
            
            <div className="text-center space-y-2">
              <h2 className="text-xl md:text-2xl font-bold text-white">Calculate Potential Monthly Savings</h2>
              <p className="text-xs text-slate-400">Proper ledger tracking typically reduces impulse spending by 10% to 15%.</p>
            </div>

            <div className="space-y-6 max-w-2xl mx-auto pt-4">
              <div>
                <div className="flex flex-col sm:flex-row justify-between items-center text-xs font-semibold text-slate-300 mb-3 gap-1">
                  <span>Estimated Total Monthly Expense</span>
                  <span className="text-indigo-400 font-bold text-sm">PKR {monthlyExpense.toLocaleString()}</span>
                </div>
                <input 
                  type="range" 
                  min="30000" 
                  max="500000" 
                  step="5000"
                  value={monthlyExpense}
                  onChange={(e) => setMonthlyExpense(Number(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>

              <div className="p-5 sm:p-6 bg-indigo-950/30 border border-indigo-900/40 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
                <div>
                  <p className="text-[11px] font-semibold text-indigo-300 uppercase tracking-wider">Estimated Monthly Savings</p>
                  <p className="text-2xl sm:text-3xl font-extrabold text-emerald-400 mt-1">
                    PKR {estimatedSavings.toLocaleString()} <span className="text-xs text-slate-400 font-normal">/ month</span>
                  </p>
                </div>
                <Link 
                  href="/signup" 
                  className="w-full sm:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-indigo-600/20 whitespace-nowrap text-center"
                >
                  Start Saving Now
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Privacy & Security Section */}
      <section className="py-20 bg-slate-900/40 border-t border-slate-800/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-8 text-center">
          <div className="space-y-3 max-w-2xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-white">Your Household Financial Information Deserves Protection.</h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Your household's financial records are personal. Household Finance includes account authentication and household-level access controls designed to keep financial information organised and accessible only to authorised users.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto text-left">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-xs text-slate-300">
              🔒 Secure account authentication
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-xs text-slate-300">
              🛡️ Household-level data isolation
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-xs text-slate-300">
              👥 Role-based family access
            </div>
          </div>
        </div>
      </section>

      {/* Transparent Pricing Section */}
      <section id="pricing" className="py-20 bg-slate-950 border-t border-slate-800/80">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-12">
          
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-2xl md:text-3xl font-bold text-white">One Simple Subscription for Your Household Financial Management.</h2>
            <p className="text-xs text-slate-400">Give yourself 34 days to experience a clearer way to manage your household finances.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            
            {/* Free Trial Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold">
                  34-Day Free Trial
                </span>
                <div>
                  <h3 className="text-xl font-bold text-white">PKR 0</h3>
                  <p className="text-xs text-slate-400 mt-1">Full access during the trial. No credit card required.</p>
                </div>
                <ul className="space-y-2.5 text-xs text-slate-300 pt-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Full access during the trial</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>No credit card required</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Explore the application before subscribing</span>
                  </li>
                </ul>
              </div>

              <Link 
                href="/signup" 
                className="block w-full text-center py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition"
              >
                Start Your Free Trial
              </Link>
            </div>

            {/* Annual Subscription Card */}
            <div className="bg-slate-900 border border-indigo-500/40 rounded-3xl p-6 sm:p-8 space-y-6 relative overflow-hidden shadow-xl shadow-indigo-600/5 flex flex-col justify-between">
              <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[10px] font-bold px-4 py-1 rounded-bl-xl uppercase tracking-wider">
                Recommended
              </div>

              <div className="space-y-4">
                <span className="px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-semibold">
                  Annual Subscription
                </span>
                <div>
                  <h3 className="text-xl font-bold text-white">PKR 10,000 <span className="text-xs font-normal text-slate-400">/ year</span></h3>
                  <p className="text-xs text-slate-400 mt-1">Approximately PKR 833 per month.</p>
                </div>

                <ul className="space-y-2.5 text-xs text-slate-300 pt-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Up to 5 family member accounts</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Unlimited cash, bank and wallet accounts</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Income and expense tracking</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Category-wise budgets</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Bills, debt and Kameti management</span>
                  </li>
                </ul>
              </div>

              <Link 
                href="/signup" 
                className="block w-full text-center py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-indigo-600/20"
              >
                Get Started
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 bg-slate-900/30 border-t border-slate-800/80">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-10">
          
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-semibold">
              <HelpCircle className="w-3.5 h-3.5" /> Got Questions?
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-white">Frequently Asked Questions</h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div 
                key={index}
                className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden transition"
              >
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full px-5 sm:px-6 py-4 text-left flex items-center justify-between text-xs sm:text-sm font-semibold text-white hover:text-indigo-400 transition cursor-pointer gap-3"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 shrink-0 transition-transform duration-200 ${openFaq === index ? 'rotate-180 text-indigo-400' : 'text-slate-500'}`} />
                </button>
                {openFaq === index && (
                  <div className="px-5 sm:px-6 pb-4 text-xs text-slate-400 leading-relaxed border-t border-slate-800/60 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* Final Conversion Section */}
      <section className="py-20 border-t border-slate-800/80 bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 text-center">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-6">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">It's Time to Understand Your Household Finances.</h2>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-xl mx-auto">
            You work hard for your money. Make sure you know where it goes. Bring your income, expenses, bills, budgets and family financial records together. Start with a clearer picture. Build better financial habits. Take greater control of your household finances.
          </p>
          <Link 
            href="/signup" 
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs transition shadow-xl shadow-indigo-600/30"
          >
            <span>Start Your 34-Day Free Trial</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <p className="text-[11px] text-slate-500">No credit card required. Get started today.</p>
        </div>
      </section>

      {/* Mobile Sticky CTA Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-md border-t border-slate-800 px-4 py-3 flex items-center justify-between gap-3 shadow-2xl">
        <div>
          <p className="text-[11px] font-bold text-white">34-Day Free Trial</p>
          <p className="text-[10px] text-slate-400">No credit card required</p>
        </div>
        <Link 
          href="/signup" 
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs transition shadow-lg shadow-indigo-600/25 whitespace-nowrap flex items-center gap-1.5"
        >
          <span>Start Trial</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-900 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 sm:grid-cols-3 gap-8 text-center sm:text-left">
          <div className="space-y-2">
            <h4 className="font-bold text-white text-sm">Household Finance</h4>
            <p className="text-slate-400">Financial control and clarity for every household.</p>
          </div>
          <div className="space-y-2">
            <h4 className="font-bold text-white">Product & Account</h4>
            <div className="flex flex-col space-y-1.5 text-slate-400">
              <a href="#features" className="hover:underline">Features</a>
              <a href="#how-it-works" className="hover:underline">How It Works</a>
              <a href="#pricing" className="hover:underline">Pricing</a>
              <Link href="/login" className="hover:underline">Sign In</Link>
            </div>
          </div>
          <div className="space-y-2">
            <h4 className="font-bold text-white">Legal</h4>
            <div className="flex flex-col space-y-1.5 text-slate-400">
              <Link href="/privacy" className="hover:underline">Privacy Policy</Link>
              <Link href="/terms" className="hover:underline">Terms & Conditions</Link>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 mt-8 border-t border-slate-900/60 text-center">
          <p>© {currentYear} Household Finance. All rights reserved.</p>
        </div>
      </footer>

    </div>
  );
}