export function safeNumber(value: unknown, defaultValue: number = 0) {
  const num = parseFloat(value as string);
  if (isNaN(num)) {
    return defaultValue;
  }
  return num;
}
