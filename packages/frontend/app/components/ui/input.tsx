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

interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'type'> {
  variant?: InputVariant;
  appearance?: InputAppearance;
  size?: InputSize;
  className?: string;
}

const inputClassVariant = tv({
  base: 'input',
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
  },
  defaultVariants: {
    variant: 'primary',
    appearance: 'default',
    size: 'md',
  },
});

export function Input(props: InputProps) {
  const { size, variant, appearance, className, ...rest } = props;

  const classname = classnames(
    inputClassVariant({
      variant,
      size,
      appearance,
    }),
    props.className,
  );
  return <input className={classname} type="text" {...rest} />;
}
