import { NextResponse } from 'next/server';
import { requireCurrentUser } from '@/lib/server/auth';
import { calcCalendarDays, formatRuDate, parseDateOnly } from '@/lib/server/dates';
import { deleteUploadedFile, saveUploadedFile, type StoredUpload, validateSickLeaveFile } from '@/lib/server/files';
import { notifyManager } from '@/lib/server/notifications';
import { prisma } from '@/lib/server/prisma';
import { requireSameOrigin } from '@/lib/server/requestSecurity';
import { serializeSickLeave } from '@/lib/server/serializers';

export const runtime = 'nodejs';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const originError = requireSameOrigin(request);
  if (originError) return originError;

  const { user, response } = await requireCurrentUser();
  if (response) return response;

  const { id: idStr } = await params;
  const id = Number(idStr);
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

  const fileBuffer = file ? Buffer.from(await file.arrayBuffer()) : undefined;
  const fileError = validateSickLeaveFile(file, fileBuffer);
  if (fileError) return NextResponse.json({ error: fileError }, { status: 400 });

  let storedFile: StoredUpload | null = null;

  try {
    storedFile = await saveUploadedFile(file!, [user.id, 'sick-leaves'], fileBuffer);

    const sickLeave = await prisma.$transaction(async (tx) => {
      const updated = await tx.sickLeave.updateMany({
        where: { id, userId: user.id, status: 'opened' },
        data: {
          endDate,
          days,
          status: 'closed',
          hasFile: true,
          fileName: storedFile!.fileName,
          filePath: storedFile!.filePath,
          fileSize: storedFile!.fileSize,
          fileMimeType: storedFile!.fileMimeType,
        },
      });

      if (updated.count !== 1) {
        throw new Error('SICK_LEAVE_ALREADY_CLOSED');
      }

      const record = await tx.sickLeave.findUniqueOrThrow({ where: { id } });

      await notifyManager(tx, user, {
        type: 'info',
        title: 'Закрыт больничный',
        description: `${user.name} закрыл больничный за период ${formatRuDate(existing.startDate)} - ${formatRuDate(endDate)}`,
      });

      return record;
    });

    return NextResponse.json({ sickLeave: serializeSickLeave(sickLeave) });
  } catch (error) {
    if (storedFile) await deleteUploadedFile(storedFile.filePath);
    if (error instanceof Error && error.message === 'SICK_LEAVE_ALREADY_CLOSED') {
      return NextResponse.json({ error: 'Больничный уже закрыт' }, { status: 409 });
    }
    throw error;
  }
}
