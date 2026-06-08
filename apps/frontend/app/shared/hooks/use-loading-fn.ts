import React from 'react';
import { delay } from 'es-toolkit';

type AwaitFunction<TArgs extends unknown[] = unknown[], TResult = unknown> = (
  ...args: TArgs
) => Promise<TResult> | TResult;
interface LoadingFn<TArgs extends unknown[], TResult> {
  (...args: TArgs): Promise<Awaited<TResult>>;
  loading: boolean;
}

export function useLoadingFn<TArgs extends unknown[], TResult>(
  fn: AwaitFunction<TArgs, TResult>,
) {
  const [isLoading, setIsLoading] = React.useState(false);

  const loadingFn = async (...args: TArgs) => {
    setIsLoading(true);
    try {
      // DEV 模式加 1.5s 延迟便于观察 loading 态；生产直接走 fn
      if (import.meta.env.DEV) {
        const [result] = await Promise.all([fn(...args), delay(1500)]);
        return result;
      }
      return await fn(...args);
    } finally {
      setIsLoading(false);
    }
  };
  loadingFn.loading = isLoading;

  return loadingFn as LoadingFn<TArgs, TResult>;
}
