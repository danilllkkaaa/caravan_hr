import { NextResponse } from 'next/server';
import { requireCurrentUser } from '@/lib/server/auth';
import { prisma } from '@/lib/server/prisma';
import { parseDateOnly } from '@/lib/server/dates';
import { serializeSickLeave } from '@/lib/server/serializers';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const { user, response } = await requireCurrentUser();
  if (response) return response;

  const url = new URL(request.url);
  const cursor = url.searchParams.get('cursor');
  const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '10'), 50);
  const take = limit + 1;

  const sickLeaves = await prisma.sickLeave.findMany({
    where: { userId: user.id },
    orderBy: { id: 'desc' },
    take,
    ...(cursor ? { cursor: { id: parseInt(cursor) }, skip: 1 } : {}),
  });

  const hasMore = sickLeaves.length > limit;
  if (hasMore) sickLeaves.pop();

  return NextResponse.json({
    sickLeaves: sickLeaves.map(serializeSickLeave),
    hasMore,
    nextCursor: hasMore && sickLeaves.length > 0 ? String(sickLeaves[sickLeaves.length - 1].id) : null,
  });
}

export async function POST(request: Request) {
  const { user, response } = await requireCurrentUser();
  if (response) return response;

  const body = await request.json().catch(() => null);
  const startDate = parseDateOnly(body?.startDate);
  const comment = typeof body?.comment === 'string' ? body.comment.trim() : '';

  if (!startDate) {
    return NextResponse.json({ error: 'Выберите дату начала больничного' }, { status: 400 });
  }

  const now = new Date();
  const [sickLeave] = await prisma.$transaction(async (tx) => {
    const record = await tx.sickLeave.create({
      data: {
        userId: user.id,
        startDate,
        endDate: null,
        days: 0,
        status: 'opened',
        hasFile: false,
        comment,
      },
    });

    if (user.managerId) {
      await tx.notification.create({
        data: {
          userId: user.managerId,
          type: 'reminder',
          title: 'Открыт больничный',
          description: `${user.name} открыл больничный с ${startDate.toLocaleDateString('ru-RU')}`,
          date: now,
          time: now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
          read: false,
        },
      });
    }

    return [record];
  });

  return NextResponse.json({ sickLeave: serializeSickLeave(sickLeave) }, { status: 201 });
}
