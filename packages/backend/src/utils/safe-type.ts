export function safeNumber(value: unknown, defaultValue: number = 0) {
  const num = parseFloat(value as string);
  if (isNaN(num)) {
    return defaultValue;
  }
  return num;
}

export function safeParseObject<T extends object>(
  value: string,
  defaultValue: T = {} as T,
) {
  try {
    return JSON.parse(value) as T;
  } catch {
    return defaultValue;
  }
}
