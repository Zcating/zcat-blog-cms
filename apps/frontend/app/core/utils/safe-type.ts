import dayjs from 'dayjs';

export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

export function safeArray<T>(value: unknown, defaultValue: T[] = []): T[] {
  return Array.isArray(value) ? value : defaultValue;
}

const DATE_FORMAT = 'YYYY-MM-DD HH:mm:ss';

export function safeDateString(date: unknown, defaultValue: string = '') {
  const parsed = dayjs.isDayjs(date) ? date : dayjs(date as any);
  if (parsed.isValid()) {
    return parsed.format(DATE_FORMAT);
  }
  return defaultValue;
}
