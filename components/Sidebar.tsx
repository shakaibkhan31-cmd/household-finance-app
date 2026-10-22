'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Wallet, 
  Receipt, 
  HandCoins, 
  ArrowLeftRight,
  ChevronLeft,
  ChevronRight
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
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside 
      className={`bg-slate-900 text-slate-300 min-h-screen p-4 flex flex-col justify-between shrink-0 transition-all duration-300 relative ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Collapse Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-8 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full p-1 shadow-md border-2 border-slate-900 transition"
        title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
      >
        {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>

      <div>
        {/* App Title */}
        <div className={`px-2 py-4 mb-6 border-b border-slate-800 ${isCollapsed ? 'text-center' : ''}`}>
          <h1 className={`font-bold text-white tracking-wide transition-all ${isCollapsed ? 'text-xs' : 'text-xl'}`}>
            {isCollapsed ? 'HFC' : 'Household Finance'}
          </h1>
          {!isCollapsed && (
            <p className="text-xs text-slate-400 mt-1">Control Centre & Ledger</p>
          )}
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
                title={isCollapsed ? item.name : undefined}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                } ${isCollapsed ? 'justify-center px-0' : ''}`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {!isCollapsed && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer info */}
      {!isCollapsed && (
        <div className="px-3 py-3 border-t border-slate-800 text-xs text-slate-500">
          <p className="font-semibold text-slate-400">Multi-Account SaaS</p>
          <p className="mt-0.5">Version 2.0 (Modular)</p>
        </div>
      )}
    </aside>
  );
}