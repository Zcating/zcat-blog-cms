import * as React from 'react';

import { cn, Textarea } from '@zcat/ui/shadcn';

interface ZTextareaProps extends Omit<
  React.ComponentProps<'textarea'>,
  'onChange' | 'onInput'
> {
  value?: string;
  onValueChange?: (value: string) => void;
}

export const ZTextarea = React.forwardRef<HTMLTextAreaElement, ZTextareaProps>(
  (props, ref) => {
    const { className, onValueChange, ...rest } = props;
    const { onInput: _onInput, ...forwarded } =
      rest as React.ComponentProps<'textarea'>;
    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onValueChange?.(e.target.value);
    };
    return (
      <Textarea
        {...forwarded}
        ref={ref}
        className={cn('z-scrollbar', className)}
        onChange={handleChange}
      />
    );
  },
);
ZTextarea.displayName = 'ZTextarea';
