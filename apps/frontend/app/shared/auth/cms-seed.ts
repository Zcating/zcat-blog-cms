/**
 * `_cms` cache-seed helper.
 *
 * The protected CMS layout's `beforeLoad` calls the typed
 * `getCurrentUser` server function to fetch the full `UserInfo`
 * for the current session. After that fetch it must:
 *
 *   1. Seed the full `UserInfo` under `userInfoQueryOptions().queryKey`
 *      so every component downstream (including future ones in
 *      Phase 3b) can read the typed payload via
 *      `useQuery(userInfoQueryOptions())`.
 *   2. Expose only a shell display subset (`{ name, avatar }`) to
 *      `CMSLayoutShell` so the route context stays small.
 *
 * This module owns step 1. Step 2 stays in `_cms.tsx` because it is
 * about the route context shape, not the Query cache.
 *
 * The function is pure — it does not touch the router or React. The
 * route passes a `QueryClient` from its `beforeLoad` context.
 */

import type { QueryClient } from '@tanstack/react-query';

/**
 * Full `UserInfo` shape returned by the protected server function.
 * The route calls `getCurrentUser()` (the server function) which
 * returns this entire object — we never read a subset.
 */
export interface FullUserInfo {
  name: string;
  avatar: string;
  occupation: string;
  contact: { email: string; github: string };
  aboutMe: string;
  abstract: string;
}

/**
 * Shell display subset. Only what the sidebar / avatar actually
 * needs. Kept as a separate type so a future shell refactor cannot
 * accidentally leak the full payload into the route context.
 */
export interface CmsShellUser {
  name: string;
  avatar: string;
}

/**
 * Canonical query key that matches `userInfoQueryOptions().queryKey`
 * in `@cms/server/users`. Duplicated here so the route can seed the
 * cache before the server-functions barrel is evaluated by the
 * router's lazy chunk on the client.
 */
export const USER_INFO_QUERY_KEY = ['users', 'current'] as const;

interface SeedOptions {
  queryClient: QueryClient;
  fullUser: FullUserInfo;
  shellUser?: CmsShellUser;
}

/**
 * Write the full `UserInfo` payload into the Query cache under the
 * canonical `userInfoQueryOptions().queryKey`. The `shellUser`
 * parameter is accepted for symmetry but is NOT used to write to
 * the cache — it documents that the route may pass a separate
 * shell subset elsewhere without touching this seed.
 */
export function buildCmsCacheSeed(options: SeedOptions): void {
  options.queryClient.setQueryData([...USER_INFO_QUERY_KEY], options.fullUser);
}
