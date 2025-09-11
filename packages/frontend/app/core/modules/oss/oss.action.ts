import { PhotosApi, SystemSettingApi } from '@cms/api';

import * as qiniu from 'qiniu-js';
import type { Observable } from 'qiniu-js/esm/utils';

/**
 * OSS操作
 */
export namespace OssAction {
  /**
   * 创建照片参数
   */
  export interface CreatePhotoParams {
    name: string;
    albumId?: number;
    image: Blob;
  }

  /**
   * 创建照片
   * @param values 创建参数
   * @param  {string} values.name 照片名称
   * @param  {number} [values.albumId] 相册id
   * @param  {Blob} values.image 照片
   * @returns 照片
   */
  export async function createPhoto(
    values: CreatePhotoParams,
  ): Promise<PhotosApi.Photo> {
    const { url, thumbnailUrl } = await uploadImage(values.image);

    return PhotosApi.createPhoto({
      name: values.name,
      url,
      thumbnailUrl,
    });
  }

  /**
   * 更新照片参数
   */
  export interface UpdatePhotoParams {
    id: number;
    name?: string;
    albumId?: number;
    image?: string | Blob | null;
  }

  /**
   * 更新照片
   * @param {UpdatePhotoParams} values 更新参数
   * @param  {number} values.id 照片id
   * @param  {string} [values.name] 照片名称
   * @param  {number} [values.albumId] 相册id
   * @param  {string | Blob | null} [values.image] 照片
   * @returns 照片
   */
  export async function updatePhoto(
    values: UpdatePhotoParams,
  ): Promise<PhotosApi.Photo> {
    const params = {
      id: values.id,
      name: values.name,
      albumId: values.albumId,
    } as PhotosApi.UpdatePhotoParams;

    if (values.image instanceof Blob) {
      const { url, thumbnailUrl } = await uploadImage(values.image);
      params.url = url;
      params.thumbnailUrl = thumbnailUrl;
    }

    return await PhotosApi.updatePhoto(params);
  }

  /**
   * 删除照片
   * @param id 照片id
   */
  export async function deletePhoto(id: number) {
    await PhotosApi.deletePhoto(id);
  }

  async function uploadImage(image: Blob) {
    const imageFile = image as File;
    const data = await SystemSettingApi.getUploadToken();
    const extension = imageFile.name.split('.').pop();
    const filename = `${Date.now()}-${Math.floor(Math.random() * 10 ** 7)}`;
    const url = `${filename}.${extension}`;
    const urlObserver = qiniu.upload(imageFile, url, data.uploadToken);

    const compressedImage = await qiniu.compressImage(imageFile, {
      maxWidth: 500,
      maxHeight: 500,
      quality: 0.6,
    });
    const thumbnailUrl = `${filename}.thumbnail.${extension}`;
    const thumbnailObserver = qiniu.upload(
      compressedImage.dist as File,
      thumbnailUrl,
      data.uploadToken,
    );

    await Promise.all([
      promiseFrom(urlObserver),
      promiseFrom(thumbnailObserver),
    ]);

    return {
      url,
      thumbnailUrl,
    };
  }

  function promiseFrom(observer: Observable<any, any, any>) {
    return new Promise<void>((resolve, reject) => {
      observer.subscribe({
        next(res) {
          console.log(res);
        },
        error(err) {
          console.log(err);
          reject(err);
        },
        complete(res) {
          resolve(res);
        },
      });
    });
  }
}
