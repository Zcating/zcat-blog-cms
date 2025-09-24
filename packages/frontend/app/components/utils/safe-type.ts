export function safeParse<T>(data: string, defaultValue: T): T {
  try {
    return JSON.parse(data);
  } catch (e) {
    return defaultValue;
  }
}
