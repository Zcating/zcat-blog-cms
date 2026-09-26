import { createRouter } from '@tanstack/react-router';

import { routeTree } from './routeTree.gen';

export function getRouter() {
  // A fresh router per call: the SSR runtime calls `getRouter()` once per
  // request, the browser once per page load. Blog has no per-request server
  // state, so there is no context to thread through yet.
  const router = createRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 0,
  });

  return router;
}

export type Router = ReturnType<typeof getRouter>;
