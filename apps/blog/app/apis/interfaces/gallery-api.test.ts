import { describe, expect, it, vi } from 'vitest';

import { GalleryApi } from './gallery-api';
import { HttpClient } from '../http/http-client';

vi.mock('../http/http-client', () => ({
  HttpClient: {
    serverSideGet: vi.fn(),
  },
}));

describe('GalleryApi', () => {
  it('getGalleries calls with page and default pageSize', async () => {
    vi.mocked(HttpClient.serverSideGet).mockResolvedValueOnce({
      data: [],
      totalPages: 0,
      page: 1,
      pageSize: 8,
    });

    const result = await GalleryApi.getGalleries({ page: 1 });
    expect(HttpClient.serverSideGet).toHaveBeenCalledWith('blog/gallery', {
      page: 1,
      pageSize: 8,
    });
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(8);
  });

  it('getGalleries passes custom pageSize', async () => {
    vi.mocked(HttpClient.serverSideGet).mockResolvedValueOnce({
      data: [],
      totalPages: 0,
      page: 2,
      pageSize: 16,
    });

    await GalleryApi.getGalleries({ page: 2, pageSize: 16 });
    expect(HttpClient.serverSideGet).toHaveBeenCalledWith('blog/gallery', {
      page: 2,
      pageSize: 16,
    });
  });

  it('getGalleryDetail calls with album id', async () => {
    vi.mocked(HttpClient.serverSideGet).mockResolvedValueOnce({
      id: 'album-1',
      name: 'Album',
      photos: [],
    });

    const result = await GalleryApi.getGalleryDetail('album-1');
    expect(HttpClient.serverSideGet).toHaveBeenCalledWith(
      'blog/gallery/album-1',
    );
    expect(result.name).toBe('Album');
  });
});
