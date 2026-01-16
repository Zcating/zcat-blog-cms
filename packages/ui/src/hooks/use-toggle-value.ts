import React from 'react';

export function useToggleValue(initialValue: boolean) {
  const [value, setValue] = React.useState(initialValue);
  const onToggle = () => {
    setValue((prev) => !prev);
  };
  return [value, onToggle] as const;
}
