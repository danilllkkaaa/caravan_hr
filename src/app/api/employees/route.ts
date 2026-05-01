import { NextResponse } from 'next/server';
import type { User } from '@prisma/client';
import { requireCurrentUser } from '@/lib/server/auth';
import { prisma } from '@/lib/server/prisma';

export const runtime = 'nodejs';

type EmployeeStatus = 'working' | 'sick' | 'vacation' | 'home';

function todayDateOnly() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

// Batch-resolves status for many users in 3 queries instead of 3 per user.
async function batchEmployeeStatuses(
  userIds: string[],
  today: Date,
): Promise<Map<string, EmployeeStatus>> {
  if (userIds.length === 0) return new Map();

  const [sickIds, vacationIds, checkedInIds] = await Promise.all([
    prisma.sickLeave
      .findMany({ where: { userId: { in: userIds }, status: 'opened' }, select: { userId: true } })
      .then((rows) => new Set(rows.map((r) => r.userId))),

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
      .then((rows) => new Set(rows.map((r) => r.userId))),

    prisma.timeRecord
      .findMany({
        where: {
          userId: { in: userIds },
          date: today,
          status: { in: ['normal', 'overtime', 'short'] },
          NOT: { checkIn: '—' },
        },
        select: { userId: true },
      })
      .then((rows) => new Set(rows.map((r) => r.userId))),
  ]);

  const result = new Map<string, EmployeeStatus>();
  for (const id of userIds) {
    if (sickIds.has(id)) result.set(id, 'sick');
    else if (vacationIds.has(id)) result.set(id, 'vacation');
    else if (checkedInIds.has(id)) result.set(id, 'working');
    else result.set(id, 'home');
  }
  return result;
}

type UserRow = Pick<User, 'id' | 'name' | 'firstName' | 'position' | 'department' | 'email' | 'role'>;

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

const MANAGER_LIMIT = 50; // admin view: max managers per page
const SUBORDINATE_LIMIT = 100;

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

    // Collect all user IDs for a single batch status fetch
    const allIds = managers.flatMap((m) => [m.id, ...m.subordinates.map((s) => s.id)]);
    const statuses = await batchEmployeeStatuses(allIds, today);

    return NextResponse.json({
      mode: 'admin',
      department: user.department,
      hasMoreManagers,
      nextCursor: hasMoreManagers ? managers[managers.length - 1]?.id ?? null : null,
      managers: managers.map((manager) => ({
        ...serializeEmployee(manager, statuses.get(manager.id) ?? 'home'),
        employees: manager.subordinates.map((emp) =>
          serializeEmployee(emp, statuses.get(emp.id) ?? 'home'),
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

    const statuses = await batchEmployeeStatuses(employees.map((e) => e.id), today);

    return NextResponse.json({
      mode: 'manager',
      department: user.department,
      employees: employees.map((emp) => serializeEmployee(emp, statuses.get(emp.id) ?? 'home')),
    });
  }

  return NextResponse.json({ mode: 'user', department: user.department, employees: [] });
}
