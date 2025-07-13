import { tv } from 'tailwind-variants';
import { classnames } from '../utils';

type SelectVariant =
  | 'neutral'
  | 'primary'
  | 'secondary'
  | 'accent'
  | 'info'
  | 'success'
  | 'warning'
  | 'error';

type SelectSize = 'sm' | 'md' | 'lg' | 'xl' | 'xs';

type SelectAppearance = 'default' | 'ghost';

export interface SelectOption {
  label: string;
  value: string;
}

export interface SelectProps {
  variant?: SelectVariant;
  size?: SelectSize;
  appearance?: SelectAppearance;
  disabled?: boolean;
  className?: string;
  options: SelectOption[];
}

const selectClassVariant = tv({
  base: 'select select-bordered',
  variants: {
    variant: {
      neutral: 'select-neutral',
      primary: 'select-primary',
      secondary: 'select-secondary',
      accent: 'select-accent',
      info: 'select-info',
      success: 'select-success',
      warning: 'select-warning',
      error: 'select-error',
    },
    size: {
      sm: 'select-sm',
      md: 'select-md',
      lg: 'select-lg',
      xl: 'select-xl',
      xs: 'select-xs',
    },
    appearance: {
      default: '',
      ghost: 'select-ghost',
    },
  },
  defaultVariants: {
    variant: 'neutral',
    size: 'md',
    appearance: 'default',
  },
});

export function Select(props: SelectProps) {
  const selectClassNames = classnames(
    selectClassVariant({
      variant: props.variant,
      size: props.size,
      appearance: props.appearance,
    }),
    props.className,
  );
  return (
    <select className={selectClassNames} disabled={props.disabled}>
      {props.options.map((option, index) => (
        <option key={index} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
