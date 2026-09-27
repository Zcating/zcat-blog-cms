import { Checkbox } from '@zcat/ui/shadcn/ui/checkbox';
import { isFunction } from '@zcat/ui/utils';

import type React from 'react';

export interface ZCheckboxProps extends Omit<
  React.ComponentProps<typeof Checkbox>,
  'checked' | 'onCheckedChange' | 'onChange' | 'onInput' | 'value'
> {
  value?: boolean;
  onValueChange?: (checked: boolean) => void;
}

export function ZCheckbox({ value, onValueChange, ...props }: ZCheckboxProps) {
  const { onInput: _onInput, ...forwarded } = props as React.ComponentProps<
    typeof Checkbox
  >;
  return (
    <Checkbox
      {...forwarded}
      checked={value}
      onCheckedChange={(checked) => {
        if (isFunction(onValueChange)) {
          onValueChange(checked === true);
        }
      }}
    />
  );
}
