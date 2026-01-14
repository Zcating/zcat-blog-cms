import { type LucideProps } from 'lucide-react';
import { forwardRef } from 'react';

export const IconClose = forwardRef<SVGSVGElement, LucideProps>(
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
        <path d="M6 18 18 6M6 6l12 12" />
      </svg>
    );
  },
);

IconClose.displayName = 'IconClose';
