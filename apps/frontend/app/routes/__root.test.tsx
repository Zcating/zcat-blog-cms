/**
 * Pins the two route-boundary screens on the TanStack root route.
 *
 * ADR-0003 keeps `error component` registrations in `app/routes/`
 * as lightweight route metadata, so the root route must own a
 * `notFoundComponent` and an `errorComponent`. The React Router
 * migration dropped both, which silently replaced the product 404 /
 * error screens with TanStack's defaults for every unmatched URL and
 * every throwing loader. A missing registration is invisible at
 * runtime, so the registration itself is asserted here.
 *
 * Seam: the real root route options plus a real (memory-history)
 * router. The only substituted pieces are the child routes used to
 * produce an unmatched URL and a throwing loader; the boundary
 * components and the router are the real ones.
 */

import {
  Outlet,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { NotFoundPage } from '@cms/features/not-found/routes/not-found';
import { RouteErrorPage } from '@cms/features/not-found/routes/route-error';

import { Route } from './__root';

type BoundaryOptions = Pick<
  (typeof Route)['options'],
  'notFoundComponent' | 'errorComponent'
>;

async function renderRootBoundary(boundary: BoundaryOptions, path: string) {
  const rootRoute = createRootRoute({
    ...boundary,
    component: () => (
      <>
        <div data-testid="root-scaffold" />
        <Outlet />
      </>
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
        path: '/boom',
        loader: () => {
          throw new Error('loader exploded');
        },
        component: () => <div>never reached</div>,
      }),
    ]),
    history: createMemoryHistory({ initialEntries: [path] }),
  });

  await router.load();
  render(<RouterProvider router={router} />);
}

describe('root route boundary registration', () => {
  it('registers the product 404 page as notFoundComponent', () => {
    expect(Route.options.notFoundComponent).toBe(NotFoundPage);
  });

  it('registers the product error page as errorComponent', () => {
    expect(Route.options.errorComponent).toBe(RouteErrorPage);
  });
});

describe('notFoundComponent on the root route', () => {
  it('renders the legacy 404 copy for an unmatched URL', async () => {
    await renderRootBoundary(
      { notFoundComponent: Route.options.notFoundComponent },
      '/definitely-not-a-cms-page',
    );

    expect(
      await screen.findByRole('heading', { name: '页面未找到' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('您访问的页面可能已被删除、重命名或暂时不可用。'),
    ).toBeInTheDocument();
    expect(screen.getByText('返回首页').closest('a')).toHaveAttribute(
      'href',
      '/dashboard',
    );
    expect(screen.queryByText('Not Found')).not.toBeInTheDocument();
  });
});

describe('errorComponent on the root route', () => {
  it('renders the legacy error copy when a loader throws', async () => {
    await renderRootBoundary(
      { errorComponent: Route.options.errorComponent },
      '/boom',
    );

    expect(
      await screen.findByRole('heading', { name: '404 - 页面未找到' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('您访问的页面不存在或已被移除。'),
    ).toBeInTheDocument();
    expect(screen.getByText('返回首页').closest('a')).toHaveAttribute(
      'href',
      '/dashboard',
    );
  });

  it('announces the failure through the legacy alert region', async () => {
    await renderRootBoundary(
      { errorComponent: Route.options.errorComponent },
      '/boom',
    );

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveAttribute('aria-live', 'polite');
  });
});
