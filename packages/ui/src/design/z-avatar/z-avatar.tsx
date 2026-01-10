import type React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@zcat/ui/shadcn';
import { cva } from 'class-variance-authority';

interface ZAvatarProps {
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
  return (
    <Avatar className={avatar({ size: props.size })}>
      <AvatarImage src={props.src} alt={props.alt} />
      <AvatarFallback>{props.fallback}</AvatarFallback>
    </Avatar>
  );
}
