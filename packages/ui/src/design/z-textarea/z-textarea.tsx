import * as React from 'react';

import { cn, Textarea } from '@zcat/ui/shadcn';

interface ZTextareaProps extends React.ComponentProps<'textarea'> {
  value?: string;
  onValueChange?: (value: string) => void;
}

export const ZTextarea = React.forwardRef<HTMLTextAreaElement, ZTextareaProps>(
  (props, ref) => {
    const { className, onValueChange, ...rest } = props;
    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onValueChange?.(e.target.value);
    };
    return (
      <Textarea
        {...rest}
        ref={ref}
        className={cn('z-scrollbar', className)}
        onChange={handleChange}
      />
    );
  },
);
ZTextarea.displayName = 'ZTextarea';
