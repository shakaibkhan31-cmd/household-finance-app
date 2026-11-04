import { type NextRequest } from 'next/server';
import { updateSession } from '@/utils/supabase/middleware';

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match only protected dashboard routes to prevent interference with auth endpoints
     */
    '/dashboard/:path*',
    '/accounts/:path*',
    '/transactions/:path*',
    '/budgets/:path*',
    '/bills/:path*',
    '/debts/:path*',
    '/goals/:path*',
    '/family/:path*',
    '/settings/:path*',
    '/receivables/:path*',
    '/admin/:path*',
    '/upgrade/:path*',
  ],
};