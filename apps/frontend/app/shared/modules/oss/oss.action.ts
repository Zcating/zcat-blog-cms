import * as qiniu from 'qiniu-js';

import { ArticlesApi, PhotosApi, SystemSettingApi, UserApi } from '@cms/api';

import { CommonRegex, isString } from '../../utils';

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
    image: string;
  }

  /**
   * 创建照片
   * @param values 创建参数
   * @param  {string} values.name 照片名称
   * @param  {number} [values.albumId] 相册id
   * @param  {string} values.image 照片
   * @returns 照片
   */
  export async function createPhoto(
    values: CreatePhotoParams,
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
  }

  /**
   * 创建照片参数
   */
  export interface CreateAlbumPhotoParams {
    name: string;
    image: string;
    albumId: number;
  }

  /**
   * 创建相册照片
   * @param params 创建参数
   * @param  {string} params.name 照片名称
   * @param  {string} params.image 照片
   * @param  {number} [params.albumId] 相册id
   * @returns 照片
   */
  export async function createAlbumPhoto(
    params: CreateAlbumPhotoParams,
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
  }

  /**
   * 更新照片参数
   */
  export interface UpdatePhotoParams {
    id: number;
    name?: string;
    albumId?: number;
    image?: string;
  }

  /**
   * 更新照片
   * @param {UpdatePhotoParams} values 更新参数
   * @param  {number} values.id 照片id
   * @param  {string} [values.name] 照片名称
   * @param  {number} [values.albumId] 相册id
   * @param  {string} [values.image] 照片
   * @returns 照片
   */
  export async function updatePhoto(
    values: UpdatePhotoParams,
  ): Promise<PhotosApi.Photo> {
    const params: PhotosApi.UpdatePhotoParams = {
      id: values.id,
      name: values.name,
      albumId: values.albumId,
    };

    // 更新照片
    const result = await uploadPhotoFile(values.image);
    if (result) {
      params.url = result.url;
      params.thumbnailUrl = result.thumbnailUrl;
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

  /**
   * 更新用户信息
   * @param values 更新参数
   * @returns 用户信息
   */
  export async function updateUserInfo(values: UserApi.UpdateUserInfoParams) {
    values.avatar = await uploadAvatar(values.avatar);
    return await UserApi.updateUserInfo(values);
  }

  // interface Article extends

  /**
   * 创建文章
   * @param values 创建参数
   * @param  {string} values.name 文章名称
   * @param  {string} values.excerpt 文章摘要
   * @param  {string} values.content 文章内容
   * @returns 文章
   */
  export async function createArticle(values: ArticlesApi.Article) {
    const content = await uploadArticleImagesContent(values.content);
    return ArticlesApi.createArticle({
      ...values,
      content,
    });
  }

  /**
   * 更新文章
   * @param values 更新参数
   * @param  {string} values.name 文章名称
   * @param  {string} values.excerpt 文章摘要
   * @param  {string} values.content 文章内容
   * @returns 文章
   */
  export async function updateArticle(values: ArticlesApi.Article) {
    const content = await uploadArticleImagesContent(values.content);
    return ArticlesApi.updateArticle({
      ...values,
      content,
    });
  }

  // export async function updloadArticleImages(images: string[]) {
  //   return await uploadArticleImages(images);
  // }

  /**
   * 上传照片结果
   */
  interface UploadPhotoResult {
    url: string;
    thumbnailUrl: string;
  }
  /**
   *
   * @param image 图片
   * @param thumbnailable 是否生成缩略图
   * @returns {Promise<UploadPhotoResult>} 图片url
   */
  async function uploadPhotoFile(
    image?: string,
  ): Promise<UploadPhotoResult | undefined> {
    const imageFile = await fetchImageFile(image);
    if (!imageFile) {
      return undefined;
    }
    const { filename, extension, token } = await generateImageInfo(
      'photo',
      imageFile,
    );

    const compressedImage = await qiniu.compressImage(imageFile as File, {
      maxWidth: 500,
      maxHeight: 500,
      quality: 0.6,
    });

    const [url, thumbnailUrl] = await Promise.all([
      uploadToOss({
        file: imageFile,
        url: `photos/${filename}.${extension}`,
        token,
      }),
      uploadToOss({
        file: compressedImage.dist,
        url: `photos/${filename}.thumbnail.${extension}`,
        token,
      }),
    ]);

    return {
      url,
      thumbnailUrl,
    };
  }

  /**
   * 上传头像
   * @param image 头像
   * @returns {Promise<string>} 头像url
   */
  async function uploadAvatar(image?: string): Promise<string | undefined> {
    const imageFile = await fetchImageFile(image);
    if (!imageFile) {
      return undefined;
    }
    const { filename, extension, token } = await generateImageInfo(
      'photo',
      imageFile,
    );
    const compressedImage = await qiniu.compressImage(imageFile as File, {
      maxWidth: 1000,
      maxHeight: 1000,
      quality: 0.6,
    });

    return await uploadToOss({
      file: compressedImage.dist as File,
      url: `user/${filename}.${extension}`,
      token,
    });
  }

  /**
   * 上传文章图片
   * @param image 文章图片
   * @returns 文章图片url
   */
  async function uploadArticleImagesContent(content: string): Promise<string> {
    const rawStrings = content.matchAll(CommonRegex.MARKDOWN_IMAGE_REGEX);
    const blobStrings = Array.from(rawStrings)
      .map((item) => item[2] ?? '')
      .filter((item) => item.startsWith('blob:'));

    // 并行上传图片
    const promises = blobStrings.map(async (item) => {
      const imageFile = await fetchImageFile(item);
      if (!imageFile) {
        return undefined;
      }

      const info = await generateImageInfo('article', imageFile);
      const compressedImage = await qiniu.compressImage(imageFile as File, {
        maxWidth: 1000,
        maxHeight: 1000,
        quality: 0.6,
      });
      return await uploadToOss({
        file: compressedImage.dist as File,
        url: `articles/${info.filename}.${info.extension}`,
        token: info.token,
      });
    });
    // 并行上传图片并过滤失败的
    const images = (await Promise.allSettled(promises))
      .filter((item) => item.status === 'fulfilled')
      .map((item) => item.value)
      .filter(isString);

    const imageurls = await ArticlesApi.uploadArticleImages(images);

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
   *
   * @param {string} url
   * @returns
   */
  async function fetchImageFile(url?: string): Promise<Blob | undefined> {
    if (!url || !url.startsWith('blob:')) {
      return undefined;
    }
    const response = await fetch(url);
    return response.blob();
  }

  /**
   * 图片信息
   */
  interface ImageInfo {
    filename: string;
    extension: string;
    token: string;
  }

  /**
   * 生成图片信息
   * @param image 图片
   * @returns {Promise<ImageInfo>} 图片信息
   */
  async function generateImageInfo(
    type: 'article' | 'photo',
    image: Blob,
  ): Promise<ImageInfo> {
    const data = await SystemSettingApi.getUploadToken(type);
    const extension = image.type.split('/').pop();
    const filename = `${Date.now()}-${Math.floor(Math.random() * 10 ** 7)}`;

    return {
      filename: filename,
      extension: extension || '',
      token: data.uploadToken,
    };
  }
}

interface UploadToOssParams {
  file: File | Blob;
  url: string;
  token: string;
}
/**
 * 上传图片到OSS
 * @param {UploadToOssParams} params 上传参数
 * @param {File | Blob} params.file 图片文件
 * @param {string} params.url 目标文件名
 * @param {string} params.token 上传凭证
 * @returns 图片url
 */
async function uploadToOss({
  file,
  url,
  token,
}: UploadToOssParams): Promise<string> {
  await promiseFrom(qiniu.upload(file as File, url, token));
  return url;
}

/**
 * 从可观察对象创建Promise
 * @param observer 可观察对象
 * @returns {Promise<void>} 当可观察对象完成时解析，否则拒绝
 */
function promiseFrom(observer: Observable<any, any, any>): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    observer.subscribe({
      next(res) {
        // console.log(res);
      },
      error(err: Error) {
        reject(err);
      },
      complete(res) {
        resolve(res);
      },
    });
  });
}
