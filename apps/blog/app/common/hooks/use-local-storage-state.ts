import { safeParseJson } from '@zcat/ui';
import React from 'react';

export function useLocalStorageState<T>(key: string, defaultValue: T) {
  const isBrowser = typeof window !== 'undefined';

  const [state, setState] = React.useState<T>(() => {
    if (!isBrowser) {
      return defaultValue;
    }
    const item = window.localStorage.getItem(key);
    return safeParseJson(item, defaultValue);
  });

  const setLocalStorageState = (value: T) => {
    setState(value);
    if (!isBrowser) {
      return defaultValue;
    }
    window.localStorage.setItem(key, JSON.stringify(value));
  };

  return [state, setLocalStorageState] as const;
}
