import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ZStickyHeader } from './z-sticky-header';

describe('ZStickyHeader', () => {
  it('renders children', () => {
    render(<ZStickyHeader>导航栏</ZStickyHeader>);

    expect(screen.getByText('导航栏')).toBeInTheDocument();
  });

  it('renders as a header element', () => {
    const { container } = render(<ZStickyHeader>内容</ZStickyHeader>);

    expect(container.querySelector('header')).toBeInTheDocument();
  });
});
