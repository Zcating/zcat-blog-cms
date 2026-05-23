import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { LayoutHeader } from './layout-header';

vi.mock('@zcat/ui', () => ({
  ZStickyHeader: ({ children, className }: any) => (
    <div className={className}>{children}</div>
  ),
  ZView: ({ children, className }: any) => (
    <div className={className}>{children}</div>
  ),
  ZNavigationMenu: ({ options, renderItem }: any) => (
    <nav>{options.map((o: any, i: number) => renderItem(o, i))}</nav>
  ),
  Separator: ({ className }: any) => <hr className={className} />,
}));

vi.mock('react-router', () => ({
  Link: ({ to, children, className }: any) => (
    <a href={to} className={className}>
      {children}
    </a>
  ),
  useLocation: () => ({ pathname: '/' }),
}));

describe('LayoutHeader', () => {
  const options = [
    { to: '/', title: '首页' },
    { to: '/about', title: '关于' },
  ];

  it('renders navigation links', () => {
    render(<LayoutHeader options={options} />);
    expect(screen.getByText('首页')).toBeInTheDocument();
    expect(screen.getByText('关于')).toBeInTheDocument();
  });

  it('renders prefix if provided', () => {
    render(<LayoutHeader options={options} prefix={<span>LOGO</span>} />);
    expect(screen.getByText('LOGO')).toBeInTheDocument();
  });
});
