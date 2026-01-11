declare global {
  interface PromiseConstructor {
    timeout(ms: number): Promise<void>;
  }

  type Teardown = () => void;
}

Promise.timeout = function (ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

export {};
