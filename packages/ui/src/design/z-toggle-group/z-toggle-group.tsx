import React from 'react';

import { ToggleGroup, ToggleGroupItem } from '@zcat/ui/shadcn/ui/toggle-group';

export type ZToggleGroupProps = React.ComponentProps<typeof ToggleGroup> & {
  options: CommonOption<string>[];
};

export const ZToggleGroup = React.forwardRef<HTMLDivElement, ZToggleGroupProps>(
  ({ options, ...props }, ref) => {
    return (
      <ToggleGroup ref={ref} variant="outline" {...props}>
        {options.map(({ value, label }, index) => (
          <ToggleGroupItem key={index} value={value}>
            {label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    );
  },
);

ZToggleGroup.displayName = 'ZToggleGroup';
