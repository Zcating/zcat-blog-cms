import React from 'react';

import { ToggleGroup, ToggleGroupItem } from '@zcat/ui/shadcn/ui/toggle-group';

export type ZToggleGroupProps<T extends string = string> = React.ComponentProps<
  typeof ToggleGroup
> & {
  options: CommonOption<T>[];
};

export const ZToggleGroup = React.forwardRef<HTMLDivElement, ZToggleGroupProps>(
  ({ options, ...props }, ref) => {
    return (
      <ToggleGroup ref={ref} variant="outline" {...props}>
        {options.map((item, index) => (
          <ToggleGroupItem key={index} value={item.value}>
            {item.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    );
  },
);

ZToggleGroup.displayName = 'ZToggleGroup';
