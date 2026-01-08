import { tv } from 'tailwind-variants';

import { classnames } from '../utils';

import type { InputHTMLAttributes } from 'react';

type InputVariant =
  | 'primary'
  | 'secondary'
  | 'accent'
  | 'neutral'
  | 'info'
  | 'success'
  | 'warning'
  | 'error';

type InputAppearance = 'default' | 'ghost';

type InputSize = 'sm' | 'md' | 'lg' | 'xl' | 'xs';

type InputWeight = 'bold' | 'normal';

export type InputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'size' | 'type'
> & {
  variant?: InputVariant;
  appearance?: InputAppearance;
  size?: InputSize;
  className?: string;
  weight?: InputWeight;
};

const inputClassVariant = tv({
  base: 'w-full input !outline-none',
  variants: {
    variant: {
      primary: 'input-primary',
      secondary: 'input-secondary',
      accent: 'input-accent',
      neutral: 'input-neutral',
      info: 'input-info',
      success: 'input-success',
      warning: 'input-warning',
      error: 'input-error',
    },
    appearance: {
      default: '',
      ghost: 'input-ghost',
    },
    size: {
      sm: 'input-sm',
      md: 'input-md',
      lg: 'input-lg',
      xl: 'input-xl',
      xs: 'input-xs',
    },

    weight: {
      bold: 'font-bold',
      normal: 'font-normal',
    },
  },
  defaultVariants: {
    variant: 'primary',
    appearance: 'default',
    size: 'md',
    weight: 'normal',
  },
});

export function Input(props: InputProps) {
  const { size, variant, appearance, weight, className, ...rest } = props;

  const cls = classnames(
    inputClassVariant({
      variant,
      size,
      appearance,
      weight,
    }),
    className,
  );
  return <input className={cls} type="text" {...rest} />;
}
