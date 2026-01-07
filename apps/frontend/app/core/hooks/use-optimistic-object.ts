import React from 'react';

interface StateActionTypes<T = unknown> {
  update: ['update', T];
  rollback: ['rollback'];
}

type ObjectStateDispatch<T> = <K extends keyof StateActionTypes<T>>(
  ...args: StateActionTypes<T>[K]
) => void;

export function UseOptimisticObject<T, U = unknown>(
  initialValue: T,
  reduce: (prev: T, data: U) => T,
) {
  const [state, setState] = React.useState<T>(initialValue);
  const [optimisticState, setOptimisticState] = React.useOptimistic(
    state,
    reduce,
  );
  //
  const commitState = React.useCallback<ObjectStateDispatch<T>>((...args) => {
    switch (args[0]) {
      case 'update':
        return setState((prev) => ({ ...prev, ...args[1] }));
      case 'rollback':
        return setState((prev) => ({ ...prev }));
    }
  }, []);

  return [optimisticState, setOptimisticState, commitState] as const;
}
