'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Sparkles, ArrowRight } from 'lucide-react';

export default function TrialBanner() {
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);
  const [isPro, setIsPro] = useState(false);
  const [isFamilyMember, setIsFamilyMember] = useState(false);

  useEffect(() => {
    fetchTrialStatus();
  }, []);

  const fetchTrialStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Check karein ke kahin yeh user kisi family member ka toh nahi hai
    if (user.email) {
      const cleanEmail = user.email.trim().toLowerCase();
      const { data: memberRecord } = await supabase
        .from('family_members')
        .select('id')
        .ilike('member_email', cleanEmail)
        .maybeSingle();

      if (memberRecord) {
        setIsFamilyMember(true);
        return; // Agar family member hai toh trial banner render nahi hoga
      }
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('created_at, subscription_status')
      .eq('id', user.id)
      .maybeSingle();

    if (profile) {
      if (profile.subscription_status === 'pro') {
        setIsPro(true);
        return;
      }

      if (profile.created_at) {
        const createdAt = new Date(profile.created_at);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - createdAt.getTime());
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        const remaining = Math.max(0, 34 - diffDays);
        setDaysRemaining(remaining);
      }
    } else {
      setDaysRemaining(34);
    }
  };

  // Agar user Pro hai, family member hai, ya days calculate nahi hue toh banner hide rahega
  if (isPro || isFamilyMember || daysRemaining === null) return null;

  return (
    <div className="bg-amber-500/10 border-b border-amber-500/20 px-6 py-2.5 flex items-center justify-between text-xs text-amber-700 dark:text-amber-400 font-medium">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 shrink-0" />
        <span>
          Free Trial Active: <strong className="font-bold">{daysRemaining} days remaining</strong> out of 34 days.
        </span>
      </div>
      <Link
        href="/upgrade"
        className="flex items-center gap-1 font-bold hover:underline"
      >
        <span>Upgrade Plan</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}