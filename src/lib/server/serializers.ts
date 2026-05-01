import type { Notification, SickLeave, TimeRecord, User, Vacation } from '@prisma/client';

type UserWithManager = User & {
  manager?: Pick<User, 'id' | 'name'> | null;
};

function isoDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

export function serializeUser(user: UserWithManager) {
  return {
    name: user.name,
    firstName: user.firstName,
    position: user.position,
    department: user.department,
    email: user.email,
    phone: user.phone,
    employeeId: user.employeeId,
    hireDate: user.hireDate.toLocaleDateString('ru-RU'),
    role: user.role,
    managerId: user.managerId,
    managerName: user.manager?.name ?? null,
  };
}

export function serializeVacation(vacation: Vacation) {
  return {
    id: vacation.id,
    startDate: isoDate(vacation.startDate),
    endDate: isoDate(vacation.endDate),
    days: vacation.days,
    type: vacation.type,
    status: vacation.status,
    comment: vacation.comment,
  };
}

export function serializeSickLeave(sickLeave: SickLeave) {
  return {
    id: sickLeave.id,
    startDate: isoDate(sickLeave.startDate),
    endDate: sickLeave.endDate ? isoDate(sickLeave.endDate) : null,
    days: sickLeave.days,
    status: sickLeave.status,
    hasFile: sickLeave.hasFile,
    fileName: sickLeave.fileName,
    comment: sickLeave.comment,
  };
}

export function serializeTimeRecord(record: TimeRecord) {
  return {
    date: isoDate(record.date),
    checkIn: record.checkIn,
    checkOut: record.checkOut,
    total: record.total,
    status: record.status,
  };
}

export function serializeNotification(notification: Notification) {
  return {
    id: notification.id,
    type: notification.type,
    title: notification.title,
    description: notification.description,
    date: isoDate(notification.date),
    time: notification.time,
    read: notification.read,
  };
}

export function serializeBootstrap(data: {
  user: UserWithManager;
  vacations: Vacation[];
  sickLeaves: SickLeave[];
  timeRecords: TimeRecord[];
  notifications: Notification[];
}) {
  return {
    user: serializeUser(data.user),
    vacationBalance: {
      total: data.user.vacationTotal,
      used: data.user.vacationUsed,
      remaining: Math.max(data.user.vacationTotal - data.user.vacationUsed, 0),
    },
    vacations: data.vacations.map(serializeVacation),
    sickLeaves: data.sickLeaves.map(serializeSickLeave),
    timeRecords: data.timeRecords.map(serializeTimeRecord),
    notifications: data.notifications.map(serializeNotification),
  };
}
