import { useState } from 'react';

import { useMount } from './use-mount';

const cache = new Map<string, any>();

export function useAsyncImport<T>(
  key: string,
  importer: () => Promise<T>,
): T | undefined {
  const [module, setModule] = useState<T | undefined>(() => {
    if (key && cache.has(key)) {
      return cache.get(key);
    }
    return undefined;
  });

  useMount(async () => {
    if (module) {
      return;
    }

    if (key && cache.has(key)) {
      setModule(cache.get(key));
      return;
    }

    try {
      const result = await importer();

      cache.set(key, result);

      setModule(() => result);
    } catch (error) {
      console.error(
        `Failed to load async module${key ? ` (${key})` : ''}:`,
        error,
      );
    }
  });

  return module;
}
