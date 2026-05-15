import { NextResponse } from 'next/server';
import { requireCurrentUser } from '@/lib/server/auth';
import { formatRuDate, parseDateOnly } from '@/lib/server/dates';
import { notifyManager } from '@/lib/server/notifications';
import { parseCursor, parsePositiveInt } from '@/lib/server/pagination';
import { prisma } from '@/lib/server/prisma';
import { requireSameOrigin } from '@/lib/server/requestSecurity';
import { serializeSickLeave } from '@/lib/server/serializers';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const { user, response } = await requireCurrentUser();
  if (response) return response;

  const url = new URL(request.url);
  const cursor = parseCursor(url.searchParams.get('cursor'));
  const limit = parsePositiveInt(url.searchParams.get('limit'), 10, 50);
  const take = limit + 1;

  const sickLeaves = await prisma.sickLeave.findMany({
    where: { userId: user.id },
    orderBy: { id: 'desc' },
    take,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
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
  const originError = requireSameOrigin(request);
  if (originError) return originError;

  const { user, response } = await requireCurrentUser();
  if (response) return response;

  const body = await request.json().catch(() => null);
  const startDate = parseDateOnly(body?.startDate);
  const comment = typeof body?.comment === 'string' ? body.comment.trim() : '';

  if (!startDate) {
    return NextResponse.json({ error: 'Выберите дату начала больничного' }, { status: 400 });
  }
  if (comment.length > 500) {
    return NextResponse.json({ error: 'Слишком длинный комментарий' }, { status: 400 });
  }

  const openedSickLeave = await prisma.sickLeave.count({ where: { userId: user.id, status: 'opened' } });
  if (openedSickLeave > 0) {
    return NextResponse.json({ error: 'У вас уже есть открытый больничный' }, { status: 409 });
  }

  const sickLeave = await prisma.$transaction(async (tx) => {
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

    await notifyManager(tx, user, {
      type: 'reminder',
      title: 'Открыт больничный',
      description: `${user.name} открыл больничный с ${formatRuDate(startDate)}`,
    });

    return record;
  });

  return NextResponse.json({ sickLeave: serializeSickLeave(sickLeave) }, { status: 201 });
}
