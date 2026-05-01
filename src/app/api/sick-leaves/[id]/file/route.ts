import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';
import { requireCurrentUser } from '@/lib/server/auth';
import { prisma } from '@/lib/server/prisma';

export const runtime = 'nodejs';

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const { user, response } = await requireCurrentUser();
  if (response) return response;

  const id = Number(params.id);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: 'Некорректный id' }, { status: 400 });
  }

  const sickLeave = await prisma.sickLeave.findUnique({ where: { id } });
  if (!sickLeave || !sickLeave.hasFile || !sickLeave.filePath) {
    return NextResponse.json({ error: 'Файл не найден' }, { status: 404 });
  }

  // Access control: owner, their manager, or admin
  const isOwner = sickLeave.userId === user.id;
  const isManagerOfOwner =
    user.role === 'manager' &&
    (await prisma.user.count({ where: { id: sickLeave.userId, managerId: user.id } })) > 0;
  const isAdmin = user.role === 'admin';

  if (!isOwner && !isManagerOfOwner && !isAdmin) {
    return NextResponse.json({ error: 'Доступ запрещён' }, { status: 403 });
  }

  // Path traversal guard: resolved path must be inside UPLOAD_DIR
  const uploadRoot = path.resolve(process.env.UPLOAD_DIR ?? path.join(process.cwd(), 'storage', 'uploads'));
  const resolved = path.resolve(path.join(uploadRoot, sickLeave.filePath));

  if (!resolved.startsWith(uploadRoot + path.sep) && resolved !== uploadRoot) {
    return NextResponse.json({ error: 'Некорректный путь к файлу' }, { status: 400 });
  }

  const fileBuffer = await readFile(resolved).catch(() => null);
  if (!fileBuffer) {
    return NextResponse.json({ error: 'Файл не найден на диске' }, { status: 404 });
  }

  const contentType = sickLeave.fileMimeType ?? 'application/octet-stream';
  const fileName = encodeURIComponent(sickLeave.fileName ?? 'file');

  return new Response(fileBuffer, {
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `inline; filename*=UTF-8''${fileName}`,
      'Content-Length': String(fileBuffer.byteLength),
      'Cache-Control': 'private, no-store',
    },
  });
}
