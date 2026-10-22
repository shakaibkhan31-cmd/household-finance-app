'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Wallet, 
  Receipt, 
  HandCoins, 
  ArrowLeftRight 
} from 'lucide-react';

const navItems = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Transactions', href: '/transactions', icon: ArrowLeftRight },
  { name: 'Accounts', href: '/accounts', icon: Wallet },
  { name: 'Bills & Payables', href: '/bills', icon: Receipt },
  { name: 'Debts & Kameti', href: '/debts', icon: HandCoins },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 min-h-screen p-4 flex flex-col justify-between shrink-0">
      <div>
        {/* App Title */}
        <div className="px-3 py-4 mb-6 border-b border-slate-800">
          <h1 className="text-xl font-bold text-white tracking-wide">Household Finance</h1>
          <p className="text-xs text-slate-400 mt-1">Control Centre & Ledger</p>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer info */}
      <div className="px-3 py-3 border-t border-slate-800 text-xs text-slate-500">
        <p className="font-semibold text-slate-400">Multi-Account SaaS</p>
        <p className="mt-0.5">Version 2.0 (Modular)</p>
      </div>
    </aside>
  );
}