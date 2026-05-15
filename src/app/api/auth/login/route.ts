import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/server/prisma';
import {
  createSessionToken,
  hashToken,
  sessionExpiresAt,
  setSessionCookie,
} from '@/lib/server/auth';
import { serializeUser } from '@/lib/server/serializers';
import { checkRateLimit, clearRateLimitOnSuccess, getClientIp } from '@/lib/server/rateLimit';
import { requireSameOrigin } from '@/lib/server/requestSecurity';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const originError = requireSameOrigin(request);
  if (originError) return originError;

  const ip = getClientIp(request);
  const limit = checkRateLimit(ip);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: `Слишком много попыток. Повторите через ${limit.retryAfter} сек.` },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfter) } },
    );
  }

  const body = await request.json().catch(() => null);
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body?.password === 'string' ? body.password : '';

  if (!email || !password) {
    return NextResponse.json({ error: 'Введите email и пароль' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return NextResponse.json({ error: 'Неверный email или пароль' }, { status: 401 });
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

  const response = NextResponse.json({ user: serializeUser(user) });
  setSessionCookie(response, token, expiresAt);
  return response;
}
