export function safeNumber(value: unknown, defaultValue: number = 0) {
  const num = parseFloat(value as string);
  if (isNaN(num)) {
    return defaultValue;
  }
  return num;
}

export function safeParseObject<T extends object>(
  value: unknown,
  defaultValue: T = {} as T,
) {
  try {
    return JSON.parse(value as string) as T;
  } finally {
    return defaultValue;
  }
}
