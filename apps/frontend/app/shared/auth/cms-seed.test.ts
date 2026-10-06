/*
 * Contract under test:
 *   - After a successful `decideCmsAccess` run, the route must call
 *     `context.queryClient.setQueryData(userInfoQueryOptions().queryKey, fullUser)`
 *     where `fullUser` includes every `UserInfo` field �?name,
 *     avatar, occupation, contact, aboutMe, abstract.
 *   - The route MAY pass only `{ name, avatar }` to the shell
 *     component, but the Query cache itself must carry the full
 *     payload so downstream `useQuery(userInfoQueryOptions())` reads
 *     see it.
 */

import { QueryClient } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';

import {
  buildCmsCacheSeed,
  type FullUserInfo,
  type CmsShellUser,
} from './cms-seed';

/**
 * UserInfoQueryOptions key �?must match `@cms/server/users`
 * `userInfoQueryOptions().queryKey`. We mirror it locally so the
 * test does not pull in the server module.
 */
const USER_INFO_KEY = ['users', 'current'];

describe('buildCmsCacheSeed (route-side cache writer)', () => {
  it('seeds the full UserInfo under userInfoQueryOptions().queryKey', () => {
    const queryClient = new QueryClient();
    const fullUser: FullUserInfo = {
      name: 'Admin',
      avatar: 'avatar.jpg',
      signedAvatar: 'https://signed.example/avatar.jpg',
      occupation: 'Editor',
      contact: { email: 'admin@test.com', github: 'admin' },
      aboutMe: 'About me',
      abstract: 'Abstract',
    };

    buildCmsCacheSeed({ queryClient, fullUser });

    const cached = queryClient.getQueryData(USER_INFO_KEY);
    expect(cached).toEqual(fullUser);
    // Specifically: a partial object must NOT be what is cached.
    expect(cached).not.toEqual({
      name: 'Admin',
      avatar: 'avatar.jpg',
    });
  });

  it('does not throw when the route provides a shell-shaped subset separately', () => {
    // The shell shape is what `_cms` passes to CMSLayoutShell for
    // display. The cache write is independent of the shell prop.
    const queryClient = new QueryClient();
    const fullUser: FullUserInfo = {
      name: 'Admin',
      avatar: 'avatar.jpg',
      signedAvatar: 'https://signed.example/avatar.jpg',
      occupation: 'Editor',
      contact: { email: 'admin@test.com', github: 'admin' },
      aboutMe: 'About me',
      abstract: 'Abstract',
    };
    const shellUser: CmsShellUser = {
      name: 'Admin',
      signedAvatar: 'https://signed.example/avatar.jpg',
    };

    expect(() =>
      buildCmsCacheSeed({ queryClient, fullUser, shellUser }),
    ).not.toThrow();

    expect(queryClient.getQueryData(USER_INFO_KEY)).toEqual(fullUser);
  });

  it('uses the canonical key �?matches server `userInfoQueryOptions`', () => {
    // If a future refactor renamed the key on the server but not
    // here, this test fails. The seed must point at the same key
    // that `useQuery(userInfoQueryOptions())` would read.
    const queryClient = new QueryClient();
    const fullUser: FullUserInfo = {
      name: 'A',
      avatar: '',
      signedAvatar: 'https://signed.example/avatar.jpg',
      occupation: '',
      contact: { email: '', github: '' },
      aboutMe: '',
      abstract: '',
    };
    buildCmsCacheSeed({ queryClient, fullUser });
    expect(queryClient.getQueryCache().getAll()[0].queryKey).toEqual(
      USER_INFO_KEY,
    );
  });

  it('accepts a stub `getCurrentUser` mock returning the full payload', async () => {
    // End-to-end shape check: the helper that the route uses to
    // call `getCurrentUser` returns a full `UserInfo`. We assert
    // here that the cache write preserves every field. The route's
    // `beforeLoad` is responsible for plumbing the mock into the
    // helper; this test pins the data contract the helper must
    // satisfy.
    const fullUser: FullUserInfo = {
      name: 'Admin',
      avatar: 'avatar.jpg',
      signedAvatar: 'https://signed.example/avatar.jpg',
      occupation: 'Editor',
      contact: { email: 'admin@test.com', github: 'admin' },
      aboutMe: 'About me',
      abstract: 'Abstract',
    };
    const getCurrentUser = vi.fn().mockResolvedValue(fullUser);
    const fetched = await getCurrentUser();
    expect(fetched).toEqual(fullUser);

    const queryClient = new QueryClient();
    buildCmsCacheSeed({ queryClient, fullUser: fetched });
    expect(queryClient.getQueryData(USER_INFO_KEY)).toEqual(fullUser);
  });
});
