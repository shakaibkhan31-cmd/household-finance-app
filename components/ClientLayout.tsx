'use client';

import React, { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import TrialBanner from '@/components/TrialBanner';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthOrLandingPage = 
    pathname === '/' || 
    pathname === '/login' || 
    pathname === '/signup' || 
    pathname === '/upgrade' || 
    pathname === '/reset-password';

  useEffect(() => {
    // Skip session check on public / auth pages
    if (isAuthOrLandingPage) return;

    // Check active session on mount and back-button navigation
    const checkSession = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = '/login';
      }
    };

    checkSession();

    // Listen to real-time auth changes (handles logout events instantly)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        window.location.href = '/login';
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [pathname, isAuthOrLandingPage]);

  if (isAuthOrLandingPage) {
    return <main className="min-h-screen w-full">{children}</main>;
  }

  return (
    <div className="min-h-full flex flex-col lg:flex-row w-full">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-x-hidden">
        <TrialBanner />
        <Header />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}