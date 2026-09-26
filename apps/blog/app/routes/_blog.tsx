import { ZView } from '@zcat/ui';
import {
  Link,
  Outlet,
  createFileRoute,
  useRouterState,
} from '@tanstack/react-router';

import { LayoutFooter, LayoutNav } from '@blog/features/layouts/components';
import { MENU_OPTIONS } from '@blog/features/layouts/stores';

export const Route = createFileRoute('/_blog')({
  component: BlogLayoutRoute,
});

function BlogLayoutRoute() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  return (
    <ZView className="h-full w-full">
      <LayoutNav
        options={MENU_OPTIONS}
        pathname={pathname}
        renderLink={({ to, className, children }) => (
          <Link to={to as never} className={className}>
            {children}
          </Link>
        )}
      />
      <ZView className="min-h-content-height py-4 relative bg-background">
        <Outlet />
      </ZView>
      <LayoutFooter />
    </ZView>
  );
}
