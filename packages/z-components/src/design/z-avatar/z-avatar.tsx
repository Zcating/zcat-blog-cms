import type React from 'react';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@zcat-cms/z-components/ui/avatar';
import { tv } from 'tailwind-variants';

interface ZAvatarProps {
  size?: 'sm' | 'md' | 'lg';
  src?: string;
  alt: string;
  fallback?: React.ReactNode;
}

const avatar = tv({
  base: 'w-32 h-32',
  variants: {
    size: {
      sm: 'w-24 h-24',
      md: 'w-32 h-32',
      lg: 'w-40 h-40',
    },
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
