/*
 * The helper must retain the COMPLETE
 * `UserInfo` returned by `getCurrentUser` (under `userFull`) and
 * surface only the shell display subset (under `user`). The route
 * writes `userFull` into the Query cache; the shell uses `user`.
 */

import { describe, expect, it, vi } from 'vitest';

import { decideCmsAccess, type CmsAccessDecision } from './cms-access';

const FULL_USER = {
  name: 'Admin',
  avatar: 'avatar.jpg',
  occupation: 'Editor',
  contact: { email: 'admin@test.com', github: 'admin' },
  aboutMe: 'About me',
  abstract: 'Abstract',
};

describe('decideCmsAccess', () => {
  it('returns "allow" with both the shell subset and the full UserInfo on a valid session', async () => {
    const isValidMock = vi.fn().mockResolvedValue(true);
    const getUserMock = vi.fn().mockResolvedValue(FULL_USER);

    const decision = await decideCmsAccess({
      isValid: isValidMock,
      getCurrentUser: getUserMock,
    });

    // Both keys must be present and carry the right payload.
    expect(decision).toEqual({
      kind: 'allow',
      user: { name: 'Admin', avatar: 'avatar.jpg' },
      userFull: FULL_USER,
    });
    expect(isValidMock).toHaveBeenCalledTimes(1);
    // The shell context requires the current user, so the user fetch
    // must run on every successful validation pass.
    expect(getUserMock).toHaveBeenCalledTimes(1);
  });

  it('returns "redirect" when isValid reports an invalid session', async () => {
    const isValidMock = vi.fn().mockResolvedValue(false);
    const getUserMock = vi.fn();

    const decision = await decideCmsAccess({
      isValid: isValidMock,
      getCurrentUser: getUserMock,
    });

    expect(decision).toEqual({ kind: 'redirect', to: '/login' });
    // An invalid session must not trigger the user fetch.
    expect(getUserMock).not.toHaveBeenCalled();
  });

  it('still redirects when isValid throws (no leak of internal error)', async () => {
    const isValidMock = vi.fn().mockRejectedValue(new Error('boom'));
    const getUserMock = vi.fn();

    const decision = await decideCmsAccess({
      isValid: isValidMock,
      getCurrentUser: getUserMock,
    });

    // Any failure on the validity check must be treated as "not logged
    // in" — the redirect is the safe default, the layout route is UX.
    expect(decision).toEqual({ kind: 'redirect', to: '/login' });
    expect(getUserMock).not.toHaveBeenCalled();
  });

  it('returns a redirect when getCurrentUser throws on a "valid" session', async () => {
    // Edge case: cookie claims the session is valid but the user
    // payload cannot be fetched. We must not render the protected
    // shell — the server function boundary will reject anyway.
    const isValidMock = vi.fn().mockResolvedValue(true);
    const getUserMock = vi.fn().mockRejectedValue(new Error('no user'));

    const decision = await decideCmsAccess({
      isValid: isValidMock,
      getCurrentUser: getUserMock,
    });

    expect(decision).toEqual({ kind: 'redirect', to: '/login' });
  });

  it('matches the CmsAccessDecision type union', () => {
    // Type-level sanity: both shapes are reachable through the union.
    const allowed: CmsAccessDecision = {
      kind: 'allow',
      user: { name: 'A', avatar: '' },
      userFull: FULL_USER,
    };
    const denied: CmsAccessDecision = { kind: 'redirect', to: '/login' };
    expect(allowed.kind).toBe('allow');
    expect(denied.kind).toBe('redirect');
  });
});
