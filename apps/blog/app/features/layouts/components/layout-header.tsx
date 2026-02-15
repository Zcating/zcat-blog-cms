import {
  ZNavigationMenu,
  ZStickyHeader,
  Separator,
  ZView,
  type LinkOption,
} from '@zcat/ui';
import React from 'react';
import { Link, useLocation } from 'react-router';

interface LayoutHeaderProps {
  className?: string;
  options: LinkOption[];
  prefix?: React.ReactNode;
}

export function LayoutHeader({
  className,
  options,
  prefix,
}: LayoutHeaderProps) {
  const { pathname } = useLocation();

  const checkIsActive = (to: string) => {
    if (to === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(to);
  };

  return (
    <ZStickyHeader className={className}>
      <ZView className="flex h-full w-full items-center gap-2 px-4">
        {prefix}
        {prefix && <Separator orientation="vertical" className="mr-2 h-4" />}
        <ZNavigationMenu
          options={options}
          renderItem={(option, index) => {
            const isActive = checkIsActive(option.to);
            return (
              <Link
                key={index.toString()}
                to={option.to}
                className={
                  isActive
                    ? 'text-primary font-medium transition-colors'
                    : 'text-muted-foreground hover:text-primary transition-colors'
                }
              >
                {option.title}
              </Link>
            );
          }}
        />
      </ZView>
    </ZStickyHeader>
  );
}
