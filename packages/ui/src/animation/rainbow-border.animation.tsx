import { useGSAP } from '@gsap/react';
import { cva } from 'class-variance-authority';
import { gsap } from 'gsap';
import * as React from 'react';

import { useWatch } from '../hooks';
import { cn } from '../shadcn/lib/utils';

type BorderSize = 'sm' | 'md' | 'lg';

interface RainbowBorderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  duration?: number;
  size?: BorderSize;
}

const RAINBOW_COLORS = [
  '#FF0000',
  '#FF7F00',
  '#FFFF00',
  '#00FF00',
  '#0000FF',
  '#4B0082',
  '#9400D3',
];

const paddingMap = {
  sm: '1px',
  md: '2px',
  lg: '4px',
} as const;

export function RainbowBorder({
  children,
  className,
  duration = 5,
  size = 'md',
}: RainbowBorderProps) {
  const borderRef = React.useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const border = borderRef.current;
    if (!border) return;

    const gradientColors = RAINBOW_COLORS.map(
      (color, index) =>
        `${color} ${(index + 1) * Math.round(100 / RAINBOW_COLORS.length)}%`,
    ).join(', ');

    border.style.backgroundImage = `linear-gradient(0, ${gradientColors})`;

    const anim = gsap.to(border, {
      duration: duration,
      repeat: -1,
      ease: 'circ.inOut',
      onUpdate: function () {
        const rotation = anim.progress() * 360;
        border.style.backgroundImage = `linear-gradient(${rotation}deg, ${gradientColors})`;
      },
    });

    return () => {
      anim.kill();
    };
  });

  useWatch([size], (newSize) => {
    const border = borderRef.current;
    if (!border) return;
    border.style.padding = paddingMap[newSize];
  });

  return (
    <div ref={borderRef} className={cn('relative', className)}>
      <div>{children}</div>
    </div>
  );
}
