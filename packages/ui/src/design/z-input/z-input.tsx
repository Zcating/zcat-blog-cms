import { Input } from '@zcat/ui/shadcn/ui/input';

import type React from 'react';

interface ZInputProps extends Omit<
  React.ComponentProps<'input'>,
  'onChange' | 'onInput'
> {
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
  // 这个解构不是对 props 类型 Omit 的重复：Omit 只在编译期生效，调用方或 ZFormItem 注入的
  // onChange/onInput 仍会落进展开对象并被转发给原生元素。显式剔除才使「值级通道是唯一变更通道」
  // 在运行时成立；仅靠 JSX 属性顺序压过它是不够的。
  const {
    onChange: _onChange,
    onInput: _onInput,
    ...forwarded
  } = rest as React.ComponentProps<'input'>;
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onValueChange?.(event.target.value);
  };

  return (
    <Input
      className={className}
      placeholder={placeholder}
      value={value}
      {...forwarded}
      onChange={handleChange}
    />
  );
}
