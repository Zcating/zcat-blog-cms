import React from 'react';

import { cn } from '@zcat/ui/shadcn';

export type ZViewProps = React.ComponentProps<'div'> & {
  backgroundColor?: string;
};

export const ZView = React.forwardRef<HTMLDivElement, ZViewProps>(
  (props: ZViewProps, ref) => {
    const { backgroundColor, className, ...rest } = props;
    return (
      <div
        ref={ref}
        {...rest}
        className={cn('z-scrollbar', className)}
        style={{ backgroundColor }}
      />
    );
  },
);

ZView.displayName = 'ZView';
