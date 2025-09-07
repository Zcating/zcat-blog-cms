import { isBlob, isBoolean } from '@cms/components';
import { HttpClient } from '../http/http-client';
import type { PhotosApi } from './photos-api';

export namespace AlbumsApi {
  export interface PhotoAlbum {
    id: number;
    name: string;
    description?: string;
    available?: boolean;
    cover?: PhotosApi.Photo;
    createdAt?: string;
    updatedAt?: string;
  }

  export interface PhotoAlbumDetail {
    id: number;
    name: string;
    description?: string;
    available?: boolean;
    coverId?: number;
    createdAt?: string;
    updatedAt?: string;
  }

  export interface CreatePhotoAlbumParams {
    name: string;
    description?: string;
    available?: boolean;
  }

  export interface UpdatePhotoAlbumParams {
    id: number;
    name?: string;
    description?: string;
    available?: boolean;
  }

  function transformPhotoAlbum<T extends { cover?: PhotosApi.Photo }>(
    album: T,
  ): T {
    if (album.cover) {
      album.cover.url = `${HttpClient.STATIC_URL}/${album.cover?.url}`;
      album.cover.thumbnailUrl = `${HttpClient.STATIC_URL}/${album.cover?.thumbnailUrl}`;
    }
    return album;
  }

  function transformPhotoAlbumDetail<
    T extends { cover?: PhotosApi.Photo; photos?: PhotosApi.Photo[] },
  >(album: T): T {
    if (album.cover) {
      album.cover.url = `${HttpClient.STATIC_URL}/${album.cover?.url}`;
      album.cover.thumbnailUrl = `${HttpClient.STATIC_URL}/${album.cover?.thumbnailUrl}`;
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
    return detail;
  }

  export async function createPhotoAlbum(
    params: CreatePhotoAlbumParams,
  ): Promise<PhotoAlbum> {
    return await HttpClient.post('cms/photo-albums', params);
  }

  export async function updatePhotoAlbum(
    params: UpdatePhotoAlbumParams,
  ): Promise<PhotoAlbum> {
    return await HttpClient.put(`cms/photo-albums/${params.id}`, {
      name: params.name,
      description: params.description,
      available: params.available,
    });
  }

  export async function deletePhotoAlbum(id: number): Promise<void> {
    return await HttpClient.del(`cms/photo-albums/${id}`);
  }

  export interface SetPhotoAlbumCoverParams {
    photoId: number;
    albumId: number;
  }

  /**
   * 设置相册封面
   * @param {SetPhotoAlbumCoverParams} params
   * @param {string} params.photoId 照片ID
   * @param {string} params.albumId 相册ID
   * @returns {Promise<void>}
   */
  export async function setPhotoAlbumCover(
    params: SetPhotoAlbumCoverParams,
  ): Promise<void> {
    return await HttpClient.post('cms/photo-albums/cover', params);
  }

  interface AddPhotosParams {
    albumId: number;
    photoIds: number[];
  }

  export async function addPhotos(params: AddPhotosParams): Promise<void> {
    return await HttpClient.post('cms/photo-albums/add-photos', params);
  }
}
