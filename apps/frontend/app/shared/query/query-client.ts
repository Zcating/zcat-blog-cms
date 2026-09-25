/**
 * SSR-aware TanStack Query client factory.
 *
 * The Phase 3a remediation moved the per-request lifecycle into
 * `getRouter()` (see `app/router.tsx`): every server request and
 * the browser each call `getRouter()` exactly once and receive a
 * fresh `QueryClient` instance. The official
 * `@tanstack/react-router-ssr-query` integration wires the
 * `QueryClientProvider` wrap and the SSR `dehydrate` / browser
 * `hydrate` lifecycle; no module-scope browser singleton is
 * needed anymore.
 *
 * The factory exists for two reasons:
 *   1. So `getRouter()` builds a client that lives only as long
 *      as the request / page (no cross-request leakage).
 *   2. So tests can build a fresh client with deterministic
 *      options.
 *
 * The `retry: false` defaults remain — per ADR-0003 and the
 * Phase 3a scope contract: no automatic retries.
 */

import { QueryClient } from '@tanstack/react-query';

/**
 * Create a fresh QueryClient suitable for a single SSR request or
 * a single browser load.
 *
 * Always returns a new instance — never reuse the result across
 * requests. Automatic retries are disabled per ADR-0003.
 */
export function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 60 * 1000,
      },
      mutations: {
        retry: false,
      },
    },
  });
}
