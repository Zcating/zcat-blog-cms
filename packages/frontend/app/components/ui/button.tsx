import type { ButtonHTMLAttributes } from 'react';
import type React from 'react';
import { cn } from '../utils';

type ButtonVariant = 'neutral' | 'primary' | 'secondary' | 'accent' | 'info' | 'success' | 'warning' | 'error';
type ButtonSize = 'xs' |'sm' | 'md' | 'lg' | 'xl';
type ButtonAppearance = 'outline' | 'dash' | 'soft' | 'ghost' | 'link';
type ButtonShape = 'square' | 'circle' | 'wide' | 'block';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {  
  variant?: ButtonVariant;
  size?: ButtonSize;
  appearance?: ButtonAppearance;
  shape?: ButtonShape;
  disabled?: boolean;
  children: React.ReactNode;
}

export function Button(props: ButtonProps) {
  const className = cn(
    'block btn', 
    variantClassFrom(props.variant),
    sizeClassFrom(props.size),
    appearanceClassFrom(props.appearance),
    shapeClassFrom(props.shape),
    props.disabled ? 'btn-disabled' : 'btn-active',
    props.className
  );
  return <button className={className} {...props} />;
}

function variantClassFrom(variant?: ButtonVariant) {
  switch (variant) {
    case 'neutral':
      return 'btn-neutral';
    case 'primary':
      return 'btn-primary';
    case 'secondary':
      return 'btn-secondary';
    case 'accent':
      return 'btn-accent';
    case 'info':
      return 'btn-info';
    case 'success':
      return 'btn-success';
    case 'warning':
      return 'btn-warning';
    case 'error':
      return 'btn-error';
    default:
      return '';
  }
}

function sizeClassFrom(size?: ButtonSize) {
  switch (size) {
    case 'sm':
      return 'btn-sm';
    case 'md':
      return 'btn-md';
    case 'lg':
      return 'btn-lg';
    default:
      return 'btn-md';
  }
}

function appearanceClassFrom(appearance?: ButtonAppearance) {
  switch (appearance) {
    case 'outline':
      return 'btn-outline';
    case 'dash':
      return 'btn-dash';
    case 'soft':
      return 'btn-soft';
    case 'ghost':
      return 'btn-ghost';
    case 'link':
      return 'btn-link';
    default:
      return '';
  }
}

function shapeClassFrom(shape?: ButtonShape) {
  switch (shape) {
    case 'square':
      return 'btn-square';
    case 'circle':
      return 'btn-circle';
    case 'wide':
      return 'btn-wide';
    case 'block':
      return 'btn-block';
    default:
      return '';
  }
}