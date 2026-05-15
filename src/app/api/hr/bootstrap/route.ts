import { NextResponse } from 'next/server';
import { requireCurrentUser } from '@/lib/server/auth';
import { prisma } from '@/lib/server/prisma';
import { serializeBootstrap } from '@/lib/server/serializers';

export const runtime = 'nodejs';

const PAGE_SIZE = {
  vacations: 20,
  sickLeaves: 10,
  timeRecords: 90, // ~3 months for the calendar view
  notifications: 30,
};

export async function GET() {
  const { user, response } = await requireCurrentUser();
  if (response) return response;

  const [fullUser, vacations, sickLeaves, timeRecords, notifications] = await Promise.all([
    prisma.user.findUnique({
      where: { id: user.id },
      include: { manager: { select: { id: true, name: true } } },
    }),
    prisma.vacation.findMany({
      where: { userId: user.id },
      orderBy: { id: 'desc' },
      take: PAGE_SIZE.vacations,
    }),
    prisma.sickLeave.findMany({
      where: { userId: user.id },
      orderBy: { id: 'desc' },
      take: PAGE_SIZE.sickLeaves,
    }),
    prisma.timeRecord.findMany({
      where: { userId: user.id },
      orderBy: { date: 'desc' },
      take: PAGE_SIZE.timeRecords,
    }),
    prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: [{ date: 'desc' }, { id: 'desc' }],
      take: PAGE_SIZE.notifications,
    }),
  ]);

  const [totalVacations, totalSickLeaves, totalNotifications] = await Promise.all([
    prisma.vacation.count({ where: { userId: user.id } }),
    prisma.sickLeave.count({ where: { userId: user.id } }),
    prisma.notification.count({ where: { userId: user.id } }),
  ]);

  const base = serializeBootstrap({
    user: fullUser ?? user,
    vacations,
    sickLeaves,
    timeRecords,
    notifications,
  });

  return NextResponse.json({
    ...base,
    hasMoreVacations: totalVacations > PAGE_SIZE.vacations,
    hasMoreSickLeaves: totalSickLeaves > PAGE_SIZE.sickLeaves,
    hasMoreNotifications: totalNotifications > PAGE_SIZE.notifications,
  });
}
