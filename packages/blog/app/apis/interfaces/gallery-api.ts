import { HttpClient } from "../http/http-client";
import dayjs from "dayjs";
export namespace GalleryApi {
  export interface Photo {
    id: string;
    name: string;
    url: string;
    thumbnailUrl: string;
  }

  export interface Gallery {
    id: string;
    name: string;
    description: string;
    cover?: Photo;
    createdAt: string;
    updatedAt: string;
  }

  export interface GalleryDetail extends Gallery {
    photos: Photo[];
  }

  interface GetPhotosParams {
    page: number;
    pageSize?: number;
  }

  /**
   * 获取相册列表
   * @param {GetPhotosParams} params 分页参数
   * @param {string} params.page 页码
   * @param {string} params.pageSize 每页数量
   * @returns {Promise<Pagination<Gallery>>} 相册列表
   */
  export async function getGalleries(
    params: GetPhotosParams,
  ): Promise<Pagination<Gallery>> {
    const pagination = await HttpClient.serverSideGet<Pagination>(
      "blog/gallery",
      {
        page: params.page,
        pageSize: params.pageSize ?? 8,
      },
    );
    return {
      ...pagination,
      data: pagination.data.map(transformGallery),
    };
  }

  /**
   * 获取相册详情
   * @param id 相册id
   * @returns {Promise<GalleryDetail>} 相册详情
   */
  export async function getGalleryDetail(id: string): Promise<GalleryDetail> {
    const gallery = await HttpClient.serverSideGet<GalleryDetail>(
      `blog/gallery/${id}`,
    );
    return {
      ...gallery,
      cover: transformPhoto(gallery.cover),
      photos: gallery.photos
        .map(transformPhoto)
        // 把封面图片放在前面
        .sort((a, b) => {
          return gallery.cover?.id === a.id ? -1 : 1;
        }),
    };
  }

  /**
   * 转换图片
   * @param photo 图片
   * @returns 图片
   */
  export function transformPhoto<T extends Photo | undefined>(photo: T): T {
    if (photo) {
      photo.url = `${HttpClient.STATIC_URL}/${photo.url}`;
      photo.thumbnailUrl = `${HttpClient.STATIC_URL}/${photo.thumbnailUrl}`;
    }
    return photo;
  }

  /**
   * 转换相册
   * @param gallery 相册
   * @returns 相册
   */
  export function transformGallery(gallery: Gallery): Gallery {
    gallery.cover = transformPhoto(gallery.cover);
    return gallery;
  }
}
