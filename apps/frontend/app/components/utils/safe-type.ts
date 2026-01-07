import dayjs from 'dayjs';
import { isNumber, isString } from './is-type';
import { number } from 'zod';

export function safeParse<T>(data: string, defaultValue: T): T {
  try {
    return JSON.parse(data);
  } catch (e) {
    return defaultValue;
  }
}

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

export function safeObjectURL(data: unknown, defaultValue: string = '') {
  if (data instanceof Blob) {
    return URL.createObjectURL(data);
  }

  if (typeof data === 'string') {
    return data;
  }

  return defaultValue;
}
