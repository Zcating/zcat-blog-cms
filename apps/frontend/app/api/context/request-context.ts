interface ContextStore {
  run<T>(request: Request, callback: () => T): T;
  getStore(): Request | undefined;
}

let _store: ContextStore | null = null;

function ensureStore(): ContextStore {
  if (!_store) {
    _store = {
      run<T>(_request: Request, callback: () => T): T {
        return callback();
      },
      getStore() {
        return undefined;
      },
    };
  }
  return _store;
}

let _initPromise: Promise<void> | null = null;

export async function initServerStorage() {
  if (_initPromise) {
    return _initPromise;
  }

  _initPromise = (async () => {
    const { AsyncLocalStorage } = await import('node:async_hooks');
    _store = new AsyncLocalStorage<Request>();
  })();

  return _initPromise;
}

export function runWithRequest(request: Request, fn: () => Promise<unknown>) {
  return ensureStore().run(request as never, fn);
}

export function getCurrentRequest(): Request | undefined {
  return ensureStore().getStore();
}
