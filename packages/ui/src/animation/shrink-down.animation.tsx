/* eslint-disable react-hooks/refs */
import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import React from 'react';

import { ZView } from '../design';
import { cn } from '../shadcn';

export interface ShrinkDownAnimationProps extends React.HTMLAttributes<HTMLDivElement> {
  show: boolean;
  duration?: number;
  distance?: number;
  scaleTo?: number;
}

export function ShrinkDownAnimation({
  show,
  duration = 0.22,
  distance = 14,
  scaleTo = 0.72,
  className,
  children,
  ...rest
}: ShrinkDownAnimationProps) {
  const elRef = React.useRef<HTMLDivElement | null>(null);
  const showRef = React.useRef(show);
  if (showRef.current !== show) {
    showRef.current = show;
  }

  const [isPresent, setIsPresent] = React.useState(show);

  React.useEffect(() => {
    if (show) {
      setIsPresent(true);
    }
  }, [show]);

  useGSAP(
    () => {
      const el = elRef.current;
      if (!el) {
        return;
      }

      gsap.killTweensOf(el);

      if (show) {
        gsap.fromTo(
          el,
          {
            opacity: 0,
            y: -8,
            scale: 0.92,
            transformOrigin: '50% 0%',
          },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration,
            ease: 'power2.out',
            overwrite: 'auto',
          },
        );
        return;
      }

      gsap.to(el, {
        opacity: 0,
        y: distance,
        scale: scaleTo,
        duration,
        ease: 'power2.in',
        overwrite: 'auto',
        transformOrigin: '50% 0%',
        onComplete: () => {
          if (showRef.current) {
            return;
          }
          setIsPresent(false);
        },
      });
    },
    {
      scope: elRef,
      dependencies: [show, duration, distance, scaleTo, isPresent],
      revertOnUpdate: true,
    },
  );

  if (!isPresent) {
    return null;
  }

  return (
    <ZView
      ref={elRef}
      className={cn(!show ? 'pointer-events-none' : undefined, className)}
      {...rest}
    >
      {children}
    </ZView>
  );
}
