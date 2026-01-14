import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import React, { useRef, useState } from 'react';

import { cn } from '@zcat/ui/shadcn/lib/utils';

import { ZView } from '../design/z-view';

export interface FoldAnimationProps {
  /**
   * 是否展开
   */
  isOpen: boolean;
  /**
   * 动画持续时间
   */
  duration?: number;
  /**
   * 内容
   */
  children: React.ReactNode;
  /**
   * 类名
   */
  className?: string;
}

export function FoldAnimation({
  isOpen,
  duration = 0.3,
  children,
  className,
}: FoldAnimationProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const isMounted = useRef(false);

  // 记录初始状态，用于设置初始样式，避免 React 更新样式覆盖 GSAP 动画
  const [initialOpen] = useState(isOpen);

  useGSAP(
    () => {
      const el = contentRef.current;
      if (!el) {
        return;
      }

      // 跳过首次渲染的动画
      if (!isMounted.current) {
        isMounted.current = true;
        return;
      }

      if (isOpen) {
        // 展开动画
        gsap.fromTo(
          el,
          { height: 0, opacity: 0 },
          { height: 'auto', opacity: 1, duration, ease: 'power2.out' },
        );
      } else {
        // 收起动画
        gsap.to(el, {
          height: 0,
          opacity: 0,
          duration,
          ease: 'power2.inOut',
        });
      }
    },
    { dependencies: [isOpen, duration] },
  );

  return (
    <ZView
      ref={contentRef}
      className={cn('overflow-hidden', className)}
      style={{
        // 仅在组件挂载时使用初始状态设置样式
        // 后续的样式变更完全由 GSAP 接管，避免 React 重新渲染时覆盖动画样式
        height: initialOpen ? 'auto' : 0,
        opacity: initialOpen ? 1 : 0,
      }}
    >
      {children}
    </ZView>
  );
}
