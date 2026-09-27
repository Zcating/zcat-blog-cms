/*
 * The factory exists so `getRouter()` builds a client that lives only as
 * long as the request / page (no cross-request leakage), and so tests can
 * build a fresh client with deterministic options. `retry: false` is per
 * ADR-0003: no automatic retries.
 */

import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';

import { isUnauthorizedError } from '@cms/shared/auth/unauthorized';

import { clearPrivateQueryCache } from './cache-helpers';

/**
 * The reactive half of the auth-failure wipe: a never-expiring JWT means a
 * 401 is a dead session, not a transient one, so the whole cache is dropped
 * and the user is handed to `navigateToLogin`. The proactive half lives at
 * the two places a session changes without a failing query — the `_cms`
 * invalid-session redirect and the post-login navigation — which call
 * `clearPrivateQueryCache` directly and navigate themselves.
 */
export function makeQueryClient(navigateToLogin?: () => void): QueryClient {
  const clearCacheOnUnauthorized = (error: unknown) => {
    if (isUnauthorizedError(error)) {
      clearPrivateQueryCache(client);
      navigateToLogin?.();
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
