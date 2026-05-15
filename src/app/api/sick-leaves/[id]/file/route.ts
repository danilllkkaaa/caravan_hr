import { NextResponse } from 'next/server';
import { requireCurrentUser } from '@/lib/server/auth';
import { readUploadedFile } from '@/lib/server/files';
import { prisma } from '@/lib/server/prisma';

export const runtime = 'nodejs';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireCurrentUser();
  if (response) return response;

  const { id: idStr } = await params;
  const id = Number(idStr);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: 'Некорректный id' }, { status: 400 });
  }

  const sickLeave = await prisma.sickLeave.findUnique({ where: { id } });
  if (!sickLeave || !sickLeave.hasFile || !sickLeave.filePath) {
    return NextResponse.json({ error: 'Файл не найден' }, { status: 404 });
  }

  const isOwner = sickLeave.userId === user.id;
  const isManagerOfOwner =
    user.role === 'manager' &&
    (await prisma.user.count({ where: { id: sickLeave.userId, managerId: user.id } })) > 0;
  const isAdmin = user.role === 'admin';

  if (!isOwner && !isManagerOfOwner && !isAdmin) {
    return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
  }

  const fileBuffer = await readUploadedFile(sickLeave.filePath);
  if (!fileBuffer) {
    return NextResponse.json({ error: 'Файл не найден на диске' }, { status: 404 });
  }

  const contentType = sickLeave.fileMimeType ?? 'application/octet-stream';
  const fileName = encodeURIComponent(sickLeave.fileName ?? 'file');
  const body = fileBuffer.buffer.slice(
    fileBuffer.byteOffset,
    fileBuffer.byteOffset + fileBuffer.byteLength,
  ) as ArrayBuffer;

  return new Response(body, {
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename*=UTF-8''${fileName}`,
      'Content-Length': String(fileBuffer.byteLength),
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
