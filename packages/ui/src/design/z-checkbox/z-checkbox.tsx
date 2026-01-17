import { Checkbox } from '@zcat/ui/shadcn/ui/checkbox';
import { isFunction } from '@zcat/ui/utils';

import type React from 'react';

export interface ZCheckboxProps extends Omit<
  React.ComponentProps<typeof Checkbox>,
  'checked' | 'onCheckedChange' | 'onChange' | 'value'
> {
  value?: boolean;
  onValueChange?: (checked: boolean) => void;
}

export function ZCheckbox({ value, onValueChange, ...props }: ZCheckboxProps) {
  return (
    <Checkbox
      checked={value}
      onCheckedChange={(checked) => {
        if (isFunction(onValueChange)) {
          onValueChange(checked === true);
        }
      }}
      {...props}
    />
  );
}
