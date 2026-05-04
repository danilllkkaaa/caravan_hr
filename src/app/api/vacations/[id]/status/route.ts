import { NextResponse } from 'next/server';
import { requireCurrentUser } from '@/lib/server/auth';
import { prisma } from '@/lib/server/prisma';

export const runtime = 'nodejs';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireCurrentUser();
  if (response) return response;

  if (user.role !== 'manager' && user.role !== 'admin') {
    return NextResponse.json({ error: 'Доступ запрещён' }, { status: 403 });
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

  // Manager can only approve vacations from their own subordinates.
  if (user.role === 'manager' && vacation.user.managerId !== user.id) {
    return NextResponse.json({ error: 'Нет доступа к этой заявке' }, { status: 403 });
  }

  const now = new Date();
  await prisma.$transaction(async (tx) => {
    await tx.vacation.update({ where: { id }, data: { status: newStatus } });

    // If approving, add vacation days to employee's used balance.
    if (newStatus === 'approved') {
      await tx.user.update({
        where: { id: vacation.userId },
        data: { vacationUsed: { increment: vacation.days } },
      });
    }

    const isApproved = newStatus === 'approved';
    await tx.notification.create({
      data: {
        userId: vacation.userId,
        type: isApproved ? 'approved' : 'rejected',
        title: isApproved ? 'Отпуск одобрен' : 'Отпуск отклонён',
        description: isApproved
          ? `Ваш отпуск с ${vacation.startDate.toLocaleDateString('ru-RU')} по ${vacation.endDate.toLocaleDateString('ru-RU')} (${vacation.days} дн.) одобрен`
          : `Ваш отпуск с ${vacation.startDate.toLocaleDateString('ru-RU')} по ${vacation.endDate.toLocaleDateString('ru-RU')} отклонён`,
        date: now,
        time: now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
        read: false,
      },
    });
  });

  return NextResponse.json({ ok: true });
}
