export function isObject<T extends object = Record<string, any>>(
  value: unknown,
): value is T {
  return typeof value === 'object' && value !== null;
}

export function isString<T extends string = string>(
  value: unknown,
): value is T {
  return typeof value === 'string';
}
