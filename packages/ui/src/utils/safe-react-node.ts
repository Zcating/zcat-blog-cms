import React from 'react';

import { isFunction } from './is-types';

export function safeReactNode(
  element: unknown,
  defaultValue: () => React.ReactNode,
): React.ReactNode {
  if (isFunction(element)) {
    return React.createElement(element);
  }
  return (element as React.ReactNode) || React.createElement(defaultValue);
}
