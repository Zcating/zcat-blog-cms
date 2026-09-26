/**
 * Locked requirement: "on logout OR auth failure, clear the whole
 * private cache". Signing in is the third way a session changes, and it
 * is an SPA navigation: the browser `QueryClient` created at page load
 * is NOT rebuilt, so anything the previous account left behind under
 * `staleTime: 'static'` is still there when the next account's
 * dashboard mounts. The post-login `navigate` must therefore start from
 * an empty private cache.
 *
 * This file deliberately keeps its own module mocks (a REAL memory
 * router, no `useNavigate` stub) so it does not collide with
 * `login.test.tsx`, which stubs the router instead.
 *
 * Seam: the real login route component, a real memory router and a real
 * `QueryClient` from `makeQueryClient()`. The only substitution is the
 * server-function boundary — `@cms/server/auth` and the `useServerFn`
 * RPC wrapper, which needs a live Start runtime.
 */

import { QueryClientProvider } from '@tanstack/react-query';
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from '@tanstack/react-router';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

const { loginMock } = vi.hoisted(() => ({ loginMock: vi.fn() }));

vi.mock('@cms/server/auth', () => ({ login: loginMock }));
vi.mock('@tanstack/react-start', () => ({
  useServerFn: (serverFn: unknown) => serverFn,
}));

import { makeQueryClient } from '@cms/shared/query';

import LoginPage from './login';

async function renderLoginApp() {
  const rootRoute = createRootRoute({ component: () => <Outlet /> });
  const loginRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/login',
    component: LoginPage,
  });
  const dashboardRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/dashboard',
    component: () => <div>dashboard screen</div>,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([loginRoute, dashboardRoute]),
    history: createMemoryHistory({ initialEntries: ['/login'] }),
  });

  const queryClient = makeQueryClient();
  await router.load();
  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );

  return { router, queryClient };
}

async function submitCredentials() {
  const user = userEvent.setup();
  await user.type(await screen.findByLabelText('用户名'), 'user-b');
  await user.type(screen.getByLabelText('密码'), 'secret-b');
  await user.click(screen.getByRole('button', { name: '登录' }));
}

describe('login route — successful submit', () => {
  it('empties the private Query cache before navigating to the dashboard', async () => {
    loginMock.mockResolvedValue({ ok: true });
    const { router, queryClient } = await renderLoginApp();

    queryClient.setQueryData(['statistics', '*'], { totalVisits: 41 });
    queryClient.setQueryData(['articles', 'list'], [{ id: 1 }]);
    queryClient.setQueryData(['photos', 'list'], [{ id: 2 }]);
    queryClient.setQueryData(['photo-albums', 'list'], [{ id: 3 }]);
    expect(queryClient.getQueryCache().getAll()).toHaveLength(4);

    await submitCredentials();

    await screen.findByText('dashboard screen');
    expect(router.state.location.pathname).toBe('/dashboard');
    expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
    expect(queryClient.getQueryData(['statistics', '*'])).toBeUndefined();
    expect(queryClient.getQueryData(['articles', 'list'])).toBeUndefined();
    expect(queryClient.getQueryData(['photos', 'list'])).toBeUndefined();
    expect(queryClient.getQueryData(['photo-albums', 'list'])).toBeUndefined();
  });
});

describe('login route — failed submit', () => {
  it('keeps the private Query cache intact and stays on the login route', async () => {
    loginMock.mockRejectedValue({
      _tag: 'LoginError',
      message: 'Unauthorized',
    });
    const { router, queryClient } = await renderLoginApp();

    queryClient.setQueryData(['articles', 'list'], [{ id: 1 }]);

    await submitCredentials();

    await screen.findByText('登录失败');
    expect(router.state.location.pathname).toBe('/login');
    expect(queryClient.getQueryCache().getAll()).toHaveLength(1);
    expect(queryClient.getQueryData(['articles', 'list'])).toEqual([{ id: 1 }]);
  });
});
