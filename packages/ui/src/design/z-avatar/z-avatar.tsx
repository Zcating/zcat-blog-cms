import * as AvatarPrimitive from '@radix-ui/react-avatar';
import { cva } from 'class-variance-authority';

import { Avatar, AvatarFallback, AvatarImage } from '@zcat/ui/shadcn';

import type React from 'react';

interface ZAvatarProps extends React.ComponentProps<
  typeof AvatarPrimitive.Root
> {
  size?: 'sm' | 'md' | 'lg';
  src?: string;
  alt: string;
  fallback?: React.ReactNode;
}

const avatar = cva('w-32 h-32', {
  variants: {
    size: {
      sm: 'w-24 h-24',
      md: 'w-32 h-32',
      lg: 'w-40 h-40',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

export function ZAvatar(props: ZAvatarProps) {
  const { size, src, alt, fallback, ...restProps } = props;
  return (
    <Avatar className={avatar({ size })} {...restProps}>
      <AvatarImage src={src} alt={alt} />
      <AvatarFallback>{fallback}</AvatarFallback>
    </Avatar>
  );
}
