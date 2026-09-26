/*
 * The redirect runs in `beforeLoad` so the browser never paints a
 * blank shell. The destination lives under the `_cms` pathless
 * layout, which means the redirect automatically re-runs the CMS
 * auth guard — an anonymous visitor lands on `/login` instead of
 * the empty dashboard.
 */

import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  beforeLoad: () => {
    throw redirect({ to: '/dashboard' });
  },
});
