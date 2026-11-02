import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: { autoRefreshToken: false, persistSession: false },
  }
);

export async function POST(request: Request) {
  try {
    const { email, redirectTo } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://household-finance-app-live.vercel.app';
    const targetRedirect = redirectTo || `${siteUrl}/update-password`; // Yahan /update-password set hai

    let { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'invite',
      email: email,
      options: { redirectTo: targetRedirect },
    });

    if (error && error.message.includes('already been registered')) {
      const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'recovery',
        email: email,
        options: { redirectTo: targetRedirect },
      });

      if (linkError) {
        return NextResponse.json({ error: linkError.message }, { status: 400 });
      }
      data = linkData;
    } else if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const inviteLink = data?.properties?.action_link;

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: `"Household Finance" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: 'You have been invited to Household Finance Control Centre',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #4f46e5;">Household Finance Access</h2>
          <p>Aapko apne household financial dashboard ka access diya gaya hai.</p>
          <p>Apna account setup karne aur password create karne ke liye niche diye gaye button par click karein:</p>
          <a href="${inviteLink}" style="display: inline-block; padding: 12px 20px; background-color: #4f46e5; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 15px;">Accept Invitation & Set Password</a>
        </div>
      `,
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}