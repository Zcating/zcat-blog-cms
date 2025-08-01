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

export function isBlob(value: unknown): value is Blob {
  return value instanceof Blob;
}

export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}
