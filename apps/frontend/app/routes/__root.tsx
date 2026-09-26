/*
 * We do NOT add a second `QueryClientProvider` / `HydrationBoundary`
 * here — doing so would create a nested provider conflict and a manual
 * hydrate that double-writes the cache.
 *
 * The `createRootRouteWithContext<{ queryClient: QueryClient }>()`
 * declaration is what makes the per-request `QueryClient` visible
 * to child routes via `context.queryClient`.
 */

import '../app.css';

import type { QueryClient } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRouteWithContext,
} from '@tanstack/react-router';

import { NotFoundPage } from '@cms/features/not-found/routes/not-found';
import { RouteErrorPage } from '@cms/features/not-found/routes/route-error';

export interface RootRouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RootRouterContext>()({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'ZCAT-BLOG-CMS' },
      { name: 'description', content: 'ZCAT-BLOG-CMS' },
    ],
  }),
  component: RootComponent,
  notFoundComponent: NotFoundPage,
  errorComponent: RouteErrorPage,
});

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  );
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="zh-CN">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}
