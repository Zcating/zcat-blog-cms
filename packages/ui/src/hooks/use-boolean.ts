import React from 'react';

export function useBoolean(
  initialValue: boolean,
): [boolean, () => void, () => void] {
  const [value, setValue] = React.useState(initialValue);
  const onTrue = () => {
    setValue(true);
  };
  const onFalse = () => {
    setValue(false);
  };
  return [value, onTrue, onFalse];
}
