import { HttpClient } from '../http/http-client';

export namespace PhotosApi {
  export interface Photo {
    id: number;
    name: string;
    url: string;
    thumbnailUrl: string;
    albumId?: number;
    isCover?: boolean;
    createdAt?: string;
    updatedAt?: string;
  }

  export interface CreatePhotoParams {
    name: string;
    url: string;
    thumbnailUrl: string;
  }

  export interface CreateAlbumPhotoParams {
    name: string;
    albumId: number;
    url: string;
    thumbnailUrl: string;
  }

  export interface UpdatePhotoParams {
    id: number;
    name?: string;
    url?: string;
    thumbnailUrl?: string;
    albumId?: number;
    isCover?: boolean;
  }

  // Photo API functions
  export async function getPhotos(albumId?: number): Promise<Photo[]> {
    return HttpClient.get<Photo[]>('cms/photos', { albumId });
  }

  export async function getEmptyAlbumPhotos(): Promise<Photo[]> {
    return HttpClient.get<Photo[]>('cms/photos/empty-album');
  }

  export async function getPhoto(id: number): Promise<Photo> {
    return HttpClient.get<Photo>(`cms/photos/detail?id=${id}`);
  }

  export async function createPhoto(params: CreatePhotoParams): Promise<Photo> {
    return HttpClient.post('cms/photos/create', params);
  }

  export async function updatePhoto(params: UpdatePhotoParams): Promise<Photo> {
    return HttpClient.post(`cms/photos/update`, params);
  }

  export async function deletePhoto(id: number): Promise<void> {
    return await HttpClient.post(`cms/photos/delete`, { id });
  }

  export async function createAlbumPhoto(
    params: PhotosApi.CreateAlbumPhotoParams,
  ): Promise<PhotosApi.Photo> {
    return HttpClient.post('cms/photos/create/with-album', params);
  }

  export async function updateAlbumPhoto(
    params: PhotosApi.UpdatePhotoParams,
  ): Promise<PhotosApi.Photo> {
    return HttpClient.post(`cms/photos/update/with-album`, params);
  }
}
