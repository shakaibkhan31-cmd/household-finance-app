import { type NextRequest, NextResponse } from 'next/server';
import { ratelimit } from '@/lib/ratelimit';

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // 1. Rate Limiting Check for Signup Route
  if (pathname.startsWith('/signup')) {
    const ip = request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip") ?? "127.0.0.1";
    const { success, limit, reset, remaining } = await ratelimit.limit(ip);

    if (!success) {
      return NextResponse.json(
        { error: 'Bohot sari requests aa chuki hain. Baraye meherbani kuch der baad koshish karein.' },
        { 
          status: 429,
          headers: {
            "X-RateLimit-Limit": limit.toString(),
            "X-RateLimit-Remaining": remaining.toString(),
            "X-RateLimit-Reset": reset.toString(),
          }
        }
      );
    }
  }

  // Response with security cache headers
  const response = NextResponse.next({
    request,
  });

  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');

  return response;
}