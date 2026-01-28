import { usePropsValue, useWatch } from '@zcat/ui';
import React from 'react';

import { removeArray, updateArray } from '../utils';

interface StateActionTypes<T = unknown> {
  remove: ['remove', T];
  update: ['update', T];
  batchUpdate: ['batchUpdate', T[]];
  rollback: ['rollback'];
}

type ArrayStateDispatch<T> = <K extends keyof StateActionTypes<T>>(
  ...args: StateActionTypes<T>[K]
) => void;

export function useOptimisticArray<T, U = unknown>(
  initialValue: T[],
  reduce: (prev: T[], data: U) => T[],
) {
  // 初始化状态时，将初始值设置为状态值
  const [state, setState] = usePropsValue({
    value: initialValue,
    defaultValue: initialValue,
  });

  const [optimisticState, setOptimisticState] = React.useOptimistic(
    state,
    reduce,
  );

  const commitState = React.useCallback<ArrayStateDispatch<T>>((...args) => {
    switch (args[0]) {
      case 'remove':
        return setState((prev) => removeArray(prev, args[1]));
      case 'update':
        return setState((prev) => updateArray(prev, args[1]));
      case 'rollback':
        return setState((prev) => [...prev]);
      case 'batchUpdate':
        return setState((prev) => updateArray(prev, args[1]));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return [optimisticState, setOptimisticState, commitState] as const;
}
