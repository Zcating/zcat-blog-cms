import React from 'react';

import { isFunction } from '../utils/is-types';

export function useAdaptElement(element: unknown): React.ReactNode {
  return React.useMemo(() => {
    if (isFunction(element)) {
      return React.createElement(element);
    }
    return element as React.ReactNode;
  }, [element]);
}
