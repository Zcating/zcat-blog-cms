/**
 * Cache-management helpers used by the CMS shell.
 *
 * The shell calls `clearPrivateQueryCache` on:
 *   - successful logout (after the cookie has been cleared server-side)
 *   - any 401 / invalid-session path that forces a redirect to /login
 *
 * Clearing BOTH the query and mutation caches ensures no stale
 * private data lingers after the user is logged out. We intentionally
 * do NOT call `queryClient.removeQueries({ exact: true })` per key —
 * the shell does not (and should not) know every private key.
 */

import type { QueryClient } from '@tanstack/react-query';

/**
 * Empty the entire query and mutation caches of the supplied client.
 *
 * Safe to call on any state of the cache (empty, full, mid-flight).
 * The client instance itself is preserved — only the cached data
 * is dropped so the surrounding `QueryClientProvider` stays mounted.
 */
export function clearPrivateQueryCache(queryClient: QueryClient): void {
  queryClient.getQueryCache().clear();
  queryClient.getMutationCache().clear();
}
