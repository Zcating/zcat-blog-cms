import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { PhotoPoster } from './photo-poster';

vi.mock('@zcat/ui', () => ({
  ZView: ({ children, className }: any) => (
    <div className={className}>{children}</div>
  ),
  ZImage: ({ src, alt, className }: any) => (
    <img src={src} alt={alt} className={className} data-testid="zimage" />
  ),
}));

describe('PhotoPoster', () => {
  it('renders photo image with name as alt text', () => {
    render(
      <PhotoPoster
        photo={{ id: '1', name: 'Sunset', url: '/sunset.jpg', thumbnailUrl: '/thumb.jpg' }}
      />,
    );
    const img = screen.getByTestId('zimage');
    expect(img).toHaveAttribute('src', '/sunset.jpg');
    expect(img).toHaveAttribute('alt', 'Sunset');
  });
});

describe('PhotoPoster.Cover', () => {
  it('renders cover with photo, name and description', () => {
    render(
      <PhotoPoster.Cover
        photo={{ id: '1', name: 'Album', url: '/cover.jpg', thumbnailUrl: '/thumb.jpg' }}
        name="Album Name"
        description="A great album"
      />,
    );
    expect(screen.getByText('Album Name')).toBeInTheDocument();
    expect(screen.getByText('A great album')).toBeInTheDocument();
  });
});
