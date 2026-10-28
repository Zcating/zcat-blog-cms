import { render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { useRouterStateMock } = vi.hoisted(() => ({
  useRouterStateMock: vi.fn(),
}));

vi.mock('@tanstack/react-router', async () => {
  const actual = await vi.importActual<typeof import('@tanstack/react-router')>(
    '@tanstack/react-router',
  );
  return {
    ...actual,
    useRouterState: () => useRouterStateMock(),
    Outlet: () => <div data-testid="toolbox-layout-outlet" />,
    Link: ({
      children,
      to,
      ...props
    }: {
      children: React.ReactNode;
      to: string;
    }) => (
      <a href={to} {...props}>
        {children}
      </a>
    ),
  };
});

import { TOOL_REGISTRY } from '../lib';
import { ToolboxLayoutRoute } from './toolbox-layout';

const MENU = [
  { title: '首页', to: '/' },
  { title: '文章', to: '/post-board' },
  { title: '相册', to: '/gallery' },
  { title: '工具箱', to: '/toolbox' },
  { title: '关于', to: '/about' },
];

const FOOTER_TEXT = '© 2025 Zcat. All rights reserved.';

function renderLayout(pathname: string) {
  useRouterStateMock.mockReturnValue(pathname);
  return render(<ToolboxLayoutRoute />);
}

describe('ToolboxLayoutRoute', () => {
  beforeEach(() => {
    useRouterStateMock.mockReset();
  });

  it('renders the main navigation, the page outlet and the footer', () => {
    renderLayout('/toolbox');

    expect(screen.getByTestId('toolbox-layout-outlet')).toBeInTheDocument();
    expect(screen.getByText(FOOTER_TEXT)).toBeInTheDocument();

    const banner = screen.getByRole('banner');
    for (const item of MENU) {
      expect(
        within(banner).getByRole('link', { name: item.title }),
      ).toHaveAttribute('href', item.to);
    }
  });

  it('marks the current section in the main navigation', () => {
    renderLayout(TOOL_REGISTRY[0].path);

    const banner = screen.getByRole('banner');
    const active = within(banner).getByRole('link', { name: '工具箱' });
    const inactive = within(banner).getByRole('link', { name: '首页' });

    expect(active.getAttribute('class')).not.toBe(
      inactive.getAttribute('class'),
    );
  });

  it('renders no toolbox sidebar', () => {
    renderLayout('/toolbox');

    expect(screen.queryByText('导航')).toBeNull();
    expect(screen.queryByText('常用')).toBeNull();
  });

  it('keeps the footer after the outlet and outside any sidebar', () => {
    renderLayout('/toolbox');

    const footer = screen.getByText(FOOTER_TEXT).closest('footer');
    const outlet = screen.getByTestId('toolbox-layout-outlet');

    expect(footer).not.toBeNull();
    expect(
      footer!.compareDocumentPosition(outlet) &
        Node.DOCUMENT_POSITION_PRECEDING,
    ).toBeTruthy();
    expect(footer!.closest('[data-slot="sidebar-wrapper"]')).toBeNull();
  });

  it.each(TOOL_REGISTRY.map((tool) => [tool.name, tool.path]))(
    'renders a two-level breadcrumb on %s',
    (name, path) => {
      renderLayout(path);

      const breadcrumb = screen.getByRole('navigation', { name: 'breadcrumb' });

      expect(within(breadcrumb).getAllByRole('listitem')).toHaveLength(2);
      expect(
        within(breadcrumb).getByRole('link', { name: '工具箱' }),
      ).toHaveAttribute('href', '/toolbox');

      const current = within(breadcrumb).getByText(name);
      expect(current).toHaveAttribute('aria-current', 'page');
      expect(current.closest('a')).toBeNull();
    },
  );

  it.each(TOOL_REGISTRY.map((tool) => [tool.name, tool.path]))(
    'renders the breadcrumb before the outlet on %s',
    (_name, path) => {
      renderLayout(path);

      const breadcrumb = screen.getByRole('navigation', { name: 'breadcrumb' });
      const outlet = screen.getByTestId('toolbox-layout-outlet');

      expect(
        breadcrumb.compareDocumentPosition(outlet) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    },
  );

  it.each(['/toolbox', '/toolbox/'])('renders no breadcrumb on %s', (path) => {
    renderLayout(path);

    expect(screen.queryByRole('navigation', { name: 'breadcrumb' })).toBeNull();
  });
});
