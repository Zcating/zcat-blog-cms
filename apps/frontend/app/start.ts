/**
 * TanStack Start global configuration.
 *
 * Phase 3a remediation: the per-request `QueryClient` is now built
 * inside `getRouter()` (see `app/router.tsx`). The official
 * `@tanstack/react-router-ssr-query` integration handles every
 * SSR concern the previous hand-wired middleware covered:
 * dehydrate on the server, hydrate on the client, and a
 * `QueryClientProvider` wrap. This file therefore has nothing
 * beyond the empty `createStart` defaults.
 *
 * If a future change needs cross-cutting middleware (logging,
 * CSRF, auth context, etc.) add it here. Today there is no
 * server-only middleware to wire.
 */

import { createStart } from '@tanstack/react-start';

export const startInstance = createStart(() => ({}));
