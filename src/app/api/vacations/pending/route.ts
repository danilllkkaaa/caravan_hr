import { NextResponse } from 'next/server';
import { requireCurrentUser } from '@/lib/server/auth';
import { prisma } from '@/lib/server/prisma';

export const runtime = 'nodejs';

export async function GET() {
  const { user, response } = await requireCurrentUser();
  if (response) return response;

  if (user.role !== 'manager' && user.role !== 'admin') {
    return NextResponse.json({ error: 'Доступ запрещён' }, { status: 403 });
  }

  // Admin sees all pending vacations; manager sees only their subordinates'.
  const where =
    user.role === 'admin'
      ? { status: 'pending' as const }
      : { status: 'pending' as const, user: { managerId: user.id } };

  const vacations = await prisma.vacation.findMany({
    where,
    orderBy: { createdAt: 'asc' },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          firstName: true,
          position: true,
          department: true,
        },
      },
    },
  });

  return NextResponse.json({
    vacations: vacations.map((v) => ({
      id: v.id,
      userId: v.userId,
      userName: v.user.name,
      userFirstName: v.user.firstName,
      userPosition: v.user.position,
      userDepartment: v.user.department,
      startDate: v.startDate.toISOString().slice(0, 10),
      endDate: v.endDate.toISOString().slice(0, 10),
      days: v.days,
      type: v.type,
      status: v.status,
      comment: v.comment,
      createdAt: v.createdAt.toISOString().slice(0, 10),
    })),
  });
}
