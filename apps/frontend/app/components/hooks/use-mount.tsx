import React from 'react';

type Teardown = () => void;

type UseMountCallback = () => void | Promise<void> | Teardown;

export function useMount(callback: UseMountCallback) {
  React.useEffect(() => {
    const teardown = callback();
    return () => {
      if (typeof teardown === 'function') {
        teardown();
      }
    };
  }, []);
}
