/**
 * Locked requirement: an auth rejection from any private server
 * function must empty the private Query cache, for BOTH queries and
 * mutations, on BOTH death modes.
 *
 * Seam: the public `QueryClient` produced by `makeQueryClient()` and the
 * public Query / Mutation caches. The only thing mocked is the
 * server-function module boundary (`@cms/server/users`) — no internal
 * TanStack module and no `@tanstack/start-server-core` stub.
 *
 * The rejected error is pushed through the real seroval cross-JSON round
 * trip that `@tanstack/start-server-core` performs. That trip is
 * load-bearing and the two auth-failure shapes come out of it very
 * differently:
 *
 *   - COOKIE ABSENT. `createProtectedFunctionMiddleware` throws the
 *     `UnauthorizedError` class. `ShallowErrorPlugin.test` is
 *     `value instanceof Error`, so seroval keeps ONLY `message` and the
 *     router's client rehydrates `new Error('UnauthorizedError')`.
 *     `name` and `code` do NOT survive; `message` is the only signal.
 *
 *   - JWT EXPIRED OR REVOKED (the common case). The cookie is still
 *     present, so the middleware passes and the backend's auth
 *     middleware answers `{ code: 'ERR0002' }` with 401.
 *     `envelopeToApiError` turns that into a plain `ApiError` OBJECT
 *     `{ _tag: 'LoginError', message: 'Unauthorized' }`, never an
 *     `Error`. `ShallowErrorPlugin` therefore never matches, the value
 *     crosses the wire as an ordinary object, and BOTH `_tag` and
 *     `message` survive. Matching only the `UnauthorizedError` literal
 *     misses this shape entirely and leaks the previous account's data.
 *
 * An ordinary backend 500 is `ERR0006` → `_tag: 'UnknownError'` and must
 * leave the cache intact.
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
import { envelopeToApiError } from '../../server/errors';
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

async function apiErrorAcrossRpcBoundary(apiError: unknown): Promise<unknown> {
  const envelope = { result: undefined, error: apiError, context: {} };
  const payload = JSON.parse(
    JSON.stringify(
      await toCrossJSONAsync(envelope, {
        refs: new Map(),
        plugins: defaultSerovalDeserializerPlugins,
      }),
    ),
  );
  const clientSide = fromCrossJSON(payload, {
    plugins: defaultSerovalDeserializerPlugins,
  }) as { error: unknown };
  return clientSide.error;
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

  it('empties the query cache when a private query rejects with the backend auth-failure ApiError', async () => {
    const client = makeQueryClient();
    seedPrivateQueries(client);
    getCurrentUserMock.mockRejectedValue(
      await apiErrorAcrossRpcBoundary({
        _tag: 'LoginError',
        message: 'Unauthorized',
      }),
    );

    await expect(
      client.fetchQuery({
        ...({
          queryKey: ['users', 'current'],
          queryFn: getCurrentUserMock,
        } as const),
        staleTime: 0,
      }),
    ).rejects.toEqual({ _tag: 'LoginError', message: 'Unauthorized' });

    expect(client.getQueryCache().getAll()).toHaveLength(0);
    expect(client.getQueryData(['users', 'current'])).toBeUndefined();
    expect(client.getQueryData(['photos', 'list'])).toBeUndefined();
  });

  it('empties the mutation cache when a private mutation rejects with the backend auth-failure ApiError', async () => {
    const client = makeQueryClient();
    seedPrivateQueries(client);
    updateCurrentUserMock.mockRejectedValue(
      await apiErrorAcrossRpcBoundary({
        _tag: 'LoginError',
        message: 'Unauthorized',
      }),
    );

    const observer = new MutationObserver(client, {
      mutationFn: (variables: unknown) =>
        updateCurrentUserMock({ data: variables }),
    });
    await expect(observer.mutate({ name: 'Admin' })).rejects.toEqual({
      _tag: 'LoginError',
      message: 'Unauthorized',
    });

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

  it('keeps the private cache intact for an ordinary 500 that crossed the RPC boundary', async () => {
    const client = makeQueryClient();
    seedPrivateQueries(client);
    getCurrentUserMock.mockRejectedValue(
      await apiErrorAcrossRpcBoundary({
        _tag: 'UnknownError',
        message: 'Malformed error envelope from backend',
      }),
    );

    await expect(
      client.fetchQuery({
        ...({
          queryKey: ['users', 'current'],
          queryFn: getCurrentUserMock,
        } as const),
        staleTime: 0,
      }),
    ).rejects.toEqual({
      _tag: 'UnknownError',
      message: 'Malformed error envelope from backend',
    });

    expect(client.getQueryCache().getAll()).toHaveLength(2);
    expect(client.getQueryData(['users', 'current'])).toEqual({
      name: 'Admin',
    });
    expect(client.getQueryData(['photos', 'list'])).toEqual([{ id: 1 }]);
  });

  it('keeps the private cache intact when a private mutation fails for a non-auth reason', async () => {
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

/**
 * Whole-chain gate: the payload is the backend's LITERAL 401 body, the
 * error the cache sees is whatever `envelopeToApiError` produces from it,
 * and the cache must come out empty. Hand-building `{ _tag: 'LoginError' }`
 * here would pass even while the classifier rejected the real body.
 */
