import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { GallerySidebarNav } from './gallery-sidebar-nav';

vi.mock('@zcat/ui', () => ({
  ZView: ({ children, className }: any) => (
    <div className={className}>{children}</div>
  ),
  Button: ({ children, disabled, onClick }: any) => (
    <button disabled={disabled} onClick={onClick}>
      {children}
    </button>
  ),
}));

vi.mock('lucide-react', () => ({
  ArrowLeft: () => <span data-testid="arrow-left" />,
  ArrowRight: () => <span data-testid="arrow-right" />,
}));

describe('GallerySidebarNav', () => {
  it('renders navigation buttons and label', () => {
    render(
      <GallerySidebarNav
        value={0}
        count={5}
        onValueChange={() => {}}
      />,
    );
    expect(screen.getByText('导航')).toBeInTheDocument();
  });

  it('disables previous button at first index', () => {
    render(
      <GallerySidebarNav
        value={0}
        count={5}
        onValueChange={() => {}}
      />,
    );
    const buttons = screen.getAllByRole('button');
    expect(buttons[0]).toBeDisabled();
  });

  it('disables next button at last index', () => {
    render(
      <GallerySidebarNav
        value={4}
        count={5}
        onValueChange={() => {}}
      />,
    );
    const buttons = screen.getAllByRole('button');
    expect(buttons[1]).toBeDisabled();
  });
});
