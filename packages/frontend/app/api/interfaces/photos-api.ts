import { isBlob } from '@cms/components';
import { HttpClient } from '../http-client';

export namespace PhotosApi {
  export interface Photo {
    id: number;
    name: string;
    url: string;
    albumId: number;
    thumbnailUrl: string;
    createdAt?: Date;
    updatedAt?: Date;
  }

  export interface CreatePhotoParams {
    name: string;
    albumId?: number;
    image: Blob;
  }

  export interface UpdatePhotoParams {
    id: number;
    name?: string;
    image?: string | Blob | null;
    albumId?: number;
  }

  function transformPhoto(photo: Photo): Photo {
    photo.url = `/static/${photo.url}`;
    photo.thumbnailUrl = `/static/${photo.thumbnailUrl}`;
    return photo;
  }

  // Photo API functions
  export async function getPhotos(): Promise<Photo[]> {
    const photos = await HttpClient.get<Photo[]>('cms/photos');
    return photos.map(transformPhoto);
  }

  export async function getPhoto(id: number): Promise<Photo> {
    const photo = await HttpClient.get<Photo>(`cms/photos/${id}`);
    return transformPhoto(photo);
  }

  export async function createPhoto(params: CreatePhotoParams): Promise<Photo> {
    const formData = new FormData();
    formData.append('name', params.name);
    formData.append('image', params.image);
    if (params.albumId) {
      formData.append('albumId', params.albumId.toString());
    }

    return transformPhoto(await HttpClient.post('cms/photos', formData));
  }

  export async function updatePhoto(
    params: UpdatePhotoParams,
  ): Promise<Photo | null> {
    const formData = new FormData();
    formData.append('id', params.id.toString());
    if (params.name) {
      formData.append('name', params.name);
    }
    if (params.image) {
      formData.append('image', params.image);
    }
    if (params.albumId) {
      formData.append('albumId', params.albumId.toString());
    }

    return transformPhoto(await HttpClient.post(`cms/photos/update`, formData));
  }

  export async function deletePhoto(id: number): Promise<void> {
    return await HttpClient.del(`cms/photos/${id}`);
  }
}
