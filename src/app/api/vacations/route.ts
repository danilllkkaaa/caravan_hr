import { NextResponse } from 'next/server';
import { requireCurrentUser } from '@/lib/server/auth';
import { prisma } from '@/lib/server/prisma';
import { calcCalendarDays, parseDateOnly } from '@/lib/server/dates';
import { serializeVacation } from '@/lib/server/serializers';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const { user, response } = await requireCurrentUser();
  if (response) return response;

  const url = new URL(request.url);
  const cursor = url.searchParams.get('cursor');
  const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '20'), 50);
  const take = limit + 1;

  const vacations = await prisma.vacation.findMany({
    where: { userId: user.id },
    orderBy: { id: 'desc' },
    take,
    ...(cursor ? { cursor: { id: parseInt(cursor) }, skip: 1 } : {}),
  });

  const hasMore = vacations.length > limit;
  if (hasMore) vacations.pop();

  return NextResponse.json({
    vacations: vacations.map(serializeVacation),
    hasMore,
    nextCursor: hasMore && vacations.length > 0 ? String(vacations[vacations.length - 1].id) : null,
  });
}

export async function POST(request: Request) {
  const { user, response } = await requireCurrentUser();
  if (response) return response;

  const body = await request.json().catch(() => null);
  const startDate = parseDateOnly(body?.startDate);
  const endDate = parseDateOnly(body?.endDate);
  const type = typeof body?.type === 'string' ? body.type.trim() : '';
  const comment = typeof body?.comment === 'string' ? body.comment.trim() : '';

  if (!startDate || !endDate || !type) {
    return NextResponse.json({ error: 'Заполните даты и тип отпуска' }, { status: 400 });
  }

  const days = calcCalendarDays(startDate, endDate);
  if (days <= 0) {
    return NextResponse.json({ error: 'Дата окончания должна быть позже даты начала' }, { status: 400 });
  }

  const vacation = await prisma.vacation.create({
    data: {
      userId: user.id,
      startDate,
      endDate,
      days,
      type,
      comment,
      status: 'pending',
    },
  });

  return NextResponse.json({ vacation: serializeVacation(vacation) }, { status: 201 });
}
