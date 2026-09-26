/*
 * The helper accepts the typed `isValid` and `getCurrentUser` server
 * functions by reference so we can test it without spinning up
 * TanStack Start.
 *
 * IMPORTANT: this guard is UX only. The real security boundary
 * lives on every protected `createServerFn` via the
 * `createProtectedFunctionMiddleware` factory. A route-level guard
 * cannot be relied on to keep private data private — it only
 * shapes the navigation experience.
 *
 * The caller is responsible for writing `userFull` into the Query
 * cache under `userInfoQueryOptions().queryKey`; the shell sees
 * only `user`. A partial cache write would silently break every
 * downstream consumer of the user query.
 */

import type { UserInfo } from '@cms/server/users/users-helpers';

/**
 * Minimal shape of the shell user. We strip the server-side fields
 * (contact / abstract / aboutMe) the shell does not need so the
 * serialized route context stays small.
 */
import type { CmsShellUser } from './cms-seed';
export type { CmsShellUser } from './cms-seed';

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
 * If `getCurrentUser` throws (e.g. a stale cookie that the protected
 * middleware rejected), redirect to `/login` — we must NOT render the
 * shell with no user.
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
