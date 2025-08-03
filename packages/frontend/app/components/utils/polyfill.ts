export {};

declare global {
  interface PromiseResolver<T, E = unknown> {
    promise: Promise<T>;
    resolve: (value: T | PromiseLike<T>) => void;
    reject: (reason?: E) => void;
  }
  interface PromiseConstructor {
    withResolvers<T, E = unknown>(): PromiseResolver<T, E>;
    tick(timeout?: number): Promise<void>;
  }
}

Promise.withResolvers = function withResolvers<T, E = unknown>() {
  let resolve: (value: T | PromiseLike<T>) => void;
  let reject: (reason?: E) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return {
    promise,
    resolve: resolve!,
    reject: reject!,
  };
};

Promise.tick = function tick(timeout = 0) {
  return new Promise((resolve) => {
    setTimeout(resolve, timeout);
  });
};
