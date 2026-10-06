import type { QueryClient } from '@tanstack/react-query';

export interface FullUserInfo {
  name: string;
  avatar: string;
  signedAvatar: string;
  occupation: string;
  contact: { email: string; github: string };
  aboutMe: string;
  abstract: string;
}

/**
 * A separate type from `FullUserInfo` so a future shell refactor cannot
 * accidentally leak the full payload into the route context.
 */
export interface CmsShellUser {
  name: string;
  signedAvatar: string;
}

/**
 * Canonical query key, duplicated from `userInfoQueryOptions().queryKey`
 * so the route can seed the cache before the router's lazy chunk
 * evaluates the server-functions barrel on the client.
 */
export const USER_INFO_QUERY_KEY = ['users', 'current'] as const;

interface SeedOptions {
  queryClient: QueryClient;
  fullUser: FullUserInfo;
  shellUser?: CmsShellUser;
}

export function buildCmsCacheSeed(options: SeedOptions): void {
  options.queryClient.setQueryData([...USER_INFO_QUERY_KEY], options.fullUser);
}
