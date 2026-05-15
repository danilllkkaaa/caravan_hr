import { NextResponse } from 'next/server';
import { prisma } from '@/lib/server/prisma';
import { requireWebhookToken } from '@/lib/server/requestSecurity';
import { serializeTimeRecord } from '@/lib/server/serializers';
import { calcTimeStatus, calcWorkedMinutes, EMPTY_TIME, formatWorkedTime, nowUtcClock, todayWorkDate } from '@/lib/server/time';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const tokenError = requireWebhookToken(request);
  if (tokenError) return tokenError;

  const body = await request.json().catch(() => null);
  const user = await resolveWebhookUser(body);
  if (!user) {
    return NextResponse.json({ error: 'Сотрудник не найден' }, { status: 404 });
  }

  const eventTime = parseWebhookTime(body?.timestamp);
  const todayDate = todayWorkDate(eventTime);

  const existing = await prisma.timeRecord.findUnique({
    where: { userId_date: { userId: user.id, date: todayDate } },
  });

  if (!existing || existing.checkIn === EMPTY_TIME) {
    return NextResponse.json({ error: 'Сначала отметьте приход' }, { status: 409 });
  }
  if (existing.checkOut !== EMPTY_TIME) {
    return NextResponse.json({ error: 'Уход уже отмечен сегодня' }, { status: 409 });
  }

  const checkOutStr = nowUtcClock(eventTime);
  const totalMinutes = calcWorkedMinutes(existing.checkIn, checkOutStr);

  if (totalMinutes <= 0) {
    return NextResponse.json({ error: 'Рабочее время должно быть больше 0 минут с учетом обеда' }, { status: 400 });
  }

  const record = await prisma.timeRecord.update({
    where: { id: existing.id },
    data: {
      checkOut: checkOutStr,
      total: formatWorkedTime(totalMinutes),
      status: calcTimeStatus(totalMinutes),
    },
  });

  return NextResponse.json({ timeRecord: serializeTimeRecord(record) });
}

async function resolveWebhookUser(body: unknown) {
  const payload = body && typeof body === 'object' ? body as Record<string, unknown> : {};
  const userId = typeof payload.userId === 'string' ? payload.userId.trim() : '';
  const employeeId = typeof payload.employeeId === 'string' ? payload.employeeId.trim() : '';
  const email = typeof payload.email === 'string' ? payload.email.trim().toLowerCase() : '';

  if (userId) return prisma.user.findUnique({ where: { id: userId } });
  if (employeeId) return prisma.user.findUnique({ where: { employeeId } });
  if (email) return prisma.user.findUnique({ where: { email } });
  return null;
}

function parseWebhookTime(value: unknown): Date {
  if (typeof value !== 'string') return new Date();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date() : date;
}
