import React from 'react';

type AwaitFunction = (...args: any[]) => Promise<any> | void;
interface LoadingFn<T extends AwaitFunction> {
  (...args: Parameters<T>): Promise<Awaited<ReturnType<T>>>;
  loading: boolean;
}

export function useLoadingFn<T extends AwaitFunction>(fn: T) {
  const [isLoading, setIsLoading] = React.useState(false);

  const loadingFn = async (...args: Parameters<T>) => {
    setIsLoading(true);
    try {
      const [result] = await Promise.all([fn(...args), Promise.tick(1500)]);
      return result;
    } finally {
      setIsLoading(false);
    }
  };
  loadingFn.loading = isLoading;

  return loadingFn as LoadingFn<T>;
}
