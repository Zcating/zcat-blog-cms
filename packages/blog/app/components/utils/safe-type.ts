export function isFunction<T>(value: T): value is T & Function {
  return typeof value === "function";
}
