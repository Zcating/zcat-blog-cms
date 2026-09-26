/**
 * Locked requirement: "on logout OR auth failure, clear the whole
 * private cache". The `_cms` `beforeLoad` is one of the two places a
 * session change is observed without a failing query — the cookie is
 * still present but `isValid` / `getCurrentUser` says the session is
 * gone, so the guard redirects to `/login`. If that redirect leaves the
 * per-request Query cache alone, the next account to sign in on the same
 * tab reads the previous account's entries.
 *
 * Seam: the real `_cms` route options and the real `QueryClient` from
 * `makeQueryClient()`. The only substitution is the server-function
 * module boundary (`@cms/server/users`).
 */

import { describe, expect, it, vi } from 'vitest';

const { isValidMock, getCurrentUserMock } = vi.hoisted(() => ({
  isValidMock: vi.fn(),
  getCurrentUserMock: vi.fn(),
}));

vi.mock('@cms/server/users', () => ({
  isValid: isValidMock,
  getCurrentUser: getCurrentUserMock,
}));

import { makeQueryClient } from '@cms/shared/query';

import { Route } from './_cms';

type BeforeLoad = (args: {
  context: { queryClient: ReturnType<typeof makeQueryClient> };
  location: { href: string };
}) => Promise<unknown>;

const beforeLoad = Route.options.beforeLoad as unknown as BeforeLoad;

const FULL_USER = {
  name: 'Admin',
  contact: { email: 'admin@test.com', github: 'admin' },
  occupation: 'Developer',
  avatar: '',
  aboutMe: 'About me',
  abstract: 'Abstract',
};

function runBeforeLoad(client: ReturnType<typeof makeQueryClient>) {
  return beforeLoad({
    context: { queryClient: client },
    location: { href: 'http://localhost:3000/dashboard' },
  });
}

function seedPrivateQueries(client: ReturnType<typeof makeQueryClient>) {
  client.setQueryData(['statistics', '*'], { totalVisits: 41 });
  client.setQueryData(['articles', 'list'], [{ id: 1 }]);
  client.setQueryData(['photos', 'list'], [{ id: 2 }]);
}

describe('_cms beforeLoad — invalid session', () => {
  it('empties the private Query cache when the session is reported invalid', async () => {
    const client = makeQueryClient();
    seedPrivateQueries(client);
    isValidMock.mockResolvedValue(false);

    await expect(runBeforeLoad(client)).rejects.toBeTruthy();

    expect(client.getQueryCache().getAll()).toHaveLength(0);
    expect(client.getQueryData(['statistics', '*'])).toBeUndefined();
    expect(client.getQueryData(['articles', 'list'])).toBeUndefined();
    expect(client.getQueryData(['photos', 'list'])).toBeUndefined();
  });

  it('empties the private Query cache when getCurrentUser rejects the stale session', async () => {
    const client = makeQueryClient();
    seedPrivateQueries(client);
    isValidMock.mockResolvedValue(true);
    getCurrentUserMock.mockRejectedValue({
      _tag: 'LoginError',
      message: 'Unauthorized',
    });

    await expect(runBeforeLoad(client)).rejects.toBeTruthy();

    expect(client.getQueryCache().getAll()).toHaveLength(0);
    expect(client.getQueryData(['articles', 'list'])).toBeUndefined();
  });
});

describe('_cms beforeLoad — valid session', () => {
  it('keeps unrelated private entries and only seeds the current user', async () => {
    const client = makeQueryClient();
    client.setQueryData(['articles', 'list'], [{ id: 1 }]);
    isValidMock.mockResolvedValue(true);
    getCurrentUserMock.mockResolvedValue(FULL_USER);

    const result = (await runBeforeLoad(client)) as { cmsUser: unknown };

    expect(result.cmsUser).toEqual({ name: 'Admin', avatar: '' });
    expect(client.getQueryData(['articles', 'list'])).toEqual([{ id: 1 }]);
    expect(client.getQueryData(['users', 'current'])).toEqual(FULL_USER);
  });
});
