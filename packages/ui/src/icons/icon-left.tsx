import { type LucideProps } from 'lucide-react';
import { forwardRef } from 'react';

export const IconLeft = forwardRef<SVGSVGElement, LucideProps>(
  (
    {
      color = 'currentColor',
      size = 24,
      strokeWidth = 1.5,
      className,
      ...props
    },
    ref,
  ) => {
    return (
      <svg
        ref={ref}
        suppressHydrationWarning
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        {...props}
      >
        <path d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
      </svg>
    );
  },
);

IconLeft.displayName = 'IconLeft';
