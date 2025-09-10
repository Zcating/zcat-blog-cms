import { PhotosApi, SystemSettingApi } from '@cms/api';

import * as qiniu from 'qiniu-js';
import type { Observable } from 'qiniu-js/esm/utils';

export namespace OssAction {
  export async function init() {}

  export interface CreatePhotoParams {
    name: string;
    albumId?: number;
    image: Blob;
  }

  export async function upload(
    values: CreatePhotoParams,
  ): Promise<PhotosApi.Photo> {
    const data = await SystemSettingApi.getUploadToken();
    const imageFile = values.image as File;
    const extension = imageFile.name.split('.').pop();
    const filename = `${Date.now()}-${Math.floor(Math.random() * 10 ** 7)}`;
    const url = `${filename}.${extension}`;
    const urlObserver = qiniu.upload(imageFile, url, data.uploadToken);

    const compressedImage = await qiniu.compressImage(imageFile, {
      maxWidth: 1000,
      maxHeight: 1000,
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

    return PhotosApi.createPhoto({
      name: values.name,
      url,
      thumbnailUrl,
    });
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
