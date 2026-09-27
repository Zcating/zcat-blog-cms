/*
 * This `beforeLoad` is a UX guard, NOT the security boundary: it shapes
 * the navigation experience, while `createProtectedFunctionMiddleware`
 * is what actually keeps private data private.
 *
 * Query-cache contract: `_cms` MUST write the complete `UserInfo` under
 * `['users','current']`. A partial seed silently breaks every consumer of
 * `userInfoQueryOptions()`.
 */

import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';

import { CMSLayoutShell } from '@cms/layouts/cms-layout';
import { decideCmsAccess } from '@cms/shared/auth/cms-access';
import { buildCmsCacheSeed } from '@cms/shared/auth/cms-seed';
import type { CmsShellUser } from '@cms/shared/auth/cms-seed';
import { clearPrivateQueryCache } from '@cms/shared/query';
import { getCurrentUser, isValid } from '@cms/server/users';

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
      // this tab keeps reading them.
      clearPrivateQueryCache(context.queryClient);
      throw redirect({
        to: decision.to,
        search: { redirect: location.href },
      });
    }

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
