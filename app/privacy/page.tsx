'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Shield } from 'lucide-react';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-12">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between border-b border-slate-800 pb-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-semibold">
              <Shield className="w-4 h-4" /> LEGAL & PRIVACY
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Privacy Policy</h1>
            <p className="text-xs text-slate-400">Last updated: November 2026</p>
          </div>
          <Link
            href="/"
            className="px-4 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl transition flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
        </div>

        <div className="space-y-6 text-xs sm:text-sm text-slate-300 leading-relaxed">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
            <h2 className="text-base font-bold text-white">1. Information We Collect</h2>
            <p>
              Household Finance collects information you provide directly when creating an account, such as your email address, and financial records you input into your workspace (accounts, transactions, bills, budgets, and family member details).
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
            <h2 className="text-base font-bold text-white">2. How We Secure Your Data</h2>
            <p>
              Your financial data is protected using industry-standard security measures including Supabase Row-Level Security (RLS) and strict multi-tenant database isolation. Only you and authorised family members can access your workspace data.
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
            <h2 className="text-base font-bold text-white">3. Data Sharing & Confidentiality</h2>
            <p>
              We do not sell, rent, or trade your personal or financial information to third parties. Your data remains strictly confidential and is used solely to provide and improve your household financial management experience.
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
            <h2 className="text-base font-bold text-white">4. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please reach out to our support team through your account control centre.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}