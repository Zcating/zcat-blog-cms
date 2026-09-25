/**
 * Tests for the SSR-aware TanStack Query client factory.
 *
 * Phase 3a remediation: the module-scope browser singleton is gone
 * — the browser now gets its client from `getRouter()` instead.
 * These tests focus on the per-request / per-load factory.
 *
 * Invariants under test:
 *   - Each call to `makeQueryClient()` returns a fresh `QueryClient`
 *     instance. Server requests MUST NOT share a cache, otherwise
 *     user A's dehydrated state would leak into user B's response.
 *   - The default options disable automatic retries (ADR-0003 +
 *     Phase 3a scope contract).
 *
 * No internal TanStack modules are mocked — we exercise the public
 * factory and inspect the resulting instances directly.
 */

import { QueryClient } from '@tanstack/react-query';
import { describe, expect, it } from 'vitest';

import { makeQueryClient } from './query-client';

describe('makeQueryClient', () => {
  it('returns a fresh QueryClient on every call', () => {
    const a = makeQueryClient();
    const b = makeQueryClient();
    expect(a).toBeInstanceOf(QueryClient);
    expect(b).toBeInstanceOf(QueryClient);
    expect(a).not.toBe(b);
  });

  it('returns QueryClients that do not share their query cache', () => {
    const a = makeQueryClient();
    const b = makeQueryClient();
    const cacheA = a.getQueryCache();
    const cacheB = b.getQueryCache();
    expect(cacheA).not.toBe(cacheB);
  });

  it('disables automatic retries on queries', () => {
    const client = makeQueryClient();
    const defaultOptions = client.getDefaultOptions();
    expect(defaultOptions.queries?.retry).toBe(false);
  });

  it('disables automatic retries on mutations', () => {
    const client = makeQueryClient();
    const defaultOptions = client.getDefaultOptions();
    expect(defaultOptions.mutations?.retry).toBe(false);
  });
});
