import { NextResponse } from 'next/server';
import { prisma } from '@/lib/server/prisma';
import { requireWebhookToken } from '@/lib/server/requestSecurity';
import { serializeTimeRecord } from '@/lib/server/serializers';
import { EMPTY_TIME, nowUtcClock, todayWorkDate } from '@/lib/server/time';

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

  if (existing?.checkIn !== undefined && existing.checkIn !== EMPTY_TIME) {
    return NextResponse.json({ error: 'Приход уже отмечен сегодня' }, { status: 409 });
  }

  const timeStr = nowUtcClock(eventTime);
  const record = existing
    ? await prisma.timeRecord.update({
        where: { id: existing.id },
        data: { checkIn: timeStr, status: 'normal' },
      })
    : await prisma.timeRecord.create({
        data: {
          userId: user.id,
          date: todayDate,
          checkIn: timeStr,
          checkOut: EMPTY_TIME,
          total: EMPTY_TIME,
          status: 'normal',
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
