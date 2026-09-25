/**
 * Root route: `/` redirects to `/dashboard`.
 *
 * The redirect runs in `beforeLoad` so the browser never paints a
 * blank shell. The destination lives under the `_cms` pathless
 * layout, which means the redirect automatically re-runs the CMS
 * auth guard — an anonymous visitor lands on `/login` instead of
 * the empty dashboard.
 *
 * Phase 3a only registers the redirect + the minimal dashboard
 * placeholder; the full dashboard data wiring is a Phase 3b lane.
 */

import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  beforeLoad: () => {
    throw redirect({ to: '/dashboard' });
  },
});