function backendBody(code: string, message: string): unknown {
  return JSON.parse(JSON.stringify({ code, message }));
}

describe('makeQueryClient — the real backend 401 body wipes the private cache', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('classifies the auth middleware body as LoginError', () => {
    expect(envelopeToApiError(backendBody('ERR0002', 'Unauthorized'))).toEqual({
      _tag: 'LoginError',
      message: 'Unauthorized',
    });
  });

  it('empties the query cache for the classified auth middleware body', async () => {
    const client = makeQueryClient();
    seedPrivateQueries(client);

    const apiError = envelopeToApiError(backendBody('ERR0002', 'Unauthorized'));
    getCurrentUserMock.mockRejectedValue(
      await apiErrorAcrossRpcBoundary(apiError),
    );

    await expect(
      client.fetchQuery({
        ...({
          queryKey: ['users', 'current'],
          queryFn: getCurrentUserMock,
        } as const),
        staleTime: 0,
      }),
    ).rejects.toEqual({ _tag: 'LoginError', message: 'Unauthorized' });

    expect(client.getQueryCache().getAll()).toHaveLength(0);
    expect(client.getQueryData(['users', 'current'])).toBeUndefined();
    expect(client.getQueryData(['photos', 'list'])).toBeUndefined();
  });

  it('empties the mutation cache for the classified auth middleware body', async () => {
    const client = makeQueryClient();
    seedPrivateQueries(client);

    const apiError = envelopeToApiError(backendBody('ERR0002', 'Unauthorized'));
    updateCurrentUserMock.mockRejectedValue(
      await apiErrorAcrossRpcBoundary(apiError),
    );

    const observer = new MutationObserver(client, {
      mutationFn: (variables: unknown) =>
        updateCurrentUserMock({ data: variables }),
    });
    await expect(observer.mutate({ name: 'Admin' })).rejects.toEqual({
      _tag: 'LoginError',
      message: 'Unauthorized',
    });

    expect(client.getMutationCache().getAll()).toHaveLength(0);
    expect(client.getQueryCache().getAll()).toHaveLength(0);
  });

  it('keeps the private cache for a classified data-less 500', async () => {
    const client = makeQueryClient();
    seedPrivateQueries(client);

    const apiError = envelopeToApiError(
      backendBody('ERR0006', 'Internal Server Error'),
    );
    expect(apiError).toEqual({
      _tag: 'UnknownError',
      message: 'Internal Server Error',
    });

    getCurrentUserMock.mockRejectedValue(
      await apiErrorAcrossRpcBoundary(apiError),
    );

    await expect(
      client.fetchQuery({
        ...({
          queryKey: ['users', 'current'],
          queryFn: getCurrentUserMock,
        } as const),
        staleTime: 0,
      }),
    ).rejects.toEqual({
      _tag: 'UnknownError',
      message: 'Internal Server Error',
    });

    expect(client.getQueryCache().getAll()).toHaveLength(2);
    expect(client.getQueryData(['users', 'current'])).toEqual({
      name: 'Admin',
    });
  });
});
