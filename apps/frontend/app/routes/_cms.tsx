/**
 * Pathless layout route for all protected CMS pages.
 *
 * The `_cms` prefix is a TanStack Router convention that exposes a
 * shared layout without consuming a URL segment. Every file in
 * `app/routes/_cms/` renders inside this shell automatically.
 *
 * The `beforeLoad` is a UX guard only:
 *   - It calls the public typed `isValid` server function to learn
 *     whether the current cookie represents a live session.
 *   - On invalid (or any error), it empties the private Query cache and
 *     then throws a redirect to `/login`, so the user lands on the
 *     login screen before any private UI is rendered and the next
 *     session starts from an empty cache.
 *   - On valid, it loads the current user via the protected
 *     `getCurrentUser` server function, seeds the FULL `UserInfo`
 *     into the per-request Query cache under the canonical
 *     `userInfoQueryOptions().queryKey`, and hands the layout a
 *     minimal `{ name, avatar }` subset for the sidebar avatar.
 *
 * IMPORTANT: this guard is NOT the security boundary. Protected
 * server functions enforce their own auth via
 * `createProtectedFunctionMiddleware`. The route guard shapes the
 * navigation experience; it cannot keep private data private.
 *
 * Server-function boundary:
 *   - The server functions are imported from `@cms/server/users`.
 *     TanStack Start's tree-shaker replaces them with RPC stubs in
 *     the client bundle, so the client never sees the user-domain
 *     transport code. The pure decision helper in
 *     `@cms/shared/auth/cms-access` keeps the testable seam.
 *
 * Query-cache contract:
 *   - `_cms` MUST write the complete `UserInfo` into the Query
 *     cache under `['users','current']`. Shell components see the
 *     shell subset via prop drilling; components that need the
 *     full payload (Phase 3b user-info page, dashboard header)
 *     read it from the same query key. A partial seed silently
 *     breaks every consumer of `userInfoQueryOptions()`.
 */

import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';

import { CMSLayoutShell } from '@cms/layouts/cms-layout';
import { decideCmsAccess } from '@cms/shared/auth/cms-access';
import { buildCmsCacheSeed } from '@cms/shared/auth/cms-seed';
import type { CmsShellUser } from '@cms/shared/auth/cms-seed';
import { clearPrivateQueryCache } from '@cms/shared/query';
import { getCurrentUser, isValid } from '@cms/server/users';

/**
 * Pathless layout route — exposes the CMS shell to every file under
 * `app/routes/_cms/` while keeping the URL bar clean.
 */
export const Route = createFileRoute('/_cms')({
  beforeLoad: async ({ context, location }) => {
    const decision = await decideCmsAccess({
      isValid,
      getCurrentUser,
    });

    if (decision.kind === 'redirect') {
      // A session change starts from an EMPTY private cache. The
      // previous session's entries were written under `staleTime:
      // 'static'`, so without this wipe the next account to sign in on
      // this tab keeps reading them. Same helper the logout handler
      // and the cache `onError` hooks use.
      clearPrivateQueryCache(context.queryClient);
      throw redirect({
        to: decision.to,
        search: { redirect: location.href },
      });
    }

    // Seed the FULL UserInfo into the per-request Query cache so
    // downstream `useQuery(userInfoQueryOptions())` reads see
    // every field. The shell display subset is a separate prop.
    // `decision.user` here carries the full payload because
    // `decideCmsAccess` calls `getCurrentUser` and keeps the full
    // `UserInfo` (see `@cms/shared/auth/cms-access`).
    if (decision.userFull) {
      buildCmsCacheSeed({
        queryClient: context.queryClient,
        fullUser: decision.userFull,
      });
    }

    return {
      cmsUser: decision.user as CmsShellUser | undefined,
    };
  },

  component: CmsShellRoute,
});

function CmsShellRoute() {
  // The layout shell reads its user via the prop API so the layout
  // file stays decoupled from the router context shape.
  const { cmsUser } = Route.useRouteContext();

  return (
    <CMSLayoutShell cmsUser={cmsUser}>
      <Outlet />
    </CMSLayoutShell>
  );
}
