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

import { TOOL_REGISTRY } from '../lib';
import { ToolboxHomePage } from './toolbox-home';

describe('ToolboxHomePage', () => {
  it('renders one card per registered tool, in registry order', () => {
    render(<ToolboxHomePage />);

    const links = screen.getAllByRole('link');

    expect(links).toHaveLength(TOOL_REGISTRY.length);
    expect(links.map((link) => link.getAttribute('href'))).toEqual(
      TOOL_REGISTRY.map((tool) => tool.path),
    );
    expect(screen.getAllByText('立即使用')).toHaveLength(TOOL_REGISTRY.length);
  });

  it('links every card to its own toolbox path', () => {
    render(<ToolboxHomePage />);

    for (const tool of TOOL_REGISTRY) {
      expect(screen.getByText(tool.name).closest('a')).toHaveAttribute(
        'href',
        tool.path,
      );
    }
  });

  it('renders no page heading', () => {
    render(<ToolboxHomePage />);

    expect(screen.queryByRole('heading', { level: 1 })).not.toBeInTheDocument();
  });
});
