/*
 * The `_cms` layout already seeds the FULL `UserInfo` payload into the
 * per-request Query cache under the canonical
 * `userInfoQueryOptions().queryKey` (`['users', 'current']`).
 *
 * This loader only ensures the query is hot when the user
 * lands on `/user-info` directly (e.g. via a hard refresh or
 * a deep link). If the layout already populated the cache,
 * `query({ ...options, staleTime: 'static' })` returns the
 * cached value immediately.
 */

import { createFileRoute } from '@tanstack/react-router';

import UserInfo from '@cms/features/user-info/routes/user-info';
import { userInfoQueryOptions } from '@cms/server/users';

export const Route = createFileRoute('/_cms/user-info')({
  loader: ({ context }) =>
    context.queryClient.query({
      ...userInfoQueryOptions(),
      staleTime: 'static',
    }),
  component: UserInfo,
});
