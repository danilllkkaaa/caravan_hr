import { NextRequest, NextResponse } from 'next/server';

const SESSION_COOKIE = 'caravan_session';
const protectedPrefixes = ['/home', '/vacations', '/sick', '/time', '/employees', '/notifications', '/profile', '/approvals'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = Boolean(request.cookies.get(SESSION_COOKIE)?.value);
  const isProtected = protectedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

  if (isProtected && !hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/home/:path*', '/vacations/:path*', '/sick/:path*', '/time/:path*', '/employees/:path*', '/notifications/:path*', '/profile/:path*', '/approvals/:path*', '/login'],
};
