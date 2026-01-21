import React from 'react';

interface ZStickyHeaderProps {
  children: React.ReactNode;
}
export function ZStickyHeader(props: ZStickyHeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full h-header-height bg-background border-b flex">
      {props.children}
    </header>
  );
}
