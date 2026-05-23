import { describe, expect, it, vi } from 'vitest';

import { AlbumsApi } from './albums-api';
import { HttpClient } from '../http/http-client';

vi.mock('../http/http-client', () => ({
  HttpClient: {
    get: vi.fn(),
    post: vi.fn(),
    del: vi.fn(),
  },
}));

describe('AlbumsApi', () => {
  it('getPhotoAlbums calls HttpClient.get', async () => {
    vi.mocked(HttpClient.get).mockResolvedValueOnce({ data: [], page: 1, pageSize: 10, totalPages: 0 });
    const result = await AlbumsApi.getPhotoAlbums({ page: 1 });
    expect(HttpClient.get).toHaveBeenCalledWith({ path: 'cms/photo-albums', params: { page: 1 } });
    expect(result.data).toEqual([]);
  });

  it('getPhotoAlbum calls HttpClient.get with id', async () => {
    vi.mocked(HttpClient.get).mockResolvedValueOnce({ id: 1, name: 'Album' });
    const result = await AlbumsApi.getPhotoAlbum(1);
    expect(HttpClient.get).toHaveBeenCalledWith({ path: 'cms/photo-albums/1' });
    expect(result.name).toBe('Album');
  });

  it('createPhotoAlbum calls HttpClient.post', async () => {
    vi.mocked(HttpClient.post).mockResolvedValueOnce({ id: 1, name: 'New' });
    await AlbumsApi.createPhotoAlbum({ name: 'New' });
    expect(HttpClient.post).toHaveBeenCalledWith({ path: 'cms/photo-albums', params: { name: 'New' } });
  });

  it('deletePhotoAlbum calls HttpClient.del', async () => {
    vi.mocked(HttpClient.del).mockResolvedValueOnce(undefined);
    await AlbumsApi.deletePhotoAlbum(1);
    expect(HttpClient.del).toHaveBeenCalledWith({ path: 'cms/photo-albums/1' });
  });
});
