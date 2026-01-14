import React, { useState } from 'react';

import { FoldAnimation } from '@zcat/ui/animation/fold.animation';
import { cn } from '@zcat/ui/shadcn/lib/utils';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@zcat/ui/shadcn/ui/collapsible';

export interface ZCollapsibleProps {
  /**
   * 触发器内容（通常是标题或按钮）
   */
  trigger?: React.ReactNode;
  /**
   * 折叠内容
   */
  children?: React.ReactNode;
  /**
   * 默认是否展开（非受控模式）
   */
  defaultOpen?: boolean;
  /**
   * 是否展开（受控模式）
   */
  open?: boolean;
  /**
   * 展开状态改变时的回调
   */
  onOpenChange?: (open: boolean) => void;
  /**
   * 根元素类名
   */
  className?: string;
  /**
   * 触发器类名
   */
  triggerClassName?: string;
  /**
   * 内容区域类名
   */
  contentClassName?: string;
}

export function ZCollapsible({
  trigger,
  children,
  defaultOpen = false,
  open: controlledOpen,
  onOpenChange,
  className,
  triggerClassName,
  contentClassName,
}: ZCollapsibleProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : uncontrolledOpen;

  const handleOpenChange = (value: boolean) => {
    if (!isControlled) {
      setUncontrolledOpen(value);
    }
    onOpenChange?.(value);
  };

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={handleOpenChange}
      className={cn('w-full', className)}
    >
      <CollapsibleTrigger className={cn('w-full text-left', triggerClassName)}>
        {trigger}
      </CollapsibleTrigger>
      {/* 使用 forceMount 确保元素始终渲染，由 FoldAnimation 控制可见性 */}
      <CollapsibleContent
        forceMount
        className={cn('overflow-hidden', contentClassName)}
      >
        <FoldAnimation isOpen={!!isOpen}>{children}</FoldAnimation>
      </CollapsibleContent>
    </Collapsible>
  );
}
