import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ZImage } from './z-image';

describe('ZImage', () => {
  it('renders an img element with src and alt', () => {
    const { container } = render(<ZImage src="/photo.jpg" alt="A photo" />);

    const img = container.querySelector('img');
    expect(img).toHaveAttribute('src', '/photo.jpg');
    expect(img).toHaveAttribute('alt', 'A photo');
  });

  it('applies object-cover class by default', () => {
    const { container } = render(<ZImage src="/test.jpg" alt="test" />);

    const img = container.querySelector('img');
    expect(img).toHaveClass('object-cover');
  });

  it('applies contain class when contentMode is contain', () => {
    const { container } = render(
      <ZImage src="/test.jpg" alt="test" contentMode="contain" />,
    );

    const img = container.querySelector('img');
    expect(img).toHaveClass('object-contain');
  });
});
