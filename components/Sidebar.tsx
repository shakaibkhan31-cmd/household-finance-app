'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  LayoutDashboard, 
  Wallet, 
  Receipt, 
  HandCoins, 
  ArrowLeftRight,
  TrendingUp,
  PieChart,
  Target,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  UserCheck,
  LogOut,
  Users,
  Settings
} from 'lucide-react';
import { LucideIcon } from 'lucide-react';

interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  badgeKey?: string;
  permKey?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: 'Overview',
    items: [
      { name: 'Dashboard', href: '/', icon: LayoutDashboard, permKey: 'dashboard' },
      { name: 'Transactions', href: '/transactions', icon: ArrowLeftRight, permKey: 'transactions' },
      { name: 'Accounts', href: '/accounts', icon: Wallet, permKey: 'accounts' },
    ]
  },
  {
    title: 'Planning & Budgets',
    items: [
      { name: 'Income & Receivables', href: '/receivables', icon: TrendingUp, permKey: 'income' },
      { name: 'Budgets', href: '/budgets', icon: PieChart, permKey: 'budgets' },
      { name: 'Goals', href: '/goals', icon: Target, permKey: 'goals' },
    ]
  },
  {
    title: 'Liabilities',
    items: [
      { name: 'Bills & Payables', href: '/bills', icon: Receipt, badgeKey: 'bills', permKey: 'bills' },
      { name: 'Debts & Kameti', href: '/debts', icon: HandCoins, badgeKey: 'debts', permKey: 'debts' },
    ]
  },
  {
    title: 'Settings & Access',
    items: [
      { name: 'Control Access', href: '/family', icon: Users },
      { name: 'Settings', href: '/settings', icon: Settings },
    ]
  }
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [pendingBillsCount, setPendingBillsCount] = useState(0);
  const [activeDebtsCount, setActiveDebtsCount] = useState(0);
  
  // User Dynamic & Permissions States
  const [userName, setUserName] = useState('User');
  const [userInitials, setUserInitials] = useState('U');
  const [isFamilyMember, setIsFamilyMember] = useState(false);
  const [userPermissions, setUserPermissions] = useState<Record<string, boolean>>({
    dashboard: true,
    transactions: true,
    accounts: true,
    income: true,
    budgets: true,
    goals: true,
    bills: true,
    debts: true
  });

  useEffect(() => {
    fetchSidebarData();
  }, []);

  const fetchSidebarData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get metadata or email for name
    const fullName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
    setUserName(fullName);
    
    // Generate initials (e.g. Shakaib Khan -> SK)
    const initials = fullName
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
    setUserInitials(initials || 'U');

    // Check if user is a family member and fetch permissions
    if (user.email) {
      const cleanEmail = user.email.trim().toLowerCase();
      const { data: memberRecord } = await supabase
        .from('family_members')
        .select('*')
        .ilike('member_email', cleanEmail)
        .maybeSingle();

      if (memberRecord) {
        setIsFamilyMember(true);
        if (memberRecord.permissions) {
          setUserPermissions(memberRecord.permissions);
        }
      }
    }

    const { count: billCount } = await supabase
      .from('bills')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'Pending');
    if (billCount !== null) setPendingBillsCount(billCount);

    const { count: debtCount } = await supabase
      .from('debts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'Active');
    if (debtCount !== null) setActiveDebtsCount(debtCount);
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Logout error:', error.message);
    } else {
      router.push('/login');
    }
  };

  return (
    <>
      {/* Mobile Top Header with Hamburger Toggle */}
      <div className="lg:hidden bg-slate-900 dark:bg-slate-950 text-white p-4 flex items-center justify-between sticky top-0 z-50 border-b border-slate-800 dark:border-slate-800 shadow-sm transition-colors">
        <h1 className="font-bold text-base tracking-wide">Household Finance</h1>
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-2 text-slate-300 hover:text-white rounded-lg focus:outline-none cursor-pointer"
        >
          {isMobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Overlay Backdrop */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Desktop & Mobile Sliding Drawer */}
      <aside 
        className={`bg-slate-900 dark:bg-slate-900 text-slate-300 min-h-screen p-4 flex flex-col justify-between shrink-0 transition-all duration-300 z-50 border-r border-slate-800/60 dark:border-slate-800
          fixed lg:relative inset-y-0 left-0 shadow-xl lg:shadow-none
          ${isMobileOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0'}
          ${isCollapsed ? 'lg:w-20' : 'lg:w-64'}
        `}
      >
        {/* Desktop Collapse Toggle Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden lg:flex absolute -right-3 top-8 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full p-1 shadow-md border-2 border-slate-900 dark:border-slate-900 transition items-center justify-center z-10 cursor-pointer"
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        <div className="space-y-6">
          {/* App Title */}
          <div className={`px-2 py-2 border-b border-slate-800 ${isCollapsed ? 'lg:text-center' : ''}`}>
            <h1 className={`font-bold text-white tracking-wide transition-all ${isCollapsed ? 'lg:text-xs text-xl' : 'text-xl'}`}>
              {isCollapsed ? 'HFC' : 'Household Finance'}
            </h1>
            {(!isCollapsed || isMobileOpen) && (
              <p className="text-xs text-slate-400 mt-0.5">Control Centre & Ledger</p>
            )}
          </div>

          {/* Grouped Navigation Sections */}
          <div className="space-y-6">
            {navSections.map((section, idx) => {
              // Settings & Access section ko family member ke liye poora hide kar dein
              if (isFamilyMember && section.title === 'Settings & Access') {
                return null;
              }

              // Filter items based on permissions if user is a family member
              const filteredItems = section.items.filter(item => {
                if (!isFamilyMember) return true;
                if (!item.permKey) return true;
                return userPermissions[item.permKey] === true;
              });

              if (filteredItems.length === 0) return null;

              return (
                <div key={idx} className="space-y-1">
                  {(!isCollapsed || isMobileOpen) && (
                    <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                      {section.title}
                    </p>
                  )}
                  {filteredItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href || (item.href === '/' && pathname === '/dashboard');
                    const badgeCount = item.badgeKey === 'bills' ? pendingBillsCount : item.badgeKey === 'debts' ? activeDebtsCount : 0;

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsMobileOpen(false)}
                        title={isCollapsed ? item.name : undefined}
                        className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition group ${
                          isActive
                            ? 'bg-indigo-600 text-white shadow-md font-semibold'
                            : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
                        } ${isCollapsed ? 'lg:justify-center lg:px-0' : ''}`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                          {(!isCollapsed || isMobileOpen) && <span className="truncate">{item.name}</span>}
                        </div>

                        {/* Notification Badges */}
                        {badgeCount > 0 && (!isCollapsed || isMobileOpen) && (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isActive ? 'bg-indigo-800 text-white' : 'bg-slate-800 text-indigo-400 border border-slate-700'
                          }`}>
                            {badgeCount}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer User Info, Logout & Version */}
        <div className="pt-4 border-t border-slate-800 space-y-3">
          {(!isCollapsed || isMobileOpen) && (
            <div className="flex items-center justify-between px-3 py-2 bg-slate-800/50 rounded-xl border border-slate-800 text-xs">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                  {userInitials}
                </div>
                <div className="overflow-hidden">
                  <p className="font-semibold text-slate-200 truncate">{userName}</p>
                  <p className="text-[10px] text-slate-400 flex items-center gap-1">
                    <UserCheck className="w-3 h-3 text-emerald-400" /> Active
                  </p>
                </div>
              </div>
              
              <button
                onClick={handleLogout}
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition cursor-pointer"
                title="Logout Session"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}

          {isCollapsed && (
            <div className="flex justify-center">
              <button
                onClick={handleLogout}
                className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition cursor-pointer"
                title="Logout Session"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}

          {(!isCollapsed || isMobileOpen) && (
            <div className="px-3 text-[11px] text-slate-500 flex justify-between items-center">
              <span>Multi-Account SaaS</span>
              <span className="font-mono text-[10px]">v2.1</span>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}