import dayjs from 'dayjs';

export function safeParse<T>(data: string, defaultValue: T): T {
  try {
    return JSON.parse(data);
  } catch (e) {
    return defaultValue;
  }
}

export function safeArray<T>(array: unknown, defaultValue: T[] = []): T[] {
  if (Array.isArray(array)) {
    return array;
  }
  return defaultValue;
}

const DATE_FORMAT = 'YYYY-MM-DD HH:mm:ss';

export function safeDateString(date: unknown, defaultValue?: string) {
  if (dayjs.isDayjs(date) && date.isValid()) {
    return date.format(DATE_FORMAT);
  }

  const dayjsDate = dayjs(date as any);
  if (dayjsDate.isValid()) {
    return dayjsDate.format(DATE_FORMAT);
  }

  return defaultValue;
}
