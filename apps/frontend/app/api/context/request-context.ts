import { AsyncLocalStorage } from 'node:async_hooks';

const requestStorage = new AsyncLocalStorage<Request>();

export function runWithRequest(request: Request, fn: () => Promise<unknown>) {
  return requestStorage.run(request, fn);
}

export function getCurrentRequest(): Request | undefined {
  return requestStorage.getStore();
}
