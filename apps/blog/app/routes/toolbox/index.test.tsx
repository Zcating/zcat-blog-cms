import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@tanstack/react-router', async () => {
  const actual = await vi.importActual<typeof import('@tanstack/react-router')>(
    '@tanstack/react-router',
  );
  return {
    ...actual,
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

import { Route } from './index';

describe('ToolboxHomePage', () => {
  it('renders toolbox entries and links', () => {
    const ToolboxHomePage = Route.options.component;
    if (!ToolboxHomePage) throw new Error('route has no component');

    render(<ToolboxHomePage />);

    expect(screen.getByText('Markdown 转 HTML')).toBeInTheDocument();
    expect(screen.getByText('JSON 查看器')).toBeInTheDocument();
    expect(screen.getAllByText('立即使用')).toHaveLength(6);
  });

  it('points every entry at its own toolbox URL', () => {
    const ToolboxHomePage = Route.options.component;
    if (!ToolboxHomePage) throw new Error('route has no component');

    render(<ToolboxHomePage />);

    expect(screen.getByText('Markdown 转 HTML').closest('a')).toHaveAttribute(
      'href',
      '/toolbox/markdown-to-html',
    );
    expect(screen.getByText('JSON 查看器').closest('a')).toHaveAttribute(
      'href',
      '/toolbox/json-viewer',
    );
    expect(screen.getByText('IP 查询').closest('a')).toHaveAttribute(
      'href',
      '/toolbox/ip-lookup',
    );
    expect(screen.getByText('图片和 Base64 互转').closest('a')).toHaveAttribute(
      'href',
      '/toolbox/base64-to-image',
    );
  });
});
