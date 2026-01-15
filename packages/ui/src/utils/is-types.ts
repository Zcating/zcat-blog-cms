export function isObject<T extends object = object>(value: unknown): value is T;
export function isObject(value: unknown): boolean {
  return value != null && typeof value === 'object';
}

export function isPromise<T = unknown>(value: unknown): value is Promise<T>;
export function isPromise(value: unknown): boolean {
  return isObject<{ then: unknown }>(value) && typeof value.then === 'function';
}

type FnType = (...args: unknown[]) => unknown;

export function isFunction<T extends FnType = FnType>(
  value: unknown,
): value is T;
export function isFunction(value: unknown): boolean {
  return typeof value === 'function';
}
