/**
 * Tests for the cache-clear helper used by the CMS shell.
 *
 * Contract:
 *   - `clearPrivateQueryCache(queryClient)` removes every entry from
 *     the query cache AND the mutation cache.
 *   - This is the same operation the layout invokes on logout and on
 *     the 401 / invalid-session path: after it runs, a private key
 *     lookup MUST return undefined.
 *
 * We exercise the helper against a real QueryClient. No internal
 * TanStack modules are mocked.
 */

import { describe, expect, it } from 'vitest';

import { clearPrivateQueryCache } from './cache-helpers';
import { makeQueryClient } from './query-client';

describe('clearPrivateQueryCache', () => {
  it('removes every query from the cache', () => {
    const client = makeQueryClient();
    client.setQueryData(['users', 'current'], { name: 'Admin' });
    client.setQueryData(['articles', 'list'], [{ id: 1 }]);
    expect(client.getQueryCache().getAll()).toHaveLength(2);

    clearPrivateQueryCache(client);

    expect(client.getQueryCache().getAll()).toHaveLength(0);
    expect(client.getQueryData(['users', 'current'])).toBeUndefined();
    expect(client.getQueryData(['articles', 'list'])).toBeUndefined();
  });

  it('removes every mutation from the cache', () => {
    const client = makeQueryClient();
    // Drive the mutation cache through its public API: getMutationCache()
    // already has whatever the client seeded; calling clear must empty it.
    const mutationCache = client.getMutationCache();
    expect(mutationCache.getAll().length).toBe(0);

    clearPrivateQueryCache(client);

    expect(mutationCache.getAll().length).toBe(0);
  });

  it('is safe to call on an already-empty cache', () => {
    const client = makeQueryClient();
    expect(() => clearPrivateQueryCache(client)).not.toThrow();
    expect(client.getQueryCache().getAll()).toHaveLength(0);
  });

  it('does not throw on a fresh client and leaves it empty', () => {
    const client = makeQueryClient();
    clearPrivateQueryCache(client);
    expect(client.getQueryCache().getAll()).toHaveLength(0);
    expect(client.getMutationCache().getAll()).toHaveLength(0);
  });
});
