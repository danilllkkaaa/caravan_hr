export const APP_TIMEZONE = process.env.APP_TIMEZONE || 'Asia/Qyzylorda';

function zonedDateParts(date: Date, timeZone = APP_TIMEZONE) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  const get = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  return {
    year: get('year'),
    month: get('month'),
    day: get('day'),
  };
}

export function parseDateOnly(value: unknown): Date | null {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function todayDateOnly(now = new Date()): Date {
  const { year, month, day } = zonedDateParts(now);
  return new Date(Date.UTC(year, month - 1, day));
}

export function calcCalendarDays(startDate: Date, endDate: Date): number {
  return Math.round((endDate.getTime() - startDate.getTime()) / 86400000) + 1;
}

export function formatRuDate(date: Date): string {
  return date.toLocaleDateString('ru-RU');
}

export function formatRuTime(date: Date): string {
  return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', timeZone: APP_TIMEZONE });
}
