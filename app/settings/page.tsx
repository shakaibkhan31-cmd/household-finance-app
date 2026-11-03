'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { 
  Settings, Coins, CheckCircle2, ArrowLeft, Shield, 
  User, Lock, Download, Sparkles, Building2 
} from 'lucide-react';

const currencies = [
  { code: 'PKR', label: 'Pakistani Rupee (PKR)' },
  { code: 'USD', label: 'US Dollar ($)' },
  { code: 'EUR', label: 'Euro (€)' },
  { code: 'GBP', label: 'British Pound (£)' },
  { code: 'AED', label: 'UAE Dirham (AED)' },
  { code: 'SAR', label: 'Saudi Riyal (SAR)' },
  { code: 'INR', label: 'Indian Rupee (₹)' },
];

export default function SettingsPage() {
  const [currency, setCurrency] = useState('PKR');
  const [userEmail, setUserEmail] = useState('');
  const [subStatus, setSubStatus] = useState('free');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Password State
  const [newPassword, setNewPassword] = useState('');
  const [passLoading, setPassLoading] = useState(false);
  const [passMessage, setPassMessage] = useState('');

  const [message, setMessage] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetchUserSettings();
  }, []);

  const fetchUserSettings = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setUserEmail(user.email || '');

      const { data: profile } = await supabase
        .from('profiles')
        .select('preferred_currency, subscription_status')
        .eq('id', user.id)
        .maybeSingle();

      if (profile) {
        if (profile.preferred_currency) setCurrency(profile.preferred_currency);
        if (profile.subscription_status) setSubStatus(profile.subscription_status);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          preferred_currency: currency
        });

      if (error) {
        alert('Error updating settings: ' + error.message);
      } else {
        setMessage('Preferences have been successfully updated!');
        setTimeout(() => setMessage(''), 4000);
      }
    } catch (err: any) {
      alert('An unexpected error occurred: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setPassMessage('Password must be at least 6 characters long.');
      return;
    }

    setPassLoading(true);
    setPassMessage('');

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        setPassMessage('Error: ' + error.message);
      } else {
        setPassMessage('Password has been successfully updated!');
        setNewPassword('');
        setTimeout(() => setPassMessage(''), 4000);
      }
    } catch (err: any) {
      setPassMessage('Error: ' + err.message);
    } finally {
      setPassLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-6 md:p-12 transition-colors">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-semibold">
              <Settings className="w-4 h-4" /> ACCOUNT CONTROL CENTRE
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              Settings & Preferences
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Manage your currency formatting, security credentials, and membership status.
            </p>
          </div>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl transition flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </button>
        </div>

        {message && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-medium flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">Loading settings...</div>
        ) : (
          <div className="space-y-6">
            
            {/* Section 1: Profile & Subscription Status Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 dark:bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-base">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">{userEmail}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Primary Account Holder</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                  subStatus === 'pro' 
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' 
                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                }`}>
                  <Sparkles className="w-3.5 h-3.5" /> {subStatus === 'pro' ? 'Pro Member' : 'Free Trial'}
                </span>
                {subStatus !== 'pro' && (
                  <button
                    onClick={() => router.push('/upgrade')}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition cursor-pointer"
                  >
                    Upgrade Plan
                  </button>
                )}
              </div>
            </div>

            {/* Section 2: Currency Settings */}
            <form onSubmit={handleSavePreferences} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 md:p-8 space-y-6 shadow-xl">
              <h3 className="text-sm font-bold flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
                <Coins className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Currency & Regional Formatting
              </h3>

              <div className="max-w-md space-y-2">
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
                  Default Display Currency
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-indigo-500 text-slate-900 dark:text-slate-100 cursor-pointer font-medium"
                >
                  {currencies.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.label}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 pt-1">
                  This currency will be used to format values across your dashboard, transactions, and accounts.
                </p>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition shadow-lg shadow-indigo-600/20 cursor-pointer"
                >
                  {saving ? 'Saving...' : 'Save Currency Preference'}
                </button>
              </div>
            </form>

            {/* Section 3: Security / Password Change */}
            <form onSubmit={handlePasswordUpdate} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 md:p-8 space-y-6 shadow-xl">
              <h3 className="text-sm font-bold flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
                <Lock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Security & Password Update
              </h3>

              {passMessage && (
                <div className={`p-3 rounded-xl text-xs ${
                  passMessage.includes('successfully') 
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
                    : 'bg-rose-500/10 text-rose-500 dark:text-rose-400 border border-rose-500/20'
                }`}>
                  {passMessage}
                </div>
              )}

              <div className="max-w-md space-y-2">
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
                  New Password
                </label>
                <input
                  type="password"
                  placeholder="Enter new secure password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-indigo-500 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                <button
                  type="submit"
                  disabled={passLoading}
                  className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl transition cursor-pointer shadow-md"
                >
                  {passLoading ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>

          </div>
        )}

      </div>
    </div>
  );
}