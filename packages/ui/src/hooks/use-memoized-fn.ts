import React from 'react';

type noop = (this: any, ...args: any[]) => any;

type PickFunction<T extends noop> = (...args: Parameters<T>) => ReturnType<T>;

export function useMemoizedFn<T extends noop>(fn: T) {
  const fnRef = React.useRef<T>(fn);
  fnRef.current = React.useMemo<T>(() => fn, [fn]);

  const memoizedFn = React.useRef<PickFunction<T>>(void 0);
  if (!memoizedFn.current) {
    memoizedFn.current = function (this, ...args) {
      return fnRef.current.apply(this, args);
    };
  }

  return memoizedFn.current as T;
}
