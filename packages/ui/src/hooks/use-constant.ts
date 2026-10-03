import { useRef } from 'react';

export function useConstant<T>(fn: () => T): T {
  const ref = useRef<{ v: T } | null>(null);
  ref.current ??= { v: fn() };
  return ref.current.v;
}
