import { cva } from 'class-variance-authority';
export const iconVariants = cva('size-6', {
  variants: {
    size: {
      xs: 'size-2',
      sm: 'size-4',
      md: 'size-6',
      lg: 'size-8',
      xl: 'size-10',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

export interface IconVariantsProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  color?: string;
}
