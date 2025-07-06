import { HttpClient } from '../http-client';
import type { PhotosApi } from './photos-api';

export namespace AlbumsApi {
  export interface PhotoAlbum {
    id?: number;
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

  // PhotoAlbum API functions
  export async function getPhotoAlbums(): Promise<PhotoAlbum[]> {
    return await HttpClient.get<PhotoAlbum[]>('cms/photo-albums');
  }

  export async function getPhotoAlbum(id: number): Promise<PhotoAlbumDetail> {
    const detail = await HttpClient.get<PhotoAlbumDetail>(
      `cms/photo-albums/${id}`,
    );
    detail.photos = detail.photos.map((item) => {
      item.url = `/static/${item.url}`;
      return item;
    });
    return detail;
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
