import { AsyncLocalStorage } from 'node:async_hooks';

const csrfStorage = new AsyncLocalStorage<string | null>();

export const csrfContext = {
  run: <T>(token: string | null, fn: () => T): T => {
    return csrfStorage.run(token, fn);
  },
  get: (): string | null => {
    return csrfStorage.getStore() ?? null;
  },
  set: (token: string | null) => {
    csrfStorage.enterWith(token);
  },
};
