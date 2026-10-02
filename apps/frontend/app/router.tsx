/*
 * We do NOT add a parallel `QueryClientProvider` /
 * `HydrationBoundary` in `__root.tsx` — that would conflict with
 * the integration-supplied `Wrap`. Per the integration docs:
 * "Do not add a second QueryClient or independently dehydrate the
 * same cache."
 */

import { createRouter } from '@tanstack/react-router';
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query';

import { makeQueryClient } from '@cms/shared/query';

import { routeTree } from './routeTree.gen';

export function getRouter() {
  // A fresh client per call: the SSR runtime calls `getRouter()` once per
  // request and the browser once per page load, so a module-scope client
  // would leak state across requests. The 401 callback closes over
  // `router`, which does not exist yet, so it resolves lazily.
  const queryClient = makeQueryClient(() => router.navigate({ to: '/login' }));

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    // Per the official TanStack Start + Query guide: let Query decide
    // whether a preload needs data, and use a small `staleTime` so the
    // browser does not immediately re-read a query after SSR hydration.
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 0,
  });

  // Official integration — call exactly once per router. We
  // disable `handleRedirects` because `_cms.beforeLoad`
  // already throws redirects via `redirect(...)` and the router's
  // own redirect handling converts them into a navigation. The
  // Query cache's `onError` hook is unnecessary for a route guard
  // and has caused intermittent false redirects in the e2e suite.
  setupRouterSsrQueryIntegration({
    router,
    queryClient,
    handleRedirects: false,
  });

  return router;
}

export type Router = ReturnType<typeof getRouter>;
