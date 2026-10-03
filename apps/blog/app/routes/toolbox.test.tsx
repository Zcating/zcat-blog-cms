import { render, screen } from '@testing-library/react';
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

// --- import after mocks ---

import { Route } from './toolbox';

const MENU_TITLES = ['首页', '文章', '相册', '工具箱', '关于'];
const SIDEBAR_LABELS = [
  '导航',
  '常用',
  'IP 查询',
  'Hash 计算',
  'RSA 加解密',
  'AES 加解密',
  '图片和 Base64 互转',
  '二维码生成',
  '身份证生成',
];

describe('route component: /toolbox layout', () => {
  beforeEach(() => {
    useRouterStateMock.mockReset();
    useRouterStateMock.mockReturnValue('/toolbox');
  });

  it('renders the sidebar, the page outlet and the footer', () => {
    const Layout = Route.options.component;
    if (!Layout) throw new Error('layout route has no component');

    render(<Layout />);

    expect(screen.getByTestId('toolbox-layout-outlet')).toBeInTheDocument();
    expect(
      screen.getByText('© 2025 Zcat. All rights reserved.'),
    ).toBeInTheDocument();
  });

  it('keeps every toolbox sidebar entry and points it at its own URL', () => {
    const Layout = Route.options.component;
    if (!Layout) throw new Error('layout route has no component');

    render(<Layout />);

    for (const label of SIDEBAR_LABELS) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
    expect(screen.getByText('导航').closest('a')).toHaveAttribute(
      'href',
      '/toolbox',
    );
    expect(screen.getByText('Hash 计算').closest('a')).toHaveAttribute(
      'href',
      '/toolbox/hash',
    );
    expect(screen.getByText('二维码生成').closest('a')).toHaveAttribute(
      'href',
      '/toolbox/qrcode-generator',
    );
  });

  it('keeps the main navigation above the sidebar and marks the active entry', () => {
    useRouterStateMock.mockReturnValue('/toolbox/hash');
    const Layout = Route.options.component;
    if (!Layout) throw new Error('layout route has no component');

    render(<Layout />);

    for (const title of MENU_TITLES) {
      expect(screen.getByText(title)).toBeInTheDocument();
    }
    expect(screen.getByText('工具箱').closest('a')).toHaveAttribute(
      'href',
      '/toolbox',
    );
    expect(screen.getByText('工具箱')).toHaveClass('text-primary');
    expect(screen.getByText('首页')).toHaveClass(
      'text-muted-foreground',
      'hover:text-primary',
    );
  });
});
