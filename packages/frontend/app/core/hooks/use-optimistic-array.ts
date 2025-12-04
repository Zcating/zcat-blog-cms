import React from 'react';
import { removeArray, updateArray } from '../utils';

interface StateActionTypes<T> {
  remove: T;
  update: T;
  rollback: never;
}

type ArrayStateDispatch<T> = <K extends keyof StateActionTypes<T>>(
  removeOrUpdate: K,
  ...args: [StateActionTypes<T>[K]]
) => void;

export function useOptimisticArray<T, U = unknown>(
  initialValue: T[],
  reduce: (prev: T[], data: U) => T[],
) {
  const [state, setState] = React.useState<T[]>(initialValue);
  const [optimisticState, setOptimisticState] = React.useOptimistic(
    state,
    reduce,
  );
  //
  const commitState = React.useCallback(
    (removeOrUpdate: keyof StateActionTypes<T>, value: T) => {
      switch (removeOrUpdate) {
        case 'remove':
          return setState((prev) => removeArray(prev, value));
        case 'update':
          return setState((prev) => updateArray(prev, value));
        case 'rollback':
          return setState((prev) => [...prev]);
      }
    },
    [],
  ) as ArrayStateDispatch<T>;

  return [optimisticState, setOptimisticState, commitState] as const;
}
