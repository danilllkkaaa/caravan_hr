import crypto from 'crypto';
import { mkdir, readFile, unlink, writeFile } from 'fs/promises';
import path from 'path';

export const MAX_UPLOAD_FILE_SIZE = 10 * 1024 * 1024;
export const ALLOWED_SICK_LEAVE_MIME_TYPES = new Set(['application/pdf', 'image/jpeg', 'image/png']);

export type StoredUpload = {
  fileName: string;
  filePath: string;
  fileSize: number;
  fileMimeType: string;
};

export function validateSickLeaveFile(file: File | null, buffer?: Buffer): string | null {
  if (!file || file.size === 0) return 'Прикрепите файл больничного';
  if (file.size > MAX_UPLOAD_FILE_SIZE) return 'Файл должен быть не больше 10 МБ';
  if (!ALLOWED_SICK_LEAVE_MIME_TYPES.has(file.type)) return 'Разрешены только PDF, JPG и PNG';
  if (buffer && !fileSignatureMatchesMimeType(buffer, file.type)) {
    return 'Файл не соответствует заявленному типу';
  }
  return null;
}

export function getUploadRoot(): string {
  if (process.env.UPLOAD_DIR) return path.resolve(process.env.UPLOAD_DIR);
  return '/app/storage/uploads';
}

export async function saveUploadedFile(file: File, segments: string[], buffer?: Buffer): Promise<StoredUpload> {
  const uploadRoot = getUploadRoot();
  const targetDir = path.join(uploadRoot, ...segments);
  await mkdir(targetDir, { recursive: true });

  const storedName = `${Date.now()}-${crypto.randomUUID()}-${safeFileName(file.name)}`;
  const absolutePath = path.join(targetDir, storedName);
  const fileBuffer = buffer ?? Buffer.from(await file.arrayBuffer());
  await writeFile(absolutePath, fileBuffer);

  return {
    fileName: file.name,
    filePath: path.relative(uploadRoot, absolutePath),
    fileSize: file.size,
    fileMimeType: file.type,
  };
}

export function resolveUploadedFile(relativePath: string): string | null {
  const uploadRoot = getUploadRoot();
  const resolved = path.resolve(uploadRoot, relativePath);
  const isInsideRoot = resolved === uploadRoot || resolved.startsWith(uploadRoot + path.sep);
  return isInsideRoot ? resolved : null;
}

export async function readUploadedFile(relativePath: string): Promise<Buffer | null> {
  const resolved = resolveUploadedFile(relativePath);
  if (!resolved) return null;
  return readFile(resolved).catch(() => null);
}

export async function deleteUploadedFile(relativePath: string): Promise<void> {
  const resolved = resolveUploadedFile(relativePath);
  if (!resolved) return;
  await unlink(resolved).catch(() => null);
}

function safeFileName(name: string): string {
  return name.replace(/[^\wа-яА-ЯёЁ.\-]+/g, '_').slice(0, 120);
}

function fileSignatureMatchesMimeType(buffer: Buffer, mimeType: string): boolean {
  if (mimeType === 'application/pdf') {
    return buffer.subarray(0, 4).equals(Buffer.from('%PDF'));
  }
  if (mimeType === 'image/jpeg') {
    return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }
  if (mimeType === 'image/png') {
    return buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  }
  return false;
}
