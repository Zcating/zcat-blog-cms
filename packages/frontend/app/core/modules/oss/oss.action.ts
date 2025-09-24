import { PhotosApi, SystemSettingApi, UserApi } from '@cms/api';

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
    const { url, thumbnailUrl } = await uploadPhoto(values.image);

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
      const { url, thumbnailUrl } = await uploadPhoto(values.image);
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

  /**
   * 更新用户信息参数
   */
  interface UserInfo extends Omit<UserApi.UpdateUserInfoParams, 'avatar'> {
    avatar?: string | Blob | null;
  }

  /**
   * 更新用户信息
   * @param values 更新参数
   * @returns 用户信息
   */
  export async function updateUserInfo(values: UserInfo) {
    const params = {
      id: values.id,
      avatar: undefined,
      name: values.name,
      contact: values.contact,
      occupation: values.occupation,
      aboutMe: values.aboutMe,
      abstract: values.abstract,
    } as UserApi.UpdateUserInfoParams;

    if (values.avatar instanceof Blob) {
      params.avatar = await uploadAvatar(values.avatar);
    }

    return await UserApi.updateUserInfo(params);
  }

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
  async function uploadPhoto(image: Blob): Promise<UploadPhotoResult> {
    const imageFile = image as File;
    const { filename, extension, token } = await generateImageInfo(imageFile);

    const compressedImage = await qiniu.compressImage(imageFile, {
      maxWidth: 500,
      maxHeight: 500,
      quality: 0.6,
    });

    const url = `${filename}.${extension}`;
    const thumbnailUrl = `${filename}.thumbnail.${extension}`;

    await Promise.all([
      promiseFrom(qiniu.upload(imageFile, url, token)),
      promiseFrom(
        qiniu.upload(compressedImage.dist as File, thumbnailUrl, token),
      ),
    ]);

    return {
      url,
      thumbnailUrl: url,
    };
  }

  /**
   * 上传头像
   * @param image 头像
   * @returns {Promise<string>} 头像url
   */
  async function uploadAvatar(image: Blob): Promise<string> {
    const imageFile = image as File;
    const { filename, extension, token } = await generateImageInfo(imageFile);
    const compressedImage = await qiniu.compressImage(imageFile, {
      maxWidth: 300,
      maxHeight: 300,
      quality: 0.6,
    });
    const url = `${filename}.${extension}`;
    const urlObserver = qiniu.upload(compressedImage.dist as File, url, token);
    await promiseFrom(urlObserver);
    return url;
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
  async function generateImageInfo(image: File): Promise<ImageInfo> {
    const data = await SystemSettingApi.getUploadToken();
    const extension = image.name.split('.').pop();
    const filename = `${Date.now()}-${Math.floor(Math.random() * 10 ** 7)}`;

    return {
      filename: filename,
      extension: extension || '',
      token: data.uploadToken,
    };
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
