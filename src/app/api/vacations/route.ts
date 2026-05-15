import { NextResponse } from 'next/server';
import { requireCurrentUser } from '@/lib/server/auth';
import { prisma } from '@/lib/server/prisma';
import { calcCalendarDays, formatRuDate, parseDateOnly } from '@/lib/server/dates';
import { notifyManager } from '@/lib/server/notifications';
import { parseCursor, parsePositiveInt } from '@/lib/server/pagination';
import { requireSameOrigin } from '@/lib/server/requestSecurity';
import { serializeVacation } from '@/lib/server/serializers';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const { user, response } = await requireCurrentUser();
  if (response) return response;

  const url = new URL(request.url);
  const cursor = parseCursor(url.searchParams.get('cursor'));
  const limit = parsePositiveInt(url.searchParams.get('limit'), 20, 50);
  const take = limit + 1;

  const vacations = await prisma.vacation.findMany({
    where: { userId: user.id },
    orderBy: { id: 'desc' },
    take,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
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
  const originError = requireSameOrigin(request);
  if (originError) return originError;

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
  if (type.length > 100 || comment.length > 500) {
    return NextResponse.json({ error: 'Слишком длинные данные заявки' }, { status: 400 });
  }

  const days = calcCalendarDays(startDate, endDate);
  if (days <= 0) {
    return NextResponse.json({ error: 'Дата окончания должна быть позже даты начала' }, { status: 400 });
  }

  const hasOverlap = await prisma.vacation.count({
    where: {
      userId: user.id,
      status: { in: ['pending', 'approved'] },
      startDate: { lte: endDate },
      endDate: { gte: startDate },
    },
  });
  if (hasOverlap > 0) {
    return NextResponse.json({ error: 'Период пересекается с другой активной заявкой' }, { status: 409 });
  }

  if (type.toLowerCase().includes('оплач') && user.vacationTotal - user.vacationUsed < days) {
    return NextResponse.json({ error: 'Недостаточно дней отпуска' }, { status: 409 });
  }

  const vacation = await prisma.$transaction(async (tx) => {
    const record = await tx.vacation.create({
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

    await notifyManager(tx, user, {
      type: 'reminder',
      title: 'Новая заявка на отпуск',
      description: `${user.name} подал заявку на отпуск с ${formatRuDate(startDate)} по ${formatRuDate(endDate)}`,
    });

    return record;
  });

  return NextResponse.json({ vacation: serializeVacation(vacation) }, { status: 201 });
}
