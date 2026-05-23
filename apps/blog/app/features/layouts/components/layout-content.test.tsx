import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { LayoutContent } from './layout-content';

vi.mock('@zcat/ui', () => ({
  ZView: ({ children, className }: any) => (
    <div className={className}>{children}</div>
  ),
}));

describe('LayoutContent', () => {
  it('renders children', () => {
    render(<LayoutContent>Hello Content</LayoutContent>);
    expect(screen.getByText('Hello Content')).toBeInTheDocument();
  });
});
