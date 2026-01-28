import { HttpClient } from '../http/http-client';

import type { PhotosApi } from './photos-api';
import type { PaginateResult } from './types';

export namespace AlbumsApi {
  export interface PhotoAlbum {
    id: number;
    name: string;
    description: string;
    available: boolean;
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

  export interface GetPhotoAlbumsParams {
    page?: number;
    pageSize?: number;
  }

  export async function getPhotoAlbums(
    params?: GetPhotoAlbumsParams,
  ): Promise<PaginateResult<PhotoAlbum>> {
    return HttpClient.get('cms/photo-albums', params);
  }

  export async function getPhotoAlbum(id: number): Promise<PhotoAlbumDetail> {
    const detail = await HttpClient.get<PhotoAlbumDetail>(
      `cms/photo-albums/${id}`,
    );
    return detail;
  }

  export function createPhotoAlbum(
    params: CreatePhotoAlbumParams,
  ): Promise<PhotoAlbum> {
    return HttpClient.post('cms/photo-albums', params);
  }

  export function updatePhotoAlbum(
    params: UpdatePhotoAlbumParams,
  ): Promise<PhotoAlbum> {
    return HttpClient.post('cms/photo-albums/update', {
      id: params.id,
      name: params.name,
      description: params.description,
      available: params.available,
    });
  }

  export async function deletePhotoAlbum(id: number): Promise<void> {
    return await HttpClient.post(`cms/photo-albums/delete`, { id });
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
