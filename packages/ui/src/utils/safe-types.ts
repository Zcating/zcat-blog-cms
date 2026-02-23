import dayjs from 'dayjs';

import { isString, isNumber } from './is-types';

export function safeNumber(value: unknown, defaultValue: number = 0) {
  if (isNumber(value)) {
    return value;
  }
  const num = parseFloat(value as string);
  if (!isNumber(num)) {
    return defaultValue;
  }
  return num;
}

export function safeString(value: unknown, defaultValue: string = '') {
  if (isString(value)) {
    return value;
  }
  return defaultValue;
}

export function safeArray<T>(array: unknown, defaultValue: T[] = []): T[] {
  if (Array.isArray(array)) {
    return array;
  }
  return defaultValue;
}

const DATE_FORMAT = 'YYYY-MM-DD';

export function safeDateString(
  date: unknown,
  defaultValue?: string,
  format: string = DATE_FORMAT,
) {
  if (dayjs.isDayjs(date) && date.isValid()) {
    return date.format(format);
  }

  const dayjsDate = dayjs(date as any);
  if (dayjsDate.isValid()) {
    return dayjsDate.format(format);
  }

  return defaultValue;
}

export function safeObjectURL(data: unknown, defaultValue: string = '') {
  if (data instanceof Blob) {
    return URL.createObjectURL(data);
  }

  if (typeof data === 'string') {
    return data;
  }

  return defaultValue;
}

export function safeParseJson<T>(value: unknown): T | undefined;
export function safeParseJson<T>(value: unknown, defaultValue: T): T;
export function safeParseJson<T>(
  value: unknown,
  defaultValue?: T,
): T | undefined {
  try {
    if (value === null || value === undefined) {
      return defaultValue;
    }
    const result = JSON.parse(value as string) as T;
    if (!result) {
      return defaultValue;
    }
    return result;
  } catch {
    return defaultValue;
  }
}
