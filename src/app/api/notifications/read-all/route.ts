import { NextResponse } from 'next/server';
import { requireCurrentUser } from '@/lib/server/auth';
import { prisma } from '@/lib/server/prisma';

export const runtime = 'nodejs';

export async function POST() {
  const { user, response } = await requireCurrentUser();
  if (response) return response;

  await prisma.notification.updateMany({
    where: { userId: user.id, read: false },
    data: { read: true },
  });

  return NextResponse.json({ ok: true });
}
