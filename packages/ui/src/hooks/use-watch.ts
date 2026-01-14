import React from 'react';

import { useMemoizedFn } from './use-memoized-fn';

export function useWatch<T extends unknown[]>(
  deps: T,
  callback: (...args: T) => void,
) {
  const handleCallback = useMemoizedFn(callback);

  React.useEffect(() => {
    handleCallback(...deps);
  }, deps);
}
