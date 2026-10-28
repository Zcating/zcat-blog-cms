import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  ZView,
} from '@zcat/ui';
import { Link, Outlet, useRouterState } from '@tanstack/react-router';

import { LayoutFooter, LayoutHeader } from '@blog/features/layouts/components';
import { MENU_OPTIONS } from '@blog/features/layouts/stores';
import { TOOL_REGISTRY } from '@blog/features/toolbox/lib';

export function ToolboxLayoutRoute() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  const tool = TOOL_REGISTRY.find((entry) => entry.path === pathname);

  return (
    <ZView className="flex h-screen flex-col">
      <LayoutHeader options={MENU_OPTIONS} />
      {tool && (
        <ZView className="px-4 pt-4">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to={'/toolbox' as never}>工具箱</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{tool.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </ZView>
      )}
      <ZView className="min-h-0 flex-1 overflow-y-auto">
        <Outlet />
      </ZView>
      <LayoutFooter />
    </ZView>
  );
}
