/*
 * The factory exists for two reasons:
 *   1. So `getRouter()` builds a client that lives only as long
 *      as the request / page (no cross-request leakage).
 *   2. So tests can build a fresh client with deterministic
 *      options.
 *
 * The `retry: false` defaults are per ADR-0003: no automatic retries.
 */

import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';

import { isUnauthorizedError } from '@cms/shared/auth/unauthorized';

import { clearPrivateQueryCache } from './cache-helpers';

/**
 * The `QueryCache` and `MutationCache` `onError` hooks are the reactive
 * half of the auth-failure wipe: a private server function that rejects
 * as unauthorized drops the whole cache, so no entry added before the
 * session died can survive it, and then hands the user to `navigateToLogin`
 * because a never-expiring JWT means a 401 is a dead session, not a
 * transient one. The proactive half lives at the two places a session
 * changes without a failing query — the `_cms` invalid-session redirect
 * and the post-login navigation, which both call
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
