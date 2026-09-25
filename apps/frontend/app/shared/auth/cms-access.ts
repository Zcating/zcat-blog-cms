/**
 * Pure decision helper for the `_cms` pathless layout route.
 *
 * The layout's `beforeLoad` calls `decideCmsAccess` to decide
 * whether the current session is good enough to render the shell.
 * The helper accepts the typed `isValid` and `getCurrentUser`
 * server functions by reference so we can test it without spinning
 * up TanStack Start.
 *
 * IMPORTANT: this guard is UX only. The real security boundary
 * lives on every protected `createServerFn` via the
 * `createProtectedFunctionMiddleware` factory. A route-level guard
 * cannot be relied on to keep private data private — it only
 * shapes the navigation experience.
 *
 * Phase 3a remediation: the helper now retains the COMPLETE
 * `UserInfo` returned by `getCurrentUser` (under `userFull`) and
 * surfaces the shell display subset (`user`) separately. The
 * caller is responsible for writing `userFull` into the Query
 * cache under `userInfoQueryOptions().queryKey`; the shell sees
 * only `user`. A partial cache write would silently break every
 * downstream consumer of the user query.
 */

import type { UserInfo } from '@cms/server/users/users-helpers';

/**
 * Minimal shape of the shell user. We strip the server-side fields
 * (contact / abstract / aboutMe) the shell does not need so the
 * serialized route context stays small.
 *
 * Re-exported from `./cms-seed` so the type lives next to its
 * sibling helpers; consumers should import the type from
 * `@cms/shared/auth/cms-seed` to avoid surprises.
 */
import type { CmsShellUser } from './cms-seed';
export type { CmsShellUser } from './cms-seed';

/**
 * Result of the `_cms` beforeLoad guard.
 *
 *   - `allow`   — proceed to render the shell. `user` carries the
 *                 shell display subset the layout passes to its
 *                 sidebar/avatar. `userFull` carries the complete
 *                 `UserInfo` so the caller can seed the per-request
 *                 Query cache under `userInfoQueryOptions().queryKey`.
 *   - `redirect` — the session is not valid; the route should
 *                 throw a redirect to `to`.
 */
export type CmsAccessDecision =
  | {
      kind: 'allow';
      user: CmsShellUser;
      userFull: UserInfo;
    }
  | { kind: 'redirect'; to: '/login' };

interface DecideOptions {
  isValid: () => Promise<boolean>;
  getCurrentUser: () => Promise<UserInfo>;
}

/**
 * Build the access decision for the protected CMS layout.
 *
 * The flow is:
 *   1. Call the public `isValid` server function. If it returns
 *      `false` or throws, redirect to `/login`.
 *   2. If valid, pull the full `UserInfo` via the protected
 *      `getCurrentUser` server function and surface BOTH:
 *        - `user`     — the shell subset (`name`, `avatar`).
 *        - `userFull` — the complete `UserInfo` for the route to
 *          seed into the Query cache.
 *      If that call throws (e.g. a stale cookie that the protected
 *      middleware rejected), redirect to `/login` — we must NOT
 *      render the shell with no user.
 */
export async function decideCmsAccess(
  options: DecideOptions,
): Promise<CmsAccessDecision> {
  let valid: boolean;
  try {
    valid = await options.isValid();
  } catch {
    return { kind: 'redirect', to: '/login' };
  }

  if (!valid) {
    return { kind: 'redirect', to: '/login' };
  }

  try {
    const fullUser = await options.getCurrentUser();
    return {
      kind: 'allow',
      user: { name: fullUser.name, avatar: fullUser.avatar },
      userFull: fullUser,
    };
  } catch {
    return { kind: 'redirect', to: '/login' };
  }
}
