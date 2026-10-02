import {
  ZNavigationMenu,
  ZStickyHeader,
  Separator,
  ZView,
  type LinkOption,
} from '@zcat/ui';
import { Link, useRouterState } from '@tanstack/react-router';
import React from 'react';

export interface LayoutNavRenderLinkProps {
  to: string;
  className: string;
  children: React.ReactNode;
}

export interface LayoutNavProps {
  className?: string;
  options: LinkOption[];
  prefix?: React.ReactNode;
  pathname: string;
  renderLink: (props: LayoutNavRenderLinkProps) => React.ReactNode;
}

export function LayoutNav({
  className,
  options,
  prefix,
  pathname,
  renderLink,
}: LayoutNavProps) {
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
          renderItem={(option) =>
            renderLink({
              to: option.to,
              className: checkIsActive(option.to)
                ? 'text-primary font-medium transition-colors'
                : 'text-muted-foreground hover:text-primary transition-colors',
              children: option.title,
            })
          }
        />
      </ZView>
    </ZStickyHeader>
  );
}

interface LayoutHeaderProps {
  className?: string;
  options: LinkOption[];
  prefix?: React.ReactNode;
}

export function LayoutHeader(props: LayoutHeaderProps) {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  return (
    <LayoutNav
      {...props}
      pathname={pathname}
      renderLink={({ to, className, children }) => (
        <Link to={to as never} className={className}>
          {children}
        </Link>
      )}
    />
  );
}
