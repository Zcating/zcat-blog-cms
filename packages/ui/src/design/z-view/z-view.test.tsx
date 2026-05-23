import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ZView } from './z-view';

describe('ZView', () => {
  it('renders children', () => {
    render(<ZView>内容</ZView>);

    expect(screen.getByText('内容')).toBeInTheDocument();
  });

  it('renders as a div element', () => {
    const { container } = render(<ZView>内容</ZView>);

    expect(container.querySelector('div.z-scrollbar')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<ZView className="custom-class">内容</ZView>);

    expect(container.querySelector('div')).toHaveClass('custom-class');
  });

  it('sets inline backgroundColor style', () => {
    const { container } = render(<ZView backgroundColor="#f0f0f0">内容</ZView>);

    const div = container.querySelector('div');
    expect(div?.style.backgroundColor).toBe('rgb(240, 240, 240)');
  });
});
