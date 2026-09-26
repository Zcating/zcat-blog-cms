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

import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';

import { isUnauthorizedError } from '@cms/shared/auth/unauthorized';

import { clearPrivateQueryCache } from './cache-helpers';

/**
 * Create a fresh QueryClient suitable for a single SSR request or
 * a single browser load.
 *
 * Always returns a new instance — never reuse the result across
 * requests. Automatic retries are disabled per ADR-0003.
 *
 * The `QueryCache` and `MutationCache` `onError` hooks are the single
 * 401 path: a private server function that rejects as unauthorized drops
 * the whole cache, so no entry added before the session died can survive
 * it.
 */
export function makeQueryClient(): QueryClient {
  const clearCacheOnUnauthorized = (error: unknown) => {
    if (isUnauthorizedError(error)) {
      clearPrivateQueryCache(client);
    }
  };

  const client = new QueryClient({
    queryCache: new QueryCache({ onError: clearCacheOnUnauthorized }),
    mutationCache: new MutationCache({ onError: clearCacheOnUnauthorized }),
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

  return client;
}
