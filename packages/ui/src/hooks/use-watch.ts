import React from 'react';

import { isFunction, Teardown } from '../utils';

import { useMemoizedFn } from './use-memoized-fn';

export function useWatch<T extends unknown[] | []>(
  deps: [...T],
  callback: (...args: [...T]) => void | Teardown | Promise<void>,
) {
  const handleCallback = useMemoizedFn(callback);

  React.useEffect(() => {
    const result = handleCallback(...deps);
    if (!isFunction(result)) {
      return;
    }
    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
