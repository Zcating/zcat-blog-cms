import { HttpClient } from '../http-client';

export namespace PhotosApi {
  export interface Photo {
    id?: number;
    name: string;
    url: string;
    createdAt?: Date;
    updatedAt?: Date;
  }

  export interface CreatePhotoParams {
    name: string;
    albumId: number;
    image: Blob;
  }

  export interface UpdatePhotoParams {
    name?: string;
    url?: string;
  }

  // Photo API functions
  export async function getPhotos(): Promise<Photo[]> {
    return await HttpClient.get('cms/photos');
  }

  export async function getPhoto(id: number): Promise<Photo> {
    return await HttpClient.get(`cms/photos/${id}`);
  }

  export async function createPhoto(params: CreatePhotoParams): Promise<Photo> {
    const formData = new FormData();
    formData.append('name', params.name);
    formData.append('image', params.image);
    formData.append('albumId', params.albumId.toString());

    return await HttpClient.post('cms/photos', formData);
  }

  export async function updatePhoto(
    id: number,
    params: UpdatePhotoParams,
  ): Promise<Photo> {
    return await HttpClient.put(`cms/photos/${id}`, params);
  }

  export async function deletePhoto(id: number): Promise<void> {
    return await HttpClient.del(`cms/photos/${id}`);
  }
}
