/**
 * Public barrel for the shared Query client/SSR helpers.
 *
 * Phase 3a remediation: the official
 * `@tanstack/react-router-ssr-query` integration owns the SSR
 * `dehydrate` / browser `hydrate` lifecycle, so this barrel no
 * longer needs the hand-wired dehydrate/hydrate helpers. The two
 * remaining surfaces are:
 *
 *   - `makeQueryClient`        — per-request / per-load factory
 *   - `clearPrivateQueryCache` — logout + 401 cache wipe
 *
 * The test-only `resetBrowserQueryClientForTests` hook is GONE —
 * the module-scope singleton was removed when we moved the
 * lifecycle into `getRouter()`.
 */

export { makeQueryClient } from './query-client';
export { clearPrivateQueryCache } from './cache-helpers';
