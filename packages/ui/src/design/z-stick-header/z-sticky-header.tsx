import React from 'react';

import { cn } from '@zcat/ui/shadcn';

interface ZStickyHeaderProps {
  className?: string;
  children: React.ReactNode;
}
export function ZStickyHeader(props: ZStickyHeaderProps) {
  return (
    <header
      className={cn(
        'sticky top-0 z-50 w-full h-header-height bg-background border-b flex',
        props.className,
      )}
    >
      {props.children}
    </header>
  );
}
