/*
 * Seeding the full `UserInfo` under `userInfoQueryOptions().queryKey`
 * is this module's job; exposing the shell display subset
 * (`{ name, avatar }`) to `CMSLayoutShell` stays in `_cms.tsx` because
 * it is about the route context shape, not the Query cache.
 *
 * The function is pure — it does not touch the router or React. The
 * route passes a `QueryClient` from its `beforeLoad` context.
 */

import type { QueryClient } from '@tanstack/react-query';

/**
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
 * Kept as a separate type so a future shell refactor cannot
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
 * The `shellUser` parameter is accepted for symmetry but is NOT used to
 * write to the cache — it documents that the route may pass a separate
 * shell subset elsewhere without touching this seed.
 */
export function buildCmsCacheSeed(options: SeedOptions): void {
  options.queryClient.setQueryData([...USER_INFO_QUERY_KEY], options.fullUser);
}
