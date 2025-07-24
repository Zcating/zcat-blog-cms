import { isBlob, isBoolean } from '@cms/components';
import { HttpClient } from '../http-client';
import type { PhotosApi } from './photos-api';

export namespace AlbumsApi {
  export interface PhotoAlbum {
    id: number;
    name: string;
    description?: string;
    cover?: PhotosApi.Photo;
    createdAt?: Date;
    updatedAt?: Date;
  }

  export interface PhotoAlbumDetail {
    id: number;
    name: string;
    description?: string;
    cover?: PhotosApi.Photo;
    photos: PhotosApi.Photo[];
    createdAt?: Date;
    updatedAt?: Date;
  }

  export interface CreatePhotoAlbumParams {
    name: string;
    description?: string;
  }

  export interface UpdatePhotoAlbumParams {
    name?: string;
  }

  function transformPhotoAlbum<T extends { cover?: PhotosApi.Photo }>(
    album: T,
  ): T {
    if (album.cover) {
      album.cover.url = `/static/${album.cover?.url}`;
      album.cover.thumbnailUrl = `/static/${album.cover?.thumbnailUrl}`;
    }
    return album;
  }

  function transformPhotoAlbumDetail<
    T extends { cover?: PhotosApi.Photo; photos?: PhotosApi.Photo[] },
  >(album: T): T {
    if (album.cover) {
      album.cover.url = `/static/${album.cover?.url}`;
      album.cover.thumbnailUrl = `/static/${album.cover?.thumbnailUrl}`;
    }
    if (album.photos) {
      album.photos = album.photos.map((item) => {
        item.url = `/static/${item.url}`;
        item.thumbnailUrl = `/static/${item.thumbnailUrl}`;
        item.isCover = item.id === album.cover?.id;
        return item;
      });
    }
    return album;
  }

  // PhotoAlbum API functions
  export async function getPhotoAlbums(): Promise<PhotoAlbum[]> {
    const albums = await HttpClient.get<PhotoAlbum[]>('cms/photo-albums');
    return albums.map(transformPhotoAlbum);
  }

  export async function getPhotoAlbum(id: number): Promise<PhotoAlbumDetail> {
    const detail = await HttpClient.get<PhotoAlbumDetail>(
      `cms/photo-albums/${id}`,
    );
    return transformPhotoAlbumDetail(detail);
  }

  export async function createPhotoAlbum(
    params: CreatePhotoAlbumParams,
  ): Promise<PhotoAlbum> {
    return await HttpClient.post('cms/photo-albums', params);
  }

  export async function updatePhotoAlbum(
    id: number,
    params: UpdatePhotoAlbumParams,
  ): Promise<PhotoAlbum> {
    return await HttpClient.put(`cms/photo-albums/${id}`, params);
  }

  export async function deletePhotoAlbum(id: number): Promise<void> {
    return await HttpClient.del(`cms/photo-albums/${id}`);
  }
}
