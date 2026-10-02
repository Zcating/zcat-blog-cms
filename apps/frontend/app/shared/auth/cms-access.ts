/*
 * `isValid` / `getCurrentUser` are taken by reference so this is testable
 * without booting TanStack Start.
 *
 * This guard is UX only — the real security boundary is
 * `createProtectedFunctionMiddleware` on every protected server function.
 * A route guard cannot keep private data private.
 *
 * The caller owns writing `userFull` into the Query cache under
 * `userInfoQueryOptions().queryKey`; the shell sees only `user`.
 */

import type { UserInfo } from '@cms/server/users/users-helpers';

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
