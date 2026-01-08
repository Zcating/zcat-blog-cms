import { tv } from 'tailwind-variants';

import { classnames } from '../utils';

export type TextareaVariant =
  | 'neutral'
  | 'primary'
  | 'secondary'
  | 'accent'
  | 'info'
  | 'warning'
  | 'error'
  | 'success';
export type TextareaAppearance = 'default' | 'ghost';
export type TextareaSize = 'sm' | 'md' | 'lg' | 'xl' | 'xs';

export interface TextareaProps {
  className?: string;
  variant?: TextareaVariant;
  appearance?: TextareaAppearance;
  size?: TextareaSize;
  placeholder?: string;
  disabled?: boolean;
  maxLength?: number;
  weight?: 'normal' | 'bold';
  value?: string;
  onChange?: (value: string) => void;
}

const textarea = tv({
  base: 'w-full textarea !outline-none',
  variants: {
    variant: {
      neutral: 'textarea-neutral',
      primary: 'textarea-primary',
      secondary: 'textarea-secondary',
      accent: 'textarea-accent',
      info: 'textarea-info',
      warning: 'textarea-warning',
      error: 'textarea-error',
      success: 'textarea-success',
    },
    appearance: {
      default: '',
      ghost: 'textarea-ghost',
    },
    size: {
      sm: 'textarea-sm',
      md: 'textarea-md',
      lg: 'textarea-lg',
      xl: 'textarea-xl',
      xs: 'textarea-xs',
    },
    weight: {
      normal: 'font-normal',
      bold: 'font-bold',
    },
  },
  defaultVariants: {
    appearance: 'default',
    size: 'md',
    weight: 'normal',
  },
});

export function Textarea(props: TextareaProps) {
  return (
    <textarea
      className={classnames(
        textarea({
          variant: props.variant,
          appearance: props.appearance,
          size: props.size,
          weight: props.weight,
        }),
        props.className,
      )}
      disabled={props.disabled}
      rows={3}
      placeholder={props.placeholder}
      value={props.value}
      onChange={(e) => props.onChange?.(e.target.value)}
      maxLength={props.maxLength}
    />
  );
}
