/*
 * Called from every place a session changes: logout, the `_cms`
 * invalid-session redirect, the post-login navigation, and the
 * `QueryCache` / `MutationCache` `onError` hooks installed by
 * `makeQueryClient`.
 *
 * Both caches are cleared wholesale rather than per key, because neither
 * the shell nor the hooks know every private key. The client instance
 * itself survives so the surrounding `QueryClientProvider` stays mounted.
 */

import type { QueryClient } from '@tanstack/react-query';

export function clearPrivateQueryCache(queryClient: QueryClient): void {
  queryClient.getQueryCache().clear();
  queryClient.getMutationCache().clear();
}
