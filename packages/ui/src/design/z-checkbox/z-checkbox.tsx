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
  // 这个解构不是对 props 类型 Omit 的重复：Omit 只在编译期生效，调用方或 ZFormItem 注入的
  // onChange/onInput 仍会落进展开对象并被转发给 Radix Root 渲染出的 button。ZCheckbox 自身没有
  // onChange 可以在展开之后覆盖它，所以这里若只剔除 onInput，ZFormItem 的 ...field 就会把一个
  // DOM 事件级通道送到 <button> 上。
  const {
    onChange: _onChange,
    onInput: _onInput,
    ...forwarded
  } = props as React.ComponentProps<typeof Checkbox>;
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
