import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { GalleryThumbnailList } from './gallery-thumbnail-list';

vi.mock('@zcat/ui', () => ({
  ZView: ({ children, className }: any) => (
    <div className={className}>{children}</div>
  ),
  ZImage: ({ src, alt, className }: any) => (
    <img src={src} alt={alt} className={className} data-testid="zimage" />
  ),
}));

describe('GalleryThumbnailList', () => {
  const items = [
    { id: '1', url: '/img1.jpg', name: 'Photo 1' },
    { id: '2', url: '/img2.jpg', name: 'Photo 2' },
  ];

  it('renders all thumbnail images', () => {
    render(
      <GalleryThumbnailList
        items={items}
        value={0}
        onValueChange={() => {}}
      />,
    );
    const images = screen.getAllByTestId('zimage');
    expect(images).toHaveLength(2);
    expect(images[0]).toHaveAttribute('src', '/img1.jpg');
  });

  it('highlights the active thumbnail', () => {
    const { container } = render(
      <GalleryThumbnailList
        items={items}
        value={1}
        onValueChange={() => {}}
      />,
    );
    const buttons = container.querySelectorAll('button');
    expect(buttons[1].className).toContain('ring-2');
    expect(buttons[0].className).not.toContain('ring-2');
  });
});
