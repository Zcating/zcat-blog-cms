import Compressor from 'compressorjs';

import {
  createAlbumPhoto,
  createPhoto,
  deletePhoto,
  updatePhoto,
} from '@cms/server/photos';
import type { Photo } from '@cms/server/photos/schemas';
import { getSystemSettingUploadUrlServerFn } from '@cms/server/system-setting';

async function uploadToOss(presignedUrl: string, file: Blob): Promise<void> {
  const response = await fetch(presignedUrl, {
    method: 'PUT',
    body: file,
  });
  if (!response.ok) {
    throw new Error(`Upload failed: ${response.status}`);
  }
}

/**
 * 向服务端换取对象的预签名上传地址
 *
 * 走服务端函数而非直连后端：预签名地址的签发需要携带会话 Cookie，
 * 而浏览器侧无法读取 HttpOnly Cookie。大文件本体仍由浏览器直接
 * `PUT` 到对象存储，不会经过服务端转发。
 */
async function getPresignedUploadUrl(key: string): Promise<string> {
  const result = await getSystemSettingUploadUrlServerFn({
    data: { key },
  });
  return result.presignedUrl;
}

function compressImage(
  file: Blob,
  maxWidth: number,
  maxHeight: number,
  quality: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const compressor = new Compressor(file as File, {
      maxWidth,
      maxHeight,
      quality,
      success(result: Blob) {
        resolve(result);
      },
      error(err: Error) {
        reject(err);
      },
    });
    void compressor;
  });
}

interface UploadPhotoResult {
  url: string;
  thumbnailUrl: string;
}

interface UploadPhotoParams {
  name: string;
  image: string;
  albumId?: number;
}

interface UpdatePhotoParams {
  id: number;
  name?: string;
  albumId?: number;
  image?: string;
}

async function fetchImageFile(url?: string): Promise<Blob | undefined> {
  if (!url || !url.startsWith('blob:')) {
    return undefined;
  }
  const response = await fetch(url);
  return response.blob();
}

async function uploadPhotoFile(
  image?: string,
): Promise<UploadPhotoResult | undefined> {
  const imageFile = await fetchImageFile(image);
  if (!imageFile) {
    return undefined;
  }

  const extension = imageFile.type.split('/').pop() || 'jpg';
  const filename = `${Date.now()}-${Math.floor(Math.random() * 10 ** 7)}`;
  const key = `photos/${filename}.${extension}`;
  const thumbnailKey = `photos/${filename}.thumbnail.${extension}`;

  const compressedBlob = await compressImage(imageFile, 500, 500, 0.6);

  const [presignedUrl, thumbnailPresignedUrl] = await Promise.all([
    getPresignedUploadUrl(key),
    getPresignedUploadUrl(thumbnailKey),
  ]);

  await Promise.all([
    uploadToOss(presignedUrl, imageFile),
    uploadToOss(thumbnailPresignedUrl, compressedBlob),
  ]);

  return { url: key, thumbnailUrl: thumbnailKey };
}

export const OssAction = {
  async createPhoto(values: UploadPhotoParams): Promise<Photo | void> {
    const result = await uploadPhotoFile(values.image);
    if (!result) {
      return;
    }

    return createPhoto({
      data: {
        name: values.name,
        url: result.url,
        thumbnailUrl: result.thumbnailUrl,
      },
    });
  },

  async createAlbumPhoto(
    params: UploadPhotoParams & { albumId: number },
  ): Promise<Photo | void> {
    const result = await uploadPhotoFile(params.image);
    if (!result) {
      return;
    }

    return createAlbumPhoto({
      data: {
        name: params.name,
        url: result.url,
        thumbnailUrl: result.thumbnailUrl,
        albumId: params.albumId,
      },
    });
  },

  async updatePhoto(values: UpdatePhotoParams): Promise<Photo> {
    const data: {
      id: number;
      name?: string;
      albumId?: number;
      url?: string;
      thumbnailUrl?: string;
    } = {
      id: values.id,
      name: values.name,
      albumId: values.albumId,
    };

    const result = await uploadPhotoFile(values.image);
    if (result) {
      data.url = result.url;
      data.thumbnailUrl = result.thumbnailUrl;
    }

    return await updatePhoto({ data });
  },

  async deletePhoto(id: number) {
    await deletePhoto({ data: { id } });
  },
};
