import { HttpClient } from '../http/http-client';
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
    return HttpClient.serverSideGet<Pagination>('blog/gallery', {
      page: params.page,
      pageSize: params.pageSize ?? 8,
    });
  }

  /**
   * 获取相册详情
   * @param id 相册id
   * @returns {Promise<GalleryDetail>} 相册详情
   */
  export async function getGalleryDetail(id: string): Promise<GalleryDetail> {
    return HttpClient.serverSideGet<GalleryDetail>(`blog/gallery/${id}`);
  }
}
