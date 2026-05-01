import { NextResponse } from 'next/server';
import { requireCurrentUser } from '@/lib/server/auth';
import { prisma } from '@/lib/server/prisma';
import { parseDateOnly } from '@/lib/server/dates';
import { serializeTimeRecord } from '@/lib/server/serializers';
import type { TimeStatus } from '@prisma/client';

export const runtime = 'nodejs';

function nowUtcTime(): string {
  const now = new Date();
  return `${String(now.getUTCHours()).padStart(2, '0')}:${String(now.getUTCMinutes()).padStart(2, '0')}`;
}

function todayIso(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}`;
}

function parseMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

function formatTotal(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}ч ${m}м` : `${h}ч 0м`;
}

function calcStatus(totalMinutes: number): TimeStatus {
  if (totalMinutes > 540) return 'overtime';  // > 9 h
  if (totalMinutes >= 420) return 'normal';   // 7–9 h
  return 'short';                             // < 7 h
}

export async function POST() {
  const { user, response } = await requireCurrentUser();
  if (response) return response;

  const todayDate = parseDateOnly(todayIso())!;

  const existing = await prisma.timeRecord.findUnique({
    where: { userId_date: { userId: user.id, date: todayDate } },
  });

  if (!existing || existing.checkIn === '—') {
    return NextResponse.json({ error: 'Сначала отметьте приход' }, { status: 409 });
  }
  if (existing.checkOut !== '—') {
    return NextResponse.json({ error: 'Уход уже отмечен сегодня' }, { status: 409 });
  }

  const checkOutStr = nowUtcTime();
  const totalMinutes = parseMinutes(checkOutStr) - parseMinutes(existing.checkIn);

  if (totalMinutes <= 0) {
    return NextResponse.json({ error: 'Время ухода не может быть раньше прихода' }, { status: 400 });
  }

  const record = await prisma.timeRecord.update({
    where: { id: existing.id },
    data: {
      checkOut: checkOutStr,
      total: formatTotal(totalMinutes),
      status: calcStatus(totalMinutes),
    },
  });

  return NextResponse.json({ timeRecord: serializeTimeRecord(record) });
}
