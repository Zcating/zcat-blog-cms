import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ZQRCode } from './z-qrcode';

describe('ZQRCode', () => {
  it('renders an SVG QR code with the given value', () => {
    const { container } = render(<ZQRCode value="https://example.com" />);

    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders wrapper with default size', () => {
    const { container } = render(<ZQRCode value="test" />);

    const wrapper = container.querySelector('div');
    expect(wrapper).toBeInTheDocument();
    expect(container.querySelector('svg')?.getAttribute('width')).toBe('128');
  });

  it('accepts custom size', () => {
    const { container } = render(<ZQRCode value="test" size={256} />);

    expect(container.querySelector('svg')?.getAttribute('width')).toBe('256');
  });
});
