import type { NotificationType, Prisma, User } from '@prisma/client';
import { formatRuTime } from './dates';

type NotificationInput = {
  userId: string;
  type: NotificationType;
  title: string;
  description: string;
  date?: Date;
};

type UserWithManager = Pick<User, 'managerId'>;

export async function createNotification(tx: Prisma.TransactionClient, input: NotificationInput) {
  const date = input.date ?? new Date();

  return tx.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      description: input.description,
      date,
      time: formatRuTime(date),
      read: false,
    },
  });
}

export async function notifyManager(
  tx: Prisma.TransactionClient,
  user: UserWithManager,
  input: Omit<NotificationInput, 'userId'>,
) {
  if (!user.managerId) return null;
  return createNotification(tx, { ...input, userId: user.managerId });
}
