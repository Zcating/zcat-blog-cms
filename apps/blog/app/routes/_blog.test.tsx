import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { useNavigateMock, useRouterStateMock } = vi.hoisted(() => ({
  useNavigateMock: vi.fn(),
  useRouterStateMock: vi.fn(),
}));

vi.mock('@tanstack/react-router', async () => {
  const actual = await vi.importActual<typeof import('@tanstack/react-router')>(
    '@tanstack/react-router',
  );
  return {
    ...actual,
    useNavigate: () => useNavigateMock,
    useRouterState: () => useRouterStateMock(),
    Outlet: () => <div data-testid="blog-layout-outlet" />,
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

// --- import after mocks ---

import { Route } from './_blog';

const MENU_TITLES = ['首页', '文章', '相册', '工具箱', '关于'];

describe('route component: /_blog layout', () => {
  beforeEach(() => {
    useRouterStateMock.mockReset();
    useNavigateMock.mockReset();
    useRouterStateMock.mockReturnValue('/post-board/7');
  });

  it('renders the menu, the outlet and the footer', () => {
    const Layout = Route.options.component;
    if (!Layout) throw new Error('layout route has no component');

    render(<Layout />);

    for (const title of MENU_TITLES) {
      expect(screen.getByText(title)).toBeInTheDocument();
    }
    expect(screen.getByTestId('blog-layout-outlet')).toBeInTheDocument();
    expect(
      screen.getByText('© 2025 Zcat. All rights reserved.'),
    ).toBeInTheDocument();
  });

  it('links every menu entry to its own path and marks the active one', () => {
    const Layout = Route.options.component;
    if (!Layout) throw new Error('layout route has no component');

    render(<Layout />);

    expect(screen.getByText('首页').closest('a')).toHaveAttribute('href', '/');
    expect(screen.getByText('文章').closest('a')).toHaveAttribute(
      'href',
      '/post-board',
    );
    expect(screen.getByText('文章')).toHaveClass('text-primary');
    expect(screen.getByText('相册')).toHaveClass(
      'text-muted-foreground',
      'hover:text-primary',
    );
  });
});
