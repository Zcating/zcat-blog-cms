import type { ButtonHTMLAttributes } from 'react';
import type React from 'react';
import { classnames } from '../utils';
import { Loading3QuartersOutlined } from '@ant-design/icons';
import { tv } from 'tailwind-variants';

type ButtonVariant =
  | 'neutral'
  | 'primary'
  | 'secondary'
  | 'accent'
  | 'info'
  | 'success'
  | 'warning'
  | 'error';
type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
type ButtonAppearance = 'outline' | 'dash' | 'soft' | 'ghost' | 'link';
type ButtonShape = 'square' | 'circle' | 'wide' | 'block';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  appearance?: ButtonAppearance;
  shape?: ButtonShape;
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
}

const buttonClassVariant = tv({
  base: 'btn',
  variants: {
    variant: {
      neutral: 'btn-neutral',
      primary: 'btn-primary',
      secondary: 'btn-secondary',
      accent: 'btn-accent',
      info: 'btn-info',
      success: 'btn-success',
      warning: 'btn-warning',
      error: 'btn-error',
    },
    size: {
      xs: 'btn-xs',
      sm: 'btn-sm',
      md: 'btn-md',
      lg: 'btn-lg',
      xl: 'btn-xl',
    },
    appearance: {
      outline: 'btn-outline',
      dash: 'btn-dash',
      soft: 'btn-soft',
      ghost: 'btn-ghost',
      link: 'btn-link',
    },
    shape: {
      square: 'btn-square',
      circle: 'btn-circle',
      wide: 'btn-wide',
      block: 'btn-block',
    },
    disabled: {
      true: 'btn-disabled',
    },
    loading: {
      true: 'cursor-not-allowed opacity-70',
    },
  },
  defaultVariants: {
    variant: 'neutral',
  },
});

export function Button(props: ButtonProps) {
  const {
    variant,
    size,
    shape,
    appearance,
    disabled,
    loading,
    className,
    onClick,
    children,
    ...restProps
  } = props;
  const cls = classnames(
    'block btn flex',
    buttonClassVariant({
      variant,
      size,
      shape,
      appearance,
      disabled,
      loading,
    }),
    className,
  );

  const click = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (loading) {
      e.preventDefault();
      return;
    }
    onClick?.(e);
  };

  return (
    <button className={cls} onClick={click} type="button" {...restProps}>
      {loading ? <Loading3QuartersOutlined spin className="mr-2" /> : null}
      {children}
    </button>
  );
}
