import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ZAvatar } from './z-avatar';

describe('ZAvatar', () => {
  it('renders fallback text when image is absent', () => {
    render(<ZAvatar alt="Avatar" fallback="ZA" />);

    expect(screen.getByText('ZA')).toBeInTheDocument();
  });

  it('applies the small size class', () => {
    const { container } = render(
      <ZAvatar alt="Small avatar" fallback="SM" size="sm" />,
    );

    expect(container.firstChild).toHaveClass('w-24');
    expect(container.firstChild).toHaveClass('h-24');
  });
});
