/**
 * Pins the `/:component` document route.
 *
 * The React Router version of this file had to cover the loader and the page
 * as two separate layers, because `createMemoryRouter` does not run
 * framework-mode `clientLoader`. Under TanStack Start the loader is a real
 * route loader, so a memory-history router over the real `routeTree` runs the
 * matcher, the loader and the component together. Both layers are still
 * covered separately as well: the loader is called directly to pin the
 * `:component` -> `DOCUMENT_CONFIGURES` lookup and the 404 fallback, and the
 * end-to-end case asserts the loaded markdown actually reaches the DOM.
 *
 * Nothing is mocked: the real `?raw` markdown imports, the real loader and the
 * real `@zcat/ui` components are what run.
 */

import { render, screen } from '@testing-library/react';
import {
  RouterProvider,
  createMemoryHistory,
  createRouter,
} from '@tanstack/react-router';
import { describe, expect, it } from 'vitest';

import { routeTree } from '../routeTree.gen';

import { loader } from './_layout.$component';

async function loadDoc(component: string) {
  return loader({ params: { component } });
}

function renderDocRoute(pathname: string) {
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [pathname] }),
  });
  render(<RouterProvider router={router} />);
  return router;
}

describe('loader for /:component', () => {
  it('resolves the markdown and title of a configured component', async () => {
    const data = await loadDoc('button');

    expect(data.title).toBe('Button');
    expect(data.content).toContain('# Button 按钮');
  });

  it('reads the markdown of a different configured component', async () => {
    const data = await loadDoc('view');

    expect(data.title).toBe('View');
    expect(data.content).toContain('# View 视图');
  });

  it('falls back to the 404 document for an unknown component name', async () => {
    const data = await loadDoc('not-a-real-component');

    expect(data.title).toBe('Not Found');
    expect(data.content).toContain('404 Not Found');
    expect(data.content).toContain('not-a-real-component');
  });
});

describe('DocsPage render', () => {
  it('renders the loaded markdown of a configured component', async () => {
    renderDocRoute('/button');

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Button 按钮' }),
    ).toBeInTheDocument();
    expect(screen.getByText('常用的操作按钮。')).toBeInTheDocument();
  });

  it('renders a demo block for a typescript-demo code fence', async () => {
    renderDocRoute('/view');

    expect(
      await screen.findByRole('heading', { name: 'Basic Usage' }),
    ).toBeInTheDocument();
    expect(screen.getByTitle('代码预览（仅展示）')).toBeInTheDocument();
  });

  it('renders the 404 document for an unknown component instead of crashing or rendering blank', async () => {
    renderDocRoute('/not-a-real-component');

    expect(
      await screen.findByRole('heading', { level: 1, name: '404 Not Found' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        (_, element) =>
          element?.tagName === 'P' &&
          element.textContent === '文档 not-a-real-component 不存在。',
      ),
    ).toBeInTheDocument();
  });
});

describe('end-to-end document resolution', () => {
  it('runs the real loader for the URL and feeds its markdown to the page', async () => {
    const router = renderDocRoute('/z-avatar');

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Avatar 头像' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('用来代表用户或事物的图标、图片或字符。'),
    ).toBeInTheDocument();

    const deepest = router.state.matches.at(-1);
    expect(deepest?.routeId).toBe('/_layout/$component');
    expect(deepest?.loaderData).toEqual({
      title: 'Avatar',
      content: expect.stringContaining('# Avatar 头像'),
    });
  });

  it('hands the 404 document to the page for an unknown URL instead of an error', async () => {
    const router = renderDocRoute('/still-not-a-real-component');

    expect(
      await screen.findByRole('heading', { level: 1, name: '404 Not Found' }),
    ).toBeInTheDocument();
    const deepest = router.state.matches.at(-1);
    expect(deepest?.status).toBe('success');
    expect(deepest?.loaderData).toEqual({
      title: 'Not Found',
      content: expect.stringContaining('still-not-a-real-component'),
    });
  });
});
