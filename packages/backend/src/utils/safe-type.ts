export function safeNumber(value: unknown, defaultValue: number = 0) {
  const num = Number(value);
  if (isNaN(num)) {
    return defaultValue;
  }
  return num;
}
