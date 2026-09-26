/**
 * Locked requirement: a 401 rejection from any private server function
 * must empty the private Query cache, for BOTH queries and mutations.
 *
 * Seam: the public `QueryClient` produced by `makeQueryClient()` and the
 * public Query / Mutation caches. The only thing mocked is the
 * server-function module boundary (`@cms/server/users`) — no internal
 * TanStack module and no `@tanstack/start-server-core` stub.
 *
 * The rejected error is built from the real `UnauthorizedError` and pushed
 * through the real seroval cross-JSON round trip that
 * `@tanstack/start-server-core` performs. That trip is load-bearing: the
 * router's `ShallowErrorPlugin` matches every `value instanceof Error`,
 * serializes ONLY `message`, and deserializes back to a plain
 * `new Error(message)`. So `name` and `code` do NOT survive the RPC
 * boundary and `message` is the only signal the client can match on.
 */

import { defaultSerovalDeserializerPlugins } from '@tanstack/router-core/ssr/server';
import { fromCrossJSON, toCrossJSONAsync } from 'seroval';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getCurrentUserMock, updateCurrentUserMock } = vi.hoisted(() => ({
  getCurrentUserMock: vi.fn(),
  updateCurrentUserMock: vi.fn(),
}));

vi.mock('@cms/server/users', () => ({
  getCurrentUser: getCurrentUserMock,
  updateCurrentUser: updateCurrentUserMock,
}));

import { MutationObserver, type QueryClient } from '@tanstack/react-query';

import { UnauthorizedError } from '../../server/auth-middleware';
import { UNAUTHORIZED_ERROR_CODE } from '../auth/unauthorized';
import { makeQueryClient } from './query-client';

async function acrossRpcBoundary(error: Error): Promise<Error> {
  const payload = JSON.parse(
    JSON.stringify(
      await toCrossJSONAsync(error, {
        refs: new Map(),
        plugins: defaultSerovalDeserializerPlugins,
      }),
    ),
  );
  return fromCrossJSON(payload, {
    plugins: defaultSerovalDeserializerPlugins,
  }) as Error;
}

function seedPrivateQueries(client: QueryClient) {
  client.setQueryData(['users', 'current'], { name: 'Admin' });
  client.setQueryData(['photos', 'list'], [{ id: 1 }]);
}

describe('makeQueryClient — 401 clears the private cache', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('empties the query cache when a private query rejects as unauthorized', async () => {
    const client = makeQueryClient();
    seedPrivateQueries(client);
    expect(client.getQueryCache().getAll()).toHaveLength(2);

    getCurrentUserMock.mockRejectedValue(
      await acrossRpcBoundary(new UnauthorizedError()),
    );

    await expect(
      client.fetchQuery({
        ...({
          queryKey: ['users', 'current'],
          queryFn: getCurrentUserMock,
        } as const),
        staleTime: 0,
      }),
    ).rejects.toThrow(UNAUTHORIZED_ERROR_CODE);

    expect(client.getQueryCache().getAll()).toHaveLength(0);
    expect(client.getQueryData(['users', 'current'])).toBeUndefined();
    expect(client.getQueryData(['photos', 'list'])).toBeUndefined();
  });

  it('empties the mutation cache when a private mutation rejects as unauthorized', async () => {
    const client = makeQueryClient();
    seedPrivateQueries(client);
    updateCurrentUserMock.mockRejectedValue(
      await acrossRpcBoundary(new UnauthorizedError()),
    );

    const observer = new MutationObserver(client, {
      mutationFn: (variables: unknown) =>
        updateCurrentUserMock({ data: variables }),
    });
    await expect(observer.mutate({ name: 'Admin' })).rejects.toThrow(
      UNAUTHORIZED_ERROR_CODE,
    );

    expect(client.getMutationCache().getAll()).toHaveLength(0);
    expect(client.getQueryCache().getAll()).toHaveLength(0);
  });

  it('keeps the private cache intact when a private query fails for a non-auth reason', async () => {
    const client = makeQueryClient();
    seedPrivateQueries(client);
    getCurrentUserMock.mockRejectedValue({
      _tag: 'UnknownError',
      message: 'boom',
    });

    await expect(
      client.fetchQuery({
        ...({
          queryKey: ['users', 'current'],
          queryFn: getCurrentUserMock,
        } as const),
        staleTime: 0,
      }),
    ).rejects.toBeTruthy();

    expect(client.getQueryCache().getAll()).toHaveLength(2);
    expect(client.getQueryData(['users', 'current'])).toEqual({
      name: 'Admin',
    });
    expect(client.getQueryData(['photos', 'list'])).toEqual([{ id: 1 }]);
  });

  it('keeps the private cache intact when a private mutation fails for a non-auth reason', async () => {
    const client = makeQueryClient();
    seedPrivateQueries(client);
    updateCurrentUserMock.mockRejectedValue(new Error('boom'));

    const observer = new MutationObserver(client, {
      mutationFn: (variables: unknown) =>
        updateCurrentUserMock({ data: variables }),
    });
    await expect(observer.mutate({ name: 'Admin' })).rejects.toThrow('boom');

    expect(client.getQueryCache().getAll()).toHaveLength(2);
    expect(client.getQueryData(['users', 'current'])).toEqual({
      name: 'Admin',
    });
  });
});
