import { NextResponse } from 'next/server';
import type { User } from '@prisma/client';
import { requireCurrentUser } from '@/lib/server/auth';
import { todayDateOnly } from '@/lib/server/dates';
import { prisma } from '@/lib/server/prisma';
import { EMPTY_TIME } from '@/lib/server/time';

export const runtime = 'nodejs';

type EmployeeStatus = 'working' | 'sick' | 'vacation' | 'home';
type UserRow = Pick<User, 'id' | 'name' | 'firstName' | 'position' | 'department' | 'email' | 'role'>;

const MANAGER_LIMIT = 50;
const SUBORDINATE_LIMIT = 100;

async function batchEmployeeStatuses(
  userIds: string[],
  today: Date,
): Promise<Map<string, EmployeeStatus>> {
  if (userIds.length === 0) return new Map();

  const [sickIds, vacationIds, checkedInIds] = await Promise.all([
    prisma.sickLeave
      .findMany({ where: { userId: { in: userIds }, status: 'opened' }, select: { userId: true } })
      .then((rows) => new Set(rows.map((row) => row.userId))),
    prisma.vacation
      .findMany({
        where: {
          userId: { in: userIds },
          status: 'approved',
          startDate: { lte: today },
          endDate: { gte: today },
        },
        select: { userId: true },
      })
      .then((rows) => new Set(rows.map((row) => row.userId))),
    prisma.timeRecord
      .findMany({
        where: {
          userId: { in: userIds },
          date: today,
          status: { in: ['normal', 'overtime', 'short'] },
          NOT: { checkIn: EMPTY_TIME },
        },
        select: { userId: true },
      })
      .then((rows) => new Set(rows.map((row) => row.userId))),
  ]);

  return new Map(
    userIds.map((id) => {
      if (sickIds.has(id)) return [id, 'sick'];
      if (vacationIds.has(id)) return [id, 'vacation'];
      if (checkedInIds.has(id)) return [id, 'working'];
      return [id, 'home'];
    }),
  );
}

function serializeEmployee(user: UserRow, status: EmployeeStatus) {
  return {
    id: user.id,
    name: user.name,
    firstName: user.firstName,
    position: user.position,
    department: user.department,
    email: user.email,
    role: user.role,
    status,
  };
}

export async function GET(request: Request) {
  const { user, response } = await requireCurrentUser();
  if (response) return response;

  const today = todayDateOnly();
  const url = new URL(request.url);
  const cursor = url.searchParams.get('cursor') ?? undefined;

  if (user.role === 'admin') {
    const managers = await prisma.user.findMany({
      where: { managerId: user.id, role: 'manager' },
      orderBy: [{ department: 'asc' }, { name: 'asc' }],
      take: MANAGER_LIMIT + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: {
        subordinates: {
          where: { role: 'user' },
          orderBy: { name: 'asc' },
          take: SUBORDINATE_LIMIT,
          select: { id: true, name: true, firstName: true, position: true, department: true, email: true, role: true },
        },
      },
    });

    const hasMoreManagers = managers.length > MANAGER_LIMIT;
    if (hasMoreManagers) managers.pop();

    const allIds = managers.flatMap((manager) => [manager.id, ...manager.subordinates.map((employee) => employee.id)]);
    const statuses = await batchEmployeeStatuses(allIds, today);

    return NextResponse.json({
      mode: 'admin',
      department: user.department,
      hasMoreManagers,
      nextCursor: hasMoreManagers ? managers[managers.length - 1]?.id ?? null : null,
      managers: managers.map((manager) => ({
        ...serializeEmployee(manager, statuses.get(manager.id) ?? 'home'),
        employees: manager.subordinates.map((employee) =>
          serializeEmployee(employee, statuses.get(employee.id) ?? 'home'),
        ),
      })),
    });
  }

  if (user.role === 'manager') {
    const employees = await prisma.user.findMany({
      where: { managerId: user.id, role: 'user' },
      orderBy: { name: 'asc' },
      take: SUBORDINATE_LIMIT,
      select: { id: true, name: true, firstName: true, position: true, department: true, email: true, role: true },
    });

    const statuses = await batchEmployeeStatuses(employees.map((employee) => employee.id), today);

    return NextResponse.json({
      mode: 'manager',
      department: user.department,
      employees: employees.map((employee) => serializeEmployee(employee, statuses.get(employee.id) ?? 'home')),
    });
  }

  return NextResponse.json({ mode: 'user', department: user.department, employees: [] });
}
