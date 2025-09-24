import { tv } from 'tailwind-variants';

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

interface TextareaProps {
  variant?: TextareaVariant;
  appearance?: TextareaAppearance;
  size?: TextareaSize;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
}

const textarea = tv({
  base: 'textarea !outline-none',
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
  },
  defaultVariants: {
    appearance: 'default',
    size: 'md',
  },
});

export function Textarea(props: TextareaProps) {
  return (
    <textarea
      className={textarea({
        variant: props.variant,
        appearance: props.appearance,
        size: props.size,
      })}
      rows={3}
      placeholder={props.placeholder}
      value={props.value}
      onChange={(e) => props.onChange?.(e.target.value)}
    />
  );
}
