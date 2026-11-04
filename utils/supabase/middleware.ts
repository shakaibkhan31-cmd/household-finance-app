import { createServerClient } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: Use getUser() instead of getSession() for secure middleware auth checks
  const { data: { user } } = await supabase.auth.getUser();
  const pathname = request.nextUrl.pathname;

  // Agar user logged in nahi hai aur protected route par ja raha hai toh login par redirect karein
  if (!user && (
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/accounts') ||
    pathname.startsWith('/transactions') ||
    pathname.startsWith('/budgets') ||
    pathname.startsWith('/bills') ||
    pathname.startsWith('/debts') ||
    pathname.startsWith('/goals') ||
    pathname.startsWith('/family') ||
    pathname.startsWith('/settings')
  )) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    const redirectResponse = NextResponse.redirect(url);
    redirectResponse.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    redirectResponse.headers.set('Pragma', 'no-cache');
    redirectResponse.headers.set('Expires', '0');
    return redirectResponse;
  }

  // Browser back-button caching roknay ke liye headers lagana
  supabaseResponse.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  supabaseResponse.headers.set('Pragma', 'no-cache');
  supabaseResponse.headers.set('Expires', '0');

  return supabaseResponse;
}