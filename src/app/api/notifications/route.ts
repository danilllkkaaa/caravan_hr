import { NextResponse } from 'next/server';
import { requireCurrentUser } from '@/lib/server/auth';
import { prisma } from '@/lib/server/prisma';
import { serializeNotification } from '@/lib/server/serializers';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const { user, response } = await requireCurrentUser();
  if (response) return response;

  const url = new URL(request.url);
  const cursor = url.searchParams.get('cursor');
  const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '30'), 100);
  const take = limit + 1;

  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: [{ date: 'desc' }, { id: 'desc' }],
    take,
    ...(cursor ? { cursor: { id: parseInt(cursor) }, skip: 1 } : {}),
  });

  const hasMore = notifications.length > limit;
  if (hasMore) notifications.pop();

  return NextResponse.json({
    notifications: notifications.map(serializeNotification),
    hasMore,
    nextCursor: hasMore && notifications.length > 0 ? String(notifications[notifications.length - 1].id) : null,
  });
}
