import React from "react";
import { useUpdate } from "./use-update";

interface Options<T> {
  value?: T;
  defaultValue: T;
  onChange?: (v: T) => void;
}
export function usePropsValue<T>(options: Options<T>) {
  const { value, defaultValue, onChange } = options;

  const stateRef = React.useRef<T>(value !== undefined ? value : defaultValue);
  if (value !== undefined) {
    stateRef.current = value;
  }

  const update = useUpdate();

  const setState = (v: React.SetStateAction<T>) => {
    if (typeof v === "function") {
      stateRef.current = (v as (prev: T) => T)(stateRef.current);
    } else {
      stateRef.current = v;
    }

    update();
    return onChange?.(stateRef.current);
  };

  return [stateRef.current, setState] as const;
}
