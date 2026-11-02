'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { 
  Sparkles, ArrowRight, CheckCircle2, 
  Users, PieChart, Landmark, ShieldCheck, Lock, 
  HelpCircle, ChevronDown, Check, X, Zap,
  CreditCard, TrendingUp, Bell, Layers, Shield, Wallet
} from 'lucide-react';

export default function LandingPage() {
  const [monthlyExpense, setMonthlyExpense] = useState<number>(100000);
  const [currentYear, setCurrentYear] = useState<number | string>('2026');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Fast Session Check to prevent microsecond landing page flickering
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
      q: "Is my financial data 100% safe & secure?",
      a: "Absolutely! We use Supabase Row Level Security (RLS) and strict multi-tenant database isolation, which means that your data can only be viewed by you and the family members you have invited. There’s a saying that if you’re not paying for the product, YOU’RE the product. When it comes to something as private and confidential as your financial data, we want the reins in your hand. We only want to make money from you paying us money, with you fully knowing and understanding what’s going on. You pay us the subscription price, and there you have it. That’s it. Transaction complete. That’s how we make our money."
    },
    {
      q: "How much can I expect to save with this app?",
      a: "On average, active households experience a 10% to 15% reduction in monthly wasteful or impulse spending simply by having clear, centralized visibility over category budgets, recurring bills, and daily ledger trails."
    },
    {
      q: "Can I add multiple family members to my household control centre?",
      a: "Yes! You can invite up to 5 family members to your workspace. Each member can securely record transactions, view wallet balances, and track shared expenses with real-time synchronization."
    },
    {
      q: "Is the app fully optimized for mobile devices?",
      a: "Yes, the platform features a fully responsive design built with Tailwind CSS, ensuring a seamless, lightning-fast experience across mobile phones, tablets, and desktop computers."
    },
    {
      q: "What happens after my 34-days free trial ends?",
      a: "Once your 34-days full access trial concludes, there are no automatic charges or credit card locks. You can easily choose a subscription plan to continue managing your finances without interruption."
    },
    {
      q: "Can I track debts, loans, and committee (kameti) payouts?",
      a: "Yes! Unlike basic expense trackers, our platform includes dedicated ledgers specifically engineered to monitor receivables, payables, and committee payouts with exact due date tracking."
    }
  ];

  // Prevent flash of landing page content while checking session
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
      
      {/* Navigation Header - Fixed mobile alignment */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-2">
          
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-600/30 shrink-0">
              HFC
            </div>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-bold tracking-tight text-white truncate">Household Finance</h1>
              <p className="text-[9px] sm:text-[10px] text-indigo-400 font-medium truncate">Control Centre & Ledger</p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-xs font-medium text-slate-300">
            <a href="#features" className="hover:text-indigo-400 transition">Features</a>
            <a href="#how-it-works" className="hover:text-indigo-400 transition">How It Works</a>
            <a href="#comparison" className="hover:text-indigo-400 transition">Why Switch?</a>
            <a href="#calculator" className="hover:text-indigo-400 transition">Calculator</a>
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
              Free Trial
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
              <Sparkles className="w-3.5 h-3.5" /> 34-Days Full Access Free Trial
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-6xl font-extrabold text-white tracking-tight leading-tight">
              Master Your Household Budget & Multi-Member Cash Flow.
            </h1>

            <p className="text-xs sm:text-sm md:text-base text-slate-400 leading-relaxed max-w-xl mx-auto lg:mx-0">
              Track bank accounts, cash wallets, recurring bills, kametis, and member-wise expense ledgers in one encrypted real-time control centre.
            </p>

            {/* Security Trust Badges */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 py-2 text-xs text-slate-300">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-900 border border-slate-800">
                <Lock className="w-3.5 h-3.5 text-indigo-400" /> End-to-End Encrypted
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-900 border border-slate-800">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Strict RLS Isolation
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              <Link 
                href="/signup" 
                className="w-full sm:w-auto px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs transition shadow-xl shadow-indigo-600/25 text-center flex items-center justify-center gap-2"
              >
                <span>Start Your 34-Days Free Trial</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a 
                href="#calculator" 
                className="w-full sm:w-auto px-6 py-3.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-semibold rounded-xl text-xs transition text-center"
              >
                Calculate Savings
              </a>
            </div>

            <div className="flex items-center justify-center lg:justify-start gap-6 pt-4 text-xs text-slate-400 border-t border-slate-800/80">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> No Credit Card Required
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Granular Access Control
              </span>
            </div>
          </div>

          {/* Live Visual Analytics Preview Mockup */}
          <div className="relative">
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-2xl space-y-4 backdrop-blur-xl">
              
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-rose-500/80"></span>
                  <span className="w-3 h-3 rounded-full bg-amber-500/80"></span>
                  <span className="w-3 h-3 rounded-full bg-emerald-500/80"></span>
                </div>
                <span className="text-[9px] sm:text-[10px] font-mono text-slate-500 truncate max-w-[180px] sm:max-w-none">app.household-finance.com/dashboard</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-rose-950/30 border border-rose-900/40 p-3 sm:p-4 rounded-2xl">
                  <p className="text-[9px] sm:text-[10px] uppercase font-semibold text-rose-400">This Month Expense</p>
                  <p className="text-base sm:text-lg font-bold text-rose-200 mt-1">PKR 45,200</p>
                </div>
                <div className="bg-emerald-950/30 border border-emerald-900/40 p-3 sm:p-4 rounded-2xl">
                  <p className="text-[9px] sm:text-[10px] uppercase font-semibold text-emerald-400">This Month Income</p>
                  <p className="text-base sm:text-lg font-bold text-emerald-200 mt-1">PKR 120,000</p>
                </div>
              </div>

              {/* Category Live Progress Bars */}
              <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-4 space-y-3">
                <p className="text-xs font-bold text-slate-300 flex items-center justify-between">
                  <span>Category Threshold Monitors</span>
                  <span className="text-[10px] text-indigo-400 font-semibold">Live Sync</span>
                </p>
                
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                      <span>Groceries & Food</span>
                      <span className="text-slate-200">18,500 / 25,000</span>
                    </div>
                    <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                      <div className="bg-indigo-500 h-full w-[74%] rounded-full"></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                      <span>Utilities & Bills</span>
                      <span className="text-slate-200">12,300 / 15,000</span>
                    </div>
                    <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                      <div className="bg-amber-500 h-full w-[82%] rounded-full"></div>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          </div>

        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section id="features" className="py-20 bg-slate-900/50 border-y border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-12">
          
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-2xl md:text-3xl font-bold text-white">Engineered for Complete Financial Control</h2>
            <p className="text-xs text-slate-400">Say goodbye to scattered manual registers and unorganized spreadsheets.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-3 hover:border-indigo-500/50 transition">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white">Multi-Member Granular Access</h3>
              <p className="text-xs text-slate-400 leading-relaxed">Assign roles to up to 5 family members. Automatic entry tagging guarantees complete record clarity.</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-3 hover:border-indigo-500/50 transition">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
                <PieChart className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white">Category Budget Thresholds</h3>
              <p className="text-xs text-slate-400 leading-relaxed">Set monthly limits on groceries, dining, and utility categories with live visual progress monitors.</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-3 hover:border-indigo-500/50 transition">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">
                <Landmark className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white">Debts & Kameti Ledgers</h3>
              <p className="text-xs text-slate-400 leading-relaxed">Track receivables, payables, and committee payouts with exact due date tracking and repayment logs.</p>
            </div>

          </div>
        </div>
      </section>

      {/* How It Works / Onboarding Flow */}
      <section id="how-it-works" className="py-20 bg-slate-950 border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-semibold">
              <Zap className="w-3.5 h-3.5" /> Fast Onboarding
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-white">Get Started in 3 Simple Steps</h2>
            <p className="text-xs text-slate-400">Set up your household workspace in under two minutes.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="bg-slate-900/60 border border-slate-800/80 p-6 rounded-2xl space-y-4 relative">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-extrabold text-sm shadow-md">
                01
              </div>
              <h3 className="text-sm font-bold text-white">Create Your Account</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Sign up in seconds and claim your instant 34-days full access free trial with no credit card required.
              </p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800/80 p-6 rounded-2xl space-y-4 relative">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-extrabold text-sm shadow-md">
                02
              </div>
              <h3 className="text-sm font-bold text-white">Set Wallets & Invite Family</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Configure cash wallets, bank balances, and invite up to 5 family members to start collaborative logging.
              </p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800/80 p-6 rounded-2xl space-y-4 relative">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-extrabold text-sm shadow-md">
                03
              </div>
              <h3 className="text-sm font-bold text-white">Log, Track & Save</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Record daily expenses, monitor category limits, and eliminate impulse spending with automated insights.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison / "Why Switch?" Section */}
      <section id="comparison" className="py-20 bg-slate-950">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-12">
          
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-2xl md:text-3xl font-bold text-white">Traditional Registers vs. Household Finance</h2>
            <p className="text-xs text-slate-400">See why modern households are upgrading to a digital control centre.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Traditional Method */}
            <div className="bg-slate-900/40 border border-rose-900/30 rounded-3xl p-6 sm:p-8 space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center font-bold">
                  <X className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-rose-200">Old Manual Registers</h3>
              </div>
              <ul className="space-y-3 text-xs text-slate-400">
                <li className="flex items-center gap-2">❌ Risk of losing physical notebooks or calculation mistakes</li>
                <li className="flex items-center gap-2">❌ No real-time summary or member-wise tracking</li>
                <li className="flex items-center gap-2">❌ Difficult to track pending debts and kameti due dates</li>
                <li className="flex items-center gap-2">❌ Zero data encryption or backup safety</li>
              </ul>
            </div>

            {/* HFC Method */}
            <div className="bg-indigo-950/20 border border-indigo-500/40 rounded-3xl p-6 sm:p-8 space-y-6 relative overflow-hidden shadow-xl shadow-indigo-600/5">
              <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[10px] font-bold px-4 py-1 rounded-bl-xl uppercase tracking-wider">
                Recommended
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
                  <Check className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-indigo-200">Household Finance Control Centre</h3>
              </div>
              <ul className="space-y-3 text-xs text-slate-300">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Instant cloud sync with automatic calculations</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Multi-member tagging and granular access logs</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Automated alerts for debts, bills, and kametis</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Secure encrypted database with Row Level Security</li>
              </ul>
            </div>

          </div>

        </div>
      </section>

      {/* Core Modules & Features Showcase Grid */}
      <section className="py-20 bg-slate-900/30 border-y border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-2xl md:text-3xl font-bold text-white">Comprehensive Financial Modules</h2>
            <p className="text-xs text-slate-400">Everything required to maintain total clarity over household liquidity.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-3">
              <Wallet className="w-6 h-6 text-indigo-400" />
              <h4 className="text-xs font-bold text-white">Multi-Wallet Sync</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Separate bank balances, petty cash, and credit card limits in unified dashboards.
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-3">
              <TrendingUp className="w-6 h-6 text-emerald-400" />
              <h4 className="text-xs font-bold text-white">Category Limits</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Define visual thresholds for recurring monthly categories like groceries and utilities.
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-3">
              <Bell className="w-6 h-6 text-amber-400" />
              <h4 className="text-xs font-bold text-white">Kameti & Debt Logs</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Track pending committee payouts, loans, and payables with due date alerts.
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-3">
              <Shield className="w-6 h-6 text-rose-400" />
              <h4 className="text-xs font-bold text-white">Encrypted Backups</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Row Level Security guarantees your financial records remain completely confidential.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Savings Calculator */}
      <section id="calculator" className="py-20 bg-slate-950">
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

      {/* Transparent Pricing / Subscription Section */}
      <section id="pricing" className="py-20 bg-slate-900/40 border-t border-slate-800/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-10">
          <div className="text-center space-y-3">
            <h2 className="text-2xl md:text-3xl font-bold text-white">Transparent, Honest Pricing</h2>
            <p className="text-xs text-slate-400">No hidden fees, no data selling. You pay for the software, and you own your data.</p>
          </div>

          <div className="bg-slate-900 border border-indigo-500/40 rounded-3xl p-6 sm:p-10 space-y-6 max-w-lg mx-auto relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[10px] font-bold px-4 py-1 rounded-bl-xl uppercase tracking-wider">
              34 Days Free Trial
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold text-white">Household Annual Pass</h3>
              <p className="text-xs text-slate-400">Full control centre access for your entire family.</p>
            </div>

            <div className="flex items-baseline gap-2 border-y border-slate-800 py-4">
              <span className="text-3xl sm:text-4xl font-extrabold text-white">PKR 10,000</span>
              <span className="text-xs text-slate-400">/ year</span>
            </div>

            <ul className="space-y-3 text-xs text-slate-300">
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>34-Days full access free trial (No credit card needed)</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Up to 5 Family Member Accounts</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Unlimited Cash, Bank & Wallet Accounts</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Kameti, Loans & Recurring Bill Ledgers</span>
              </li>
            </ul>

            <Link 
              href="/signup" 
              className="block w-full text-center py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-indigo-600/25"
            >
              Claim Your 34-Days Free Trial
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 bg-slate-950">
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

      {/* Call To Action Banner */}
      <section className="py-20 border-t border-slate-800/80 bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 text-center">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-6">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Ready to take complete financial control?</h2>
          <p className="text-xs text-slate-400">Join today and enjoy 34 days of complete full-feature access with no risk.</p>
          <Link 
            href="/signup" 
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs transition shadow-xl shadow-indigo-600/30"
          >
            <span>Create Your Free Account Now</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Mobile Sticky CTA Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-md border-t border-slate-800 px-4 py-3 flex items-center justify-between gap-3 shadow-2xl">
        <div>
          <p className="text-[11px] font-bold text-white">34-Days Free Trial</p>
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
      <footer className="py-8 border-t border-slate-900 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {currentYear} Household Finance. All rights reserved.</p>
          <div className="flex items-center gap-4 text-slate-400">
            <Link href="/login" className="hover:underline">Sign In</Link>
            <Link href="/signup" className="hover:underline">Sign Up</Link>
            <Link href="/dashboard" className="hover:underline">App Dashboard</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}