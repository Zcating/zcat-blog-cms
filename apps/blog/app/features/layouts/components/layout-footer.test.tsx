import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { LayoutFooter } from './layout-footer';

describe('LayoutFooter', () => {
  it('renders copyright text', () => {
    render(<LayoutFooter />);
    expect(screen.getByText(/Zcat/)).toBeInTheDocument();
  });
});
