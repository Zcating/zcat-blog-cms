export function safeNumber(value: unknown, defaultValue: number = 0) {
  const num = parseFloat(value as string);
  if (isNaN(num)) {
    return defaultValue;
  }
  return num;
}

export function safeParse<T>(value: unknown): T | null;
export function safeParse<T>(value: unknown, defaultValue: T): T;
export function safeParse<T>(
  value: unknown,
  defaultValue: T | null = null,
): T | null {
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
