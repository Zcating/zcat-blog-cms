/**
 * Pins the `/:component` document route.
 *
 * Two layers are covered separately, because they fail independently:
 *
 * - `clientLoader` owns the `:component` -> `DOCUMENT_CONFIGURES` lookup, the
 *   markdown import, and the 404 fallback. A router swap that renames the
 *   param or drops the loader shows up here.
 * - `DocsPage` owns turning that markdown into the visible page through
 *   `ZMarkdown`. A router swap that stops feeding `loaderData` to the
 *   component shows up here instead.
 *
 * Nothing is mocked: the real `?raw` markdown imports and the real
 * `@zcat/ui` components are what run.
 */

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import DocsPage, { clientLoader } from './index.page';

import type { Route } from './+types/index.page';

async function loadDoc(component: string) {
  return clientLoader({ params: { component } } as unknown as Route.LoaderArgs);
}

async function renderDocRoute(component: string) {
  const loaderData = await loadDoc(component);
  const props = {
    loaderData,
    params: { component },
  } as unknown as Route.ComponentProps;
  render(<DocsPage {...props} />);
}

describe('clientLoader for /:component', () => {
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
    await renderDocRoute('button');

    expect(
      screen.getByRole('heading', { level: 1, name: 'Button 按钮' }),
    ).toBeInTheDocument();
    expect(screen.getByText('常用的操作按钮。')).toBeInTheDocument();
  });

  it('renders a demo block for a typescript-demo code fence', async () => {
    await renderDocRoute('view');

    expect(
      screen.getByRole('heading', { name: 'Basic Usage' }),
    ).toBeInTheDocument();
    expect(screen.getByTitle('代码预览（仅展示）')).toBeInTheDocument();
  });

  it('renders the 404 document for an unknown component instead of crashing or rendering blank', async () => {
    await renderDocRoute('not-a-real-component');

    expect(
      screen.getByRole('heading', { level: 1, name: '404 Not Found' }),
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
