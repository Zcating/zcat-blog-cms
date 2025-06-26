import { HttpClient } from '../http-client';

export namespace AlbumsApi {
  export interface Photo {
    id?: number;
    name: string;
    url: string;
    createdAt?: Date;
    updatedAt?: Date;
  }

  export interface PhotoAlbum {
    id?: number;
    name: string;
    description?: string;
    cover?: Photo;
    createdAt?: Date;
    updatedAt?: Date;
  }

  export interface PhotoAlbumDetail {
    id: number;
    name: string;
    description?: string;
    cover?: Photo;
    photos: Photo[];
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
    return await HttpClient.get('cms/photo-albums');
  }

  export async function getPhotoAlbum(id: number): Promise<PhotoAlbumDetail> {
    return await HttpClient.get(`cms/photo-albums/${id}`);
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
