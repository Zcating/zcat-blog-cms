import { render, screen } from '@testing-library/react';
import { Link } from 'react-router';
import { describe, expect, it } from 'vitest';

vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router');
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

import ToolboxHomePage from './home.page';

describe('ToolboxHomePage', () => {
  it('renders toolbox entries and links', () => {
    render(<ToolboxHomePage />);

    expect(screen.getByText('Markdown 转 HTML')).toBeInTheDocument();
    expect(screen.getByText('JSON 查看器')).toBeInTheDocument();
    expect(screen.getAllByText('立即使用')).toHaveLength(6);
  });
});
