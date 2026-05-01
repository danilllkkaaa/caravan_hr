import { NextResponse } from 'next/server';
import { requireCurrentUser } from '@/lib/server/auth';
import { prisma } from '@/lib/server/prisma';
import { parseDateOnly } from '@/lib/server/dates';
import { serializeTimeRecord } from '@/lib/server/serializers';

export const runtime = 'nodejs';

function nowUtcTime(): string {
  const now = new Date();
  return `${String(now.getUTCHours()).padStart(2, '0')}:${String(now.getUTCMinutes()).padStart(2, '0')}`;
}

function todayIso(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}`;
}

export async function POST() {
  const { user, response } = await requireCurrentUser();
  if (response) return response;

  const todayDate = parseDateOnly(todayIso())!;

  const existing = await prisma.timeRecord.findUnique({
    where: { userId_date: { userId: user.id, date: todayDate } },
  });

  if (existing) {
    if (existing.checkIn !== '—') {
      return NextResponse.json({ error: 'Приход уже отмечен сегодня' }, { status: 409 });
    }
  }

  const timeStr = nowUtcTime();

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
          checkOut: '—',
          total: '—',
          status: 'normal',
        },
      });

  return NextResponse.json({ timeRecord: serializeTimeRecord(record) });
}
