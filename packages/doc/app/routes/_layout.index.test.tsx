/**
 * Pins the `/` route of the documentation site.
 *
 * The home route is the only entry point that does not depend on a `:component`
 * param, so it is the cheapest way to notice a router swap breaking document
 * navigation: it must still render its own copy and still resolve its
 * `Link` to the first document.
 */

import { render, screen } from '@testing-library/react';
import {
  RouterProvider,
  createMemoryHistory,
  createRouter,
} from '@tanstack/react-router';
import { describe, expect, it } from 'vitest';

import { routeTree } from '../routeTree.gen';

function renderRoute(pathname: string) {
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [pathname] }),
  });
  render(<RouterProvider router={router} />);
  return router;
}

describe('home route at /', () => {
  it('renders the library name and its pitch', async () => {
    renderRoute('/');

    expect(
      await screen.findByRole('heading', { level: 1, name: '@zcat/ui' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /基于 Radix UI 和 Tailwind CSS 构建的现代化 React 组件库/,
      ),
    ).toBeInTheDocument();
  });

  it('links the call to action to the first document', async () => {
    renderRoute('/');

    expect(
      await screen.findByRole('link', { name: '开始使用' }),
    ).toHaveAttribute('href', '/button');
  });

  it('renders the three selling points that identify the page', async () => {
    renderRoute('/');

    expect(
      await screen.findByRole('heading', { name: '可定制' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '无障碍' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '现代化' })).toBeInTheDocument();
  });

  it('resolves the home route id, not a redirect to a document', async () => {
    const router = renderRoute('/');

    await screen.findByRole('heading', { level: 1, name: '@zcat/ui' });
    expect(router.state.matches.map((match) => match.routeId)).toEqual([
      '__root__',
      '/_layout',
      '/_layout/',
    ]);
  });
});
