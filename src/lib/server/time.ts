import type { TimeStatus } from '@prisma/client';
import { APP_TIMEZONE, todayDateOnly } from './dates';

export const EMPTY_TIME = '—';
const LUNCH_MINUTES = 60;

export function nowUtcClock(now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: APP_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(now);

  const hours = parts.find((part) => part.type === 'hour')?.value ?? '00';
  const minutes = parts.find((part) => part.type === 'minute')?.value ?? '00';
  return `${hours}:${minutes}`;
}

export function todayWorkDate(now = new Date()): Date {
  return todayDateOnly(now);
}

export function parseClockMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

export function calcWorkedMinutes(checkIn: string, checkOut: string): number {
  return parseClockMinutes(checkOut) - parseClockMinutes(checkIn) - LUNCH_MINUTES;
}

export function formatWorkedTime(minutes: number): string {
  const safeMinutes = Math.max(minutes, 0);
  const hours = Math.floor(safeMinutes / 60);
  const rest = safeMinutes % 60;
  return `${hours}ч ${rest}м`;
}

export function calcTimeStatus(workedMinutes: number): TimeStatus {
  if (workedMinutes > 480) return 'overtime';
  if (workedMinutes >= 420) return 'normal';
  return 'short';
}
