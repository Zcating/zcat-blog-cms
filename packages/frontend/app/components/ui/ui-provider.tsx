import { useAtom, atom } from 'jotai';
import React from 'react';

interface UiProviderContextState {
  portals: React.ReactPortal[];
}

export namespace UiProviderContext {
  type Listener = (value: UiProviderContextState) => void;
  let context: UiProviderContextState = {
    portals: [],
  };

  const listener: Listener[] = [];

  export function add(portal: React.ReactPortal) {
    context = { ...context, portals: [...context.portals, portal] };
    listener.forEach((fn) => fn(context));
  }

  export function remove(key: string) {
    context = {
      ...context,
      portals: context.portals.filter((p) => p.key === key),
    };
    listener.forEach((fn) => fn(context));
  }

  export function get(): UiProviderContextState;
  export function get<T>(fn: (value: UiProviderContextState) => T): T;
  export function get(fn?: (value: UiProviderContextState) => any): any {
    return typeof fn === 'function' ? fn(context) : context;
  }

  export function subscribe(fn: Listener) {
    listener.push(fn);
    return () => {
      listener.splice(listener.indexOf(fn), 1);
    };
  }
}

function useUiProviderContext<T>(fn: (value: UiProviderContextState) => T) {
  const [state, setState] = React.useState(UiProviderContext.get());
  React.useEffect(() => {
    return UiProviderContext.subscribe(setState);
  }, []);

  return React.useMemo(() => fn(state), [state]);
}

interface UiProviderProps {
  children: React.ReactNode;
}
export function UiProvider({ children }: UiProviderProps) {
  const portals = useUiProviderContext((state) => state.portals);

  // const [state, setState] = React.useState(UiProviderContext.get());
  // React.useEffect(() => {
  //   const teardown = UiProviderContext.subscribe(setState);
  //   return () => {
  //     teardown();
  //     console.log('unsubscribe');
  //   };
  // }, []);

  return (
    <React.Fragment>
      {children}
      <div id="portal-root">{portals}</div>
    </React.Fragment>
  );
}
