import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from './prisma';

export const SESSION_COOKIE = 'caravan_session';
const SESSION_DAYS = Number(process.env.SESSION_DAYS ?? 30);

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function createSessionToken(): string {
  return crypto.randomBytes(32).toString('base64url');
}

export function sessionExpiresAt(): Date {
  return new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
}

export function shouldUseSecureCookie(request: Request): boolean {
  if (process.env.SESSION_COOKIE_SECURE === 'true') return true;
  const forwardedProto = request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim();
  if (forwardedProto === 'https') return true;
  const cfVisitor = request.headers.get('cf-visitor');
  if (cfVisitor?.includes('"scheme":"https"')) return true;
  return new URL(request.url).protocol === 'https:';
}

export function setSessionCookie(response: NextResponse, token: string, expires: Date, secure = false) {
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure,
    path: '/',
    expires,
  });
}

export function clearSessionCookie(response: NextResponse, secure = false) {
  response.cookies.set(SESSION_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure,
    path: '/',
    expires: new Date(0),
  });
}

export async function getCurrentUser() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true },
  });

  if (!session || session.expiresAt <= new Date()) {
    if (session) {
      await prisma.session.delete({ where: { id: session.id } }).catch(() => null);
    }
    return null;
  }

  return session.user;
}

export async function requireCurrentUser() {
  const user = await getCurrentUser();
  if (!user) {
    return { user: null, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  return { user, response: null };
}
