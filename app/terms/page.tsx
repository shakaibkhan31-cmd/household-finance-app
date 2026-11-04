'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, FileText } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-12">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between border-b border-slate-800 pb-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-semibold">
              <FileText className="w-4 h-4" /> TERMS & CONDITIONS
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Terms & Conditions</h1>
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
            <h2 className="text-base font-bold text-white">1. Acceptance of Terms</h2>
            <p>
              By accessing and using Household Finance, you accept and agree to be bound by the terms and provision of this agreement.
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
            <h2 className="text-base font-bold text-white">2. Free Trial & Subscriptions</h2>
            <p>
              New accounts receive a 34-day full access free trial without requiring a credit card. Upon trial completion, continued access requires an annual subscription of PKR 10,000, subject to active billing terms.
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
            <h2 className="text-base font-bold text-white">3. User Responsibilities</h2>
            <p>
              You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account workspace.
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
            <h2 className="text-base font-bold text-white">4. Modifications to Service</h2>
            <p>
              Household Finance reserves the right to modify or discontinue, temporarily or permanently, the service with or without notice.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}