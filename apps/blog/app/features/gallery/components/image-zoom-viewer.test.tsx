import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ImageZoomViewer } from './image-zoom-viewer';

vi.mock('@zcat/ui', () => ({
  cn: (...inputs: any[]) => inputs.filter(Boolean).join(' '),
  ZImage: ({
    src,
    alt,
    className,
    style,
    draggable,
    onLoad,
    onClick,
  }: any) => {
    // Simulate load so displaySize gets computed
    setTimeout(() => onLoad?.({ currentTarget: { naturalWidth: 800, naturalHeight: 600 } }), 0);
    return (
      <img
        src={src}
        alt={alt}
        className={className}
        style={style}
        draggable={draggable}
        data-testid="zimage-zoom"
        onClick={onClick}
      />
    );
  },
}));

describe('ImageZoomViewer', () => {
  it('renders the zoomable image', () => {
    render(
      <ImageZoomViewer src="/large.jpg" alt="Zoomed" />,
    );
    const img = screen.getByTestId('zimage-zoom');
    expect(img).toHaveAttribute('src', '/large.jpg');
    expect(img).toHaveAttribute('alt', 'Zoomed');
  });
});
