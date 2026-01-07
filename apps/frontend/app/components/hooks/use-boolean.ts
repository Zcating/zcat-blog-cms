import React from 'react';

export function useBoolean(initialValue: boolean) {
  const [value, setValue] = React.useState(initialValue);
  const toggle = () => setValue(!value);
  return [value, toggle] as const;
}
