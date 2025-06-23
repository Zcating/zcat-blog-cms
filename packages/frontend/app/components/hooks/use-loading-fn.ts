import React from "react";

interface LoadingFn<T extends (...args: any[]) => Promise<any>> {
  (...args: Parameters<T>): Promise<Awaited<ReturnType<T>>>;
  loading: boolean;
}

export function useLoadingFn<T extends (...args: any[]) => Promise<any>>(fn: T) {
  const [isLoading, setIsLoading] = React.useState(false);

  const loadingFn = async (...args: Parameters<T>) => {
    setIsLoading(true);
    try {
      return await fn(...args);
    } finally {
      setIsLoading(false);
    }
  };
  loadingFn.loading = isLoading;

  return loadingFn as LoadingFn<T>;
}