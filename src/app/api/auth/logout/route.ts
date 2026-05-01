import { NextResponse } from 'next/server';
import { clearSessionCookie, hashToken, SESSION_COOKIE } from '@/lib/server/auth';
import { prisma } from '@/lib/server/prisma';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';

export async function POST() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { tokenHash: hashToken(token) } });
  }

  const response = NextResponse.json({ ok: true });
  clearSessionCookie(response);
  return response;
}
