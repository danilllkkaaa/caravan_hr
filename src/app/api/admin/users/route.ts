import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { requireCurrentUser } from '@/lib/server/auth';
import { prisma } from '@/lib/server/prisma';
import { serializeUser } from '@/lib/server/serializers';

export const runtime = 'nodejs';

function firstNameFromEmail(email: string) {
  const local = email.split('@')[0] || 'user';
  const clean = local.split(/[._-]/)[0] || local;
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

async function nextEmployeeId() {
  const count = await prisma.user.count();
  return `EMP-${String(4000 + count + 1).padStart(4, '0')}`;
}

export async function POST(request: Request) {
  const { user: currentUser, response } = await requireCurrentUser();
  if (response) return response;

  if (currentUser.role !== 'admin') {
    return NextResponse.json({ error: 'Недостаточно прав' }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body?.password === 'string' ? body.password : '';

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Введите корректную почту' }, { status: 400 });
  }

  if (password.length < 4) {
    return NextResponse.json({ error: 'Пароль должен быть не короче 4 символов' }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: 'Пользователь с такой почтой уже существует' }, { status: 409 });
  }

  const firstName = firstNameFromEmail(email);
  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name: firstName,
      firstName,
      position: 'Сотрудник',
      department: currentUser.department,
      phone: '',
      employeeId: await nextEmployeeId(),
      hireDate: new Date(),
      vacationTotal: 28,
      vacationUsed: 0,
      role: 'user',
      managerId: currentUser.id,
    },
    include: { manager: { select: { id: true, name: true } } },
  });

  return NextResponse.json({ user: serializeUser(user) }, { status: 201 });
}
