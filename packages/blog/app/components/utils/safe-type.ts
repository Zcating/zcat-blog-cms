export function isFunction<T>(value: T): value is T & Function {
  return typeof value === "function";
}

export function safeNumber(value: unknown, defaultValue: number): number {
  const num = Number(value);
  if (Number.isNaN(num) || !Number.isFinite(num)) {
    return defaultValue;
  }
  return num;
}

export function safePositiveNumber(
  value: unknown,
  defaultValue: number,
): number {
  const num = safeNumber(value, defaultValue);
  return num > 0 ? num : defaultValue;
}
