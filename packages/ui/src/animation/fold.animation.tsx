import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import React, { useRef } from 'react';

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

  style?: React.CSSProperties;
}

export function FoldAnimation({
  isOpen,
  duration = 0.3,
  children,
  className,
  style,
}: FoldAnimationProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const el = contentRef.current;
    if (!el) {
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
  }, [isOpen]);

  return (
    <ZView
      ref={contentRef}
      className={cn('overflow-hidden h-0 opacity-0', className)}
      style={style}
    >
      {children}
    </ZView>
  );
}
