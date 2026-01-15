/* eslint-disable react-hooks/refs */
import React from 'react';

type noop = (...args: any[]) => any;

type PickFunction<T extends noop> = (...args: Parameters<T>) => ReturnType<T>;

export function useMemoizedFn<T extends noop>(fn: T) {
  const fnRef = React.useRef<T>(fn);
  fnRef.current = React.useMemo<T>(() => fn, [fn]);

  const memoizedFn = React.useRef<PickFunction<T>>(void 0);
  if (!memoizedFn.current) {
    memoizedFn.current = function (...args) {
      return fnRef.current.apply(null, args);
    };
  }

  return memoizedFn.current as T;
}
