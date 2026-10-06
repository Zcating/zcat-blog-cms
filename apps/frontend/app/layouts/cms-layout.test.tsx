/**
 * Logout half of the "logout + 401 clears the private Query cache" rule.
 *
 * The 401 half lives with the client factory in
 * `app/shared/query/unauthorized-cache-wipe.test.ts`. This file pins the
 * logout half so neither side of the requirement can regress on its own.
 *
 * Seam: the real shell component rendered inside a real (memory-history)
 * router and the public `QueryClient` from `makeQueryClient()`. The only
 * stubbed modules are the `logout` server function, the confirm dialog
 * the shell opens before it calls it, and the error notification it can
 * raise when that call rejects.
 */

import { QueryClientProvider } from '@tanstack/react-query';
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { logoutMock, confirmMock, notificationErrorMock } = vi.hoisted(() => ({
  logoutMock: vi.fn().mockResolvedValue({ code: '0000', message: '已登出' }),
  confirmMock: vi.fn().mockResolvedValue(true),
  notificationErrorMock: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@cms/server/auth', () => ({ logout: logoutMock }));

vi.mock('@zcat/ui', async () => {
  const actual = await vi.importActual<typeof import('@zcat/ui')>('@zcat/ui');
  return {
    ...actual,
    ZDialog: { confirm: confirmMock },
    ZNotification: { ...actual.ZNotification, error: notificationErrorMock },
  };
});

import { makeQueryClient } from '@cms/shared/query';

import { CMSLayoutShell } from './cms-layout';

async function renderShell() {
  const client = makeQueryClient();
  const rootRoute = createRootRoute({
    component: () => (
      <QueryClientProvider client={client}>
        <CMSLayoutShell cmsUser={{ name: 'Admin', signedAvatar: '' }}>
          <div>shell-child</div>
        </CMSLayoutShell>
      </QueryClientProvider>
    ),
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([
      createRoute({
        getParentRoute: () => rootRoute,
        path: '/dashboard',
        component: () => <div>dashboard screen</div>,
      }),
      createRoute({
        getParentRoute: () => rootRoute,
        path: '/login',
        component: () => <div>login screen</div>,
      }),
    ]),
    history: createMemoryHistory({ initialEntries: ['/dashboard'] }),
  });

  await router.load();
  render(<RouterProvider router={router} />);
  await screen.findByText('shell-child');

  return { client, router };
}

function clickLogout() {
  const button = document.querySelector<HTMLButtonElement>(
    '[data-slot="sidebar-footer"] button',
  );
  if (!button) throw new Error('sidebar footer logout button not found');
  fireEvent.click(button);
}

describe('CMSLayoutShell logout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('clears the private Query cache and moves to /login', async () => {
    const { client, router } = await renderShell();
    client.setQueryData(['users', 'current'], { name: 'Admin' });
    client.setQueryData(['photos', 'list'], [{ id: 1 }]);

    clickLogout();

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/login');
    });
    expect(logoutMock).toHaveBeenCalledTimes(1);
    expect(client.getQueryCache().getAll()).toHaveLength(0);
    expect(client.getQueryData(['users', 'current'])).toBeUndefined();
  });

  it('keeps the private Query cache when the confirmation is declined', async () => {
    confirmMock.mockResolvedValueOnce(false);
    const { client, router } = await renderShell();
    client.setQueryData(['users', 'current'], { name: 'Admin' });

    clickLogout();

    await waitFor(() => {
      expect(confirmMock).toHaveBeenCalledTimes(1);
    });
    expect(logoutMock).not.toHaveBeenCalled();
    expect(router.state.location.pathname).toBe('/dashboard');
    expect(client.getQueryCache().getAll()).toHaveLength(1);
  });

  it('clears the private Query cache and still redirects when the logout call rejects', async () => {
    logoutMock.mockRejectedValueOnce(new Error('logout boom'));
    const { client, router } = await renderShell();
    client.setQueryData(['users', 'current'], { name: 'Admin' });
    client.setQueryData(['photos', 'list'], [{ id: 1 }]);

    clickLogout();

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/login');
    });
    expect(logoutMock).toHaveBeenCalledTimes(1);
    expect(client.getQueryCache().getAll()).toHaveLength(0);
    expect(client.getQueryData(['users', 'current'])).toBeUndefined();
    expect(client.getQueryData(['photos', 'list'])).toBeUndefined();
    await waitFor(() => {
      expect(notificationErrorMock).toHaveBeenCalledWith('logout boom');
    });
  });
});
