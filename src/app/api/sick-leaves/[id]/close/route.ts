import { NextResponse } from 'next/server';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { requireCurrentUser } from '@/lib/server/auth';
import { prisma } from '@/lib/server/prisma';
import { calcCalendarDays, parseDateOnly } from '@/lib/server/dates';
import { serializeSickLeave } from '@/lib/server/serializers';

export const runtime = 'nodejs';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set(['application/pdf', 'image/jpeg', 'image/png']);

function safeFileName(name: string) {
  return name.replace(/[^\wа-яА-ЯёЁ.\-]+/g, '_').slice(0, 120);
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const { user, response } = await requireCurrentUser();
  if (response) return response;

  const id = Number(params.id);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: 'Некорректный id больничного' }, { status: 400 });
  }

  const existing = await prisma.sickLeave.findFirst({ where: { id, userId: user.id } });
  if (!existing) {
    return NextResponse.json({ error: 'Больничный не найден' }, { status: 404 });
  }
  if (existing.status === 'closed') {
    return NextResponse.json({ error: 'Больничный уже закрыт' }, { status: 400 });
  }

  const formData = await request.formData();
  const endDate = parseDateOnly(formData.get('endDate'));
  const fileValue = formData.get('file');
  const file = fileValue instanceof File ? fileValue : null;

  if (!endDate) {
    return NextResponse.json({ error: 'Выберите дату закрытия больничного' }, { status: 400 });
  }

  const days = calcCalendarDays(existing.startDate, endDate);
  if (days <= 0) {
    return NextResponse.json({ error: 'Дата закрытия должна быть позже даты открытия' }, { status: 400 });
  }

  if (!file || file.size === 0) {
    return NextResponse.json({ error: 'Прикрепите файл больничного' }, { status: 400 });
  }
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: 'Файл должен быть не больше 10 МБ' }, { status: 400 });
  }
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return NextResponse.json({ error: 'Разрешены только PDF, JPG и PNG' }, { status: 400 });
  }

  const uploadRoot = process.env.UPLOAD_DIR ?? path.join(process.cwd(), 'storage', 'uploads');
  const userDir = path.join(uploadRoot, user.id, 'sick-leaves');
  await mkdir(userDir, { recursive: true });

  const storedName = `${Date.now()}-${crypto.randomUUID()}-${safeFileName(file.name)}`;
  const absolutePath = path.join(userDir, storedName);
  const relativePath = path.relative(uploadRoot, absolutePath);
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(absolutePath, buffer);

  const now = new Date();
  const [sickLeave] = await prisma.$transaction(async (tx) => {
    const record = await tx.sickLeave.update({
      where: { id },
      data: {
        endDate,
        days,
        status: 'closed',
        hasFile: true,
        fileName: file.name,
        filePath: relativePath,
        fileSize: file.size,
        fileMimeType: file.type,
      },
    });

    if (user.managerId) {
      await tx.notification.create({
        data: {
          userId: user.managerId,
          type: 'info',
          title: 'Закрыт больничный',
          description: `${user.name} закрыл больничный за период ${existing.startDate.toLocaleDateString('ru-RU')} - ${endDate.toLocaleDateString('ru-RU')}`,
          date: now,
          time: now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
          read: false,
        },
      });
    }

    return [record];
  });

  return NextResponse.json({ sickLeave: serializeSickLeave(sickLeave) });
}
