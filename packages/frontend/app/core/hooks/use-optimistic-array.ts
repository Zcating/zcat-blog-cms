import React from 'react';
import { removeArray, updateArray } from '../utils';

interface StateActionMap<T> {
  remove: [T];
  update: [T];
  rollback: [];
}

type UseOptimisticArray<T, U = unknown> = [
  T[],
  React.Dispatch<U>,
  <K extends keyof StateActionMap<T>>(
    removeOrUpdate: K,
    ...args: StateActionMap<T>[K]
  ) => void,
];

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
    (removeOrUpdate: keyof StateActionMap<T>, value: T) => {
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
  );

  return [
    optimisticState,
    setOptimisticState,
    commitState,
  ] as unknown as UseOptimisticArray<T, U>;
}
