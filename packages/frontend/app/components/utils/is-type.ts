export function isNumber<T extends number = number>(
  value: unknown,
): value is T {
  return (
    typeof value === 'number' && !Number.isNaN(value) && Number.isFinite(value)
  );
}

export function isString<T extends string = string>(
  value: unknown,
): value is T {
  return typeof value === 'string';
}

export function isObject<T extends object = Record<string, any>>(
  value: unknown,
): value is T {
  return typeof value === 'object' && value !== null;
}

export function isFunction<T extends (...args: any[]) => any>(
  value: unknown,
): value is T {
  return typeof value === 'function';
}

export function isBlob(value: unknown): value is Blob {
  return value instanceof Blob;
}

export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

export function isRange(
  value: unknown,
  min: number,
  max: number,
): value is Range {
  if (!isNumber(value)) {
    return false;
  }
  return value >= min && value <= max;
}
