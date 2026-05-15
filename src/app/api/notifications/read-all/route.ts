import { NextResponse } from 'next/server';
import { requireCurrentUser } from '@/lib/server/auth';
import { prisma } from '@/lib/server/prisma';
import { requireSameOrigin } from '@/lib/server/requestSecurity';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const originError = requireSameOrigin(request);
  if (originError) return originError;

  const { user, response } = await requireCurrentUser();
  if (response) return response;

  await prisma.notification.updateMany({
    where: { userId: user.id, read: false },
    data: { read: true },
  });

  return NextResponse.json({ ok: true });
}
