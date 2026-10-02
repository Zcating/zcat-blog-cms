/**
 * File-based route for `/login`.
 *
 * The actual page implementation lives in `app/features/auth/routes/login.tsx`
 * so it can stay close to its feature folder and tests. This file only exists
 * to register the route with TanStack Router's file-based routing plugin.
 */

import { createFileRoute } from '@tanstack/react-router';

import LoginPage from '@cms/features/auth/routes/login';

export const Route = createFileRoute('/login')({
  component: LoginPage,
});
