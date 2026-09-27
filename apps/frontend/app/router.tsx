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
  // Build a fresh client per call. The SSR runtime calls
  // `getRouter()` once per request; the browser calls it once per
  // page load. A module-scope client would leak state across
  // requests.
  //
  // A 401 from any server function wipes the private cache and sends
  // the user to the login page, exactly like the `_cms` guard does
  // for an invalid session. The callback closes over `router`, which
  // only exists once `createRouter` returns, so it is resolved lazily
  // at the moment a 401 arrives — never at construction time.
  const queryClient = makeQueryClient(() => router.navigate({ to: '/login' }));

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    // Per the official TanStack Start + Query guide: let Query
    // decide whether a preload needs data, and use a small
    // `staleTime` so the browser does not immediately re-read a
    // query right after SSR hydration.
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
