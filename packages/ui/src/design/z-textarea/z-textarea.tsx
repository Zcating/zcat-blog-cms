import * as React from 'react';
import { Textarea } from '@zcat/ui/shadcn';

interface ZTextareaProps extends React.ComponentProps<'textarea'> {
  value?: string;
  onValueChange?: (value: string) => void;
}

export const ZTextarea = React.forwardRef<HTMLTextAreaElement, ZTextareaProps>(
  (props, ref) => {
    const { onValueChange, ...rest } = props;
    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onValueChange?.(e.target.value);
    };
    return <Textarea ref={ref} {...rest} onChange={handleChange} />;
  },
);
ZTextarea.displayName = 'ZTextarea';
