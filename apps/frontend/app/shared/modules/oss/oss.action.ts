import Compressor from 'compressorjs';

import {
  createArticle,
  updateArticle,
  uploadArticleImages,
} from '@cms/server/articles';
import type {
  CreateArticleInput,
  UpdateArticleInput,
} from '@cms/server/articles/schemas';
import {
  createAlbumPhoto,
  createPhoto,
  deletePhoto,
  updatePhoto,
} from '@cms/server/photos';
import type { Photo } from '@cms/server/photos/schemas';
import { getSystemSettingUploadUrlServerFn } from '@cms/server/system-setting';
import { updateCurrentUser } from '@cms/server/users';
import type { UpdateUserInfoBody } from '@cms/server/users/users-helpers';

import { CommonRegex, isString } from '../../utils';

/**
 * 上传文件到 MinIO（通过预签名 URL）
 */
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

/**
 * 使用 compressorjs 压缩图片
 */
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

/**
 * 从 blob URL 获取图片文件
 */
async function fetchImageFile(url?: string): Promise<Blob | undefined> {
  if (!url || !url.startsWith('blob:')) {
    return undefined;
  }
  const response = await fetch(url);
  return response.blob();
}

/**
 * 上传照片文件（原图+缩略图）
 */
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

/**
 * 上传头像
 */
async function uploadAvatar(image?: string): Promise<string | undefined> {
  const imageFile = await fetchImageFile(image);
  if (!imageFile) {
    return undefined;
  }

  const extension = imageFile.type.split('/').pop() || 'jpg';
  const filename = `${Date.now()}-${Math.floor(Math.random() * 10 ** 7)}`;
  const key = `user/${filename}.${extension}`;

  const compressedBlob = await compressImage(imageFile, 1000, 1000, 0.6);

  const presignedUrl = await getPresignedUploadUrl(key);
  await uploadToOss(presignedUrl, compressedBlob);

  return key;
}

/**
 * 上传文章图片，替换 markdown 中的 blob URL
 */
async function uploadArticleImagesContent(content: string): Promise<string> {
  const rawStrings = content.matchAll(CommonRegex.MARKDOWN_IMAGE_REGEX);
  const blobStrings = Array.from(rawStrings)
    .map((item) => item[2] ?? '')
    .filter((item) => item.startsWith('blob:'));

  const promises = blobStrings.map(async (item) => {
    const imageFile = await fetchImageFile(item);
    if (!imageFile) {
      return undefined;
    }

    const extension = imageFile.type.split('/').pop() || 'jpg';
    const filename = `${Date.now()}-${Math.floor(Math.random() * 10 ** 7)}`;
    const key = `articles/${filename}.${extension}`;

    const compressedBlob = await compressImage(imageFile, 1000, 1000, 0.6);

    const presignedUrl = await getPresignedUploadUrl(key);
    await uploadToOss(presignedUrl, compressedBlob);
    return key;
  });

  const keys = (await Promise.allSettled(promises))
    .filter((item) => item.status === 'fulfilled')
    .map((item) => item.value)
    .filter(isString);

  const imageurls = await uploadArticleImages({ data: { images: keys } });

  return content.replace(
    CommonRegex.MARKDOWN_IMAGE_REGEX,
    (match: string, p1: string, p2: string) => {
      const index = blobStrings.indexOf(p2);
      if (index === -1) {
        return match;
      }
      return `![${p1}](${imageurls[index]})`;
    },
  );
}

/**
 * OSS操作
 */
export const OssAction = {
  /**
   * 创建照片
   */
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

  /**
   * 创建相册照片
   */
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

  /**
   * 更新照片
   */
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

  /**
   * 删除照片
   */
  async deletePhoto(id: number) {
    await deletePhoto({ data: { id } });
  },

  /**
   * 更新用户信息
   */
  async updateUserInfo(values: UpdateUserInfoBody) {
    const result = await uploadAvatar(values.avatar);
    return updateCurrentUser({
      data: {
        ...values,
        avatar: result,
      },
    });
  },

  /**
   * 创建文章
   */
  async createArticle(values: CreateArticleInput) {
    const content = await uploadArticleImagesContent(values.content);
    return createArticle({
      data: {
        ...values,
        content,
      },
    });
  },

  /**
   * 更新文章
   */
  async updateArticle(values: UpdateArticleInput) {
    const content =
      values.content === undefined
        ? undefined
        : await uploadArticleImagesContent(values.content);
    return updateArticle({
      data: {
        ...values,
        content,
      },
    });
  },
};
