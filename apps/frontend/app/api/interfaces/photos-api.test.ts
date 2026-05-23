import { describe, expect, it, vi } from 'vitest';

import { PhotosApi } from './photos-api';
import { HttpClient } from '../http/http-client';

vi.mock('../http/http-client', () => ({
  HttpClient: {
    get: vi.fn(),
    post: vi.fn(),
    del: vi.fn(),
  },
}));

describe('PhotosApi', () => {
  it('getPhotos calls HttpClient.get', async () => {
    vi.mocked(HttpClient.get).mockResolvedValueOnce({ data: [], page: 1, pageSize: 20, totalPages: 0 });
    const result = await PhotosApi.getPhotos({ albumId: 1 });
    expect(HttpClient.get).toHaveBeenCalledWith({
      path: 'cms/photos',
      params: { albumId: 1, page: 1, pageSize: 20 },
    });
    expect(result.data).toEqual([]);
  });

  it('createPhoto calls HttpClient.post', async () => {
    vi.mocked(HttpClient.post).mockResolvedValueOnce({ id: 1, name: 'Photo' });
    await PhotosApi.createPhoto({ name: 'Photo', url: '/img.jpg', thumbnailUrl: '/thumb.jpg' });
    expect(HttpClient.post).toHaveBeenCalledWith({
      path: 'cms/photos/create',
      params: { name: 'Photo', url: '/img.jpg', thumbnailUrl: '/thumb.jpg' },
    });
  });

  it('deletePhoto calls HttpClient.del', async () => {
    vi.mocked(HttpClient.del).mockResolvedValueOnce(undefined);
    await PhotosApi.deletePhoto(1);
    expect(HttpClient.del).toHaveBeenCalledWith({ path: 'cms/photos/1' });
  });
});
