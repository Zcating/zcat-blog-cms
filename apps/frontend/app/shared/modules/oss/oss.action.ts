import Compressor from 'compressorjs';

import { ArticlesApi, PhotosApi, SystemSettingApi, UserApi } from '@cms/api';

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
 * 使用 compressorjs 压缩图片
 */
function compressImage(
  file: Blob,
  maxWidth: number,
  maxHeight: number,
  quality: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    new Compressor(file as File, {
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

  const [{ presignedUrl }, { presignedUrl: thumbnailPresignedUrl }] =
    await Promise.all([
      SystemSettingApi.getUploadUrl(key),
      SystemSettingApi.getUploadUrl(thumbnailKey),
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

  const { presignedUrl } = await SystemSettingApi.getUploadUrl(key);
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

    const { presignedUrl } = await SystemSettingApi.getUploadUrl(key);
    await uploadToOss(presignedUrl, compressedBlob);
    return key;
  });

  const keys = (await Promise.allSettled(promises))
    .filter((item) => item.status === 'fulfilled')
    .map((item) => item.value)
    .filter(isString);

  const imageurls = await ArticlesApi.uploadArticleImages(keys);

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
  async createPhoto(
    values: UploadPhotoParams,
  ): Promise<PhotosApi.Photo | void> {
    const result = await uploadPhotoFile(values.image);
    if (!result) {
      return;
    }

    return PhotosApi.createPhoto({
      name: values.name,
      url: result.url,
      thumbnailUrl: result.thumbnailUrl,
    });
  },

  /**
   * 创建相册照片
   */
  async createAlbumPhoto(
    params: UploadPhotoParams & { albumId: number },
  ): Promise<PhotosApi.Photo | void> {
    const result = await uploadPhotoFile(params.image);
    if (!result) {
      return;
    }

    return PhotosApi.createAlbumPhoto({
      name: params.name,
      url: result.url,
      thumbnailUrl: result.thumbnailUrl,
      albumId: params.albumId,
    });
  },

  /**
   * 更新照片
   */
  async updatePhoto(values: UpdatePhotoParams): Promise<PhotosApi.Photo> {
    const params: PhotosApi.UpdatePhotoParams = {
      id: values.id,
      name: values.name,
      albumId: values.albumId,
    };

    const result = await uploadPhotoFile(values.image);
    if (result) {
      params.url = result.url;
      params.thumbnailUrl = result.thumbnailUrl;
    }

    return await PhotosApi.updatePhoto(params);
  },

  /**
   * 删除照片
   */
  async deletePhoto(id: number) {
    await PhotosApi.deletePhoto(id);
  },

  /**
   * 更新用户信息
   */
  async updateUserInfo(values: UserApi.UpdateUserInfoParams) {
    const result = await uploadAvatar(values.avatar);
    return await UserApi.updateUserInfo({
      ...values,
      avatar: result,
    });
  },

  /**
   * 创建文章
   */
  async createArticle(values: ArticlesApi.Article) {
    const content = await uploadArticleImagesContent(values.content);
    return ArticlesApi.createArticle({
      ...values,
      content,
    });
  },

  /**
   * 更新文章
   */
  async updateArticle(values: ArticlesApi.Article) {
    const content = await uploadArticleImagesContent(values.content);
    return ArticlesApi.updateArticle({
      ...values,
      content,
    });
  },
};
