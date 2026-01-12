import { Input } from '@zcat/ui/shadcn/ui/input';

import type React from 'react';

interface ZInputProps extends React.ComponentProps<'input'> {
  className?: string;
  placeholder?: string;
  value?: string;
  onValueChange?: (value: string) => void;
}

export function ZInput({
  className,
  placeholder,
  value,
  onValueChange,
  ...rest
}: ZInputProps) {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onValueChange?.(event.target.value);
  };

  return (
    <Input
      className={className}
      placeholder={placeholder}
      value={value}
      onChange={handleChange}
      {...rest}
    />
  );
}
