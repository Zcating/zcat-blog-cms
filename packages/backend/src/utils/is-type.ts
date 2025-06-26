export function isNumber(value: unknown): value is number {
  return typeof value === 'number';
}

export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

export function isObject<T = Record<string, any>>(value: unknown): value is T {
  return typeof value === 'object' && value !== null;
}
