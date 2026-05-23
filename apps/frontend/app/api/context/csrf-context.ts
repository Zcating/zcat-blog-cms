let _csrfStorage: {
  getStore(): string | null;
  run<T>(token: string | null, fn: () => T): T;
  enterWith(token: string | null): void;
} | null = null;

function ensureStorage() {
  if (!_csrfStorage) {
    const store: { value: string | null } = { value: null };
    _csrfStorage = {
      run<T>(token: string | null, fn: () => T): T {
        const prev = store.value;
        store.value = token;
        try {
          return fn();
        } finally {
          store.value = prev;
        }
      },
      getStore() {
        return store.value;
      },
      enterWith(token: string | null) {
        store.value = token;
      },
    };
  }
  return _csrfStorage;
}

let _initPromise: Promise<void> | null = null;

export async function initCsrfStorage() {
  if (_initPromise) {
    return _initPromise;
  }

  _initPromise = (async () => {
    try {
      const { AsyncLocalStorage } = await import('node:async_hooks');
      _csrfStorage = new AsyncLocalStorage<string | null>();
    } catch {
      // browser fallback: sync fallback already set by ensureStorage()
    }
  })();

  return _initPromise;
}

function getStorage() {
  if (_csrfStorage) {
    return _csrfStorage;
  }
  return ensureStorage();
}

export const csrfContext = {
  run: <T>(token: string | null, fn: () => T): T => {
    return getStorage().run(token, fn);
  },
  get: (): string | null => {
    return getStorage().getStore() ?? null;
  },
  set: (token: string | null) => {
    getStorage().enterWith(token);
  },
};
