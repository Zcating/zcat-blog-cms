import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ZNavigationMenu } from './z-navigation-menu';

const options = [
  { to: '/a', title: '页面A' },
  { to: '/b', title: '页面B' },
];

describe('ZNavigationMenu', () => {
  it('renders all navigation items', () => {
    render(
      <ZNavigationMenu
        options={options}
        renderItem={(item) => <a href={item.to}>{item.title}</a>}
      />,
    );

    expect(screen.getByText('页面A')).toBeInTheDocument();
    expect(screen.getByText('页面B')).toBeInTheDocument();
  });

  it('renders links with correct href', () => {
    render(
      <ZNavigationMenu
        options={options}
        renderItem={(item) => <a href={item.to}>{item.title}</a>}
      />,
    );

    const link = screen.getByText('页面A').closest('a');
    expect(link).toHaveAttribute('href', '/a');
  });
});
