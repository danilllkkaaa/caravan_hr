import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import {
  createSessionToken,
  hashToken,
  sessionExpiresAt,
  setSessionCookie,
  shouldUseSecureCookie,
} from '@/lib/server/auth';
import { checkRateLimit, clearRateLimitOnSuccess, getClientIp } from '@/lib/server/rateLimit';
import { requireSameOrigin } from '@/lib/server/requestSecurity';
import { prisma } from '@/lib/server/prisma';

export const runtime = 'nodejs';

function publicOrigin(request: Request): string {
  const origin = request.headers.get('origin');
  if (origin) return origin;

  const referer = request.headers.get('referer');
  if (referer) return new URL(referer).origin;

  const forwardedProto = request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim();
  const forwardedHost = request.headers.get('x-forwarded-host')?.split(',')[0]?.trim();
  if (forwardedProto && forwardedHost) return `${forwardedProto}://${forwardedHost}`;

  return new URL(request.url).origin;
}

function loginRedirect(request: Request, path: string) {
  return NextResponse.redirect(new URL(path, publicOrigin(request)), 303);
}

export async function POST(request: Request) {
  const originError = requireSameOrigin(request);
  if (originError) return originError;

  const ip = getClientIp(request);
  const limit = checkRateLimit(ip);
  if (!limit.allowed) {
    return loginRedirect(request, '/login?error=rate-limit');
  }

  const formData = await request.formData();
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const password = String(formData.get('password') ?? '');

  if (!email || !password) {
    return loginRedirect(request, '/login?error=missing');
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return loginRedirect(request, '/login?error=invalid');
  }

  clearRateLimitOnSuccess(ip);

  const token = createSessionToken();
  const expiresAt = sessionExpiresAt();
  await prisma.session.create({
    data: {
      tokenHash: hashToken(token),
      userId: user.id,
      expiresAt,
    },
  });

  const response = loginRedirect(request, '/home');
  setSessionCookie(response, token, expiresAt, shouldUseSecureCookie(request));
  return response;
}
