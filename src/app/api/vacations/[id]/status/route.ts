import { NextResponse } from 'next/server';
import { requireCurrentUser } from '@/lib/server/auth';
import { formatRuDate } from '@/lib/server/dates';
import { createNotification } from '@/lib/server/notifications';
import { prisma } from '@/lib/server/prisma';
import { requireSameOrigin } from '@/lib/server/requestSecurity';

export const runtime = 'nodejs';

class VacationStatusError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const originError = requireSameOrigin(request);
  if (originError) return originError;

  const { user, response } = await requireCurrentUser();
  if (response) return response;

  if (user.role !== 'manager' && user.role !== 'admin') {
    return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
  }

  const { id: idStr } = await params;
  const id = Number(idStr);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: 'Некорректный id' }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const newStatus = body?.status;
  if (newStatus !== 'approved' && newStatus !== 'rejected') {
    return NextResponse.json({ error: 'Статус должен быть approved или rejected' }, { status: 400 });
  }

  const vacation = await prisma.vacation.findUnique({
    where: { id },
    include: { user: { select: { id: true, name: true, managerId: true } } },
  });

  if (!vacation) {
    return NextResponse.json({ error: 'Заявка не найдена' }, { status: 404 });
  }
  if (vacation.status !== 'pending') {
    return NextResponse.json({ error: 'Заявка уже обработана' }, { status: 409 });
  }
  if (user.role === 'manager' && vacation.user.managerId !== user.id) {
    return NextResponse.json({ error: 'Нет доступа к этой заявке' }, { status: 403 });
  }

  try {
    await prisma.$transaction(async (tx) => {
      if (newStatus === 'approved') {
        const owner = await tx.user.findUnique({
          where: { id: vacation.userId },
          select: { vacationTotal: true, vacationUsed: true },
        });
        if (!owner) throw new VacationStatusError('Сотрудник не найден', 404);
        if (owner.vacationTotal - owner.vacationUsed < vacation.days) {
          throw new VacationStatusError('Недостаточно дней отпуска', 409);
        }
      }

      const updated = await tx.vacation.updateMany({
        where: { id, status: 'pending' },
        data: { status: newStatus },
      });

      if (updated.count !== 1) {
        throw new VacationStatusError('Заявка уже обработана', 409);
      }

      if (newStatus === 'approved') {
        await tx.user.update({
          where: { id: vacation.userId },
          data: { vacationUsed: { increment: vacation.days } },
        });
      }

      const isApproved = newStatus === 'approved';
      await createNotification(tx, {
        userId: vacation.userId,
        type: isApproved ? 'approved' : 'rejected',
        title: isApproved ? 'Отпуск одобрен' : 'Отпуск отклонен',
        description: isApproved
          ? `Ваш отпуск с ${formatRuDate(vacation.startDate)} по ${formatRuDate(vacation.endDate)} (${vacation.days} дн.) одобрен`
          : `Ваш отпуск с ${formatRuDate(vacation.startDate)} по ${formatRuDate(vacation.endDate)} отклонен`,
      });
    });
  } catch (error) {
    if (error instanceof VacationStatusError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }

  return NextResponse.json({ ok: true });
}
