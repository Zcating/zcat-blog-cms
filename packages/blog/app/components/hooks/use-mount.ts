import React from "react";

type MountedFn = () => void | Teardown | Promise<void>;

export function useMount(fn: MountedFn) {
  React.useEffect(() => {
    const teardown = fn();
    return () => {
      if (typeof teardown !== "function") {
        return;
      }
      teardown();
    };
  }, []);
}
