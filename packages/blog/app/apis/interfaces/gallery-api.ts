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
    return pagination;
  }

  export async function getGalleryDetail(id: string): Promise<GalleryDetail> {
    const gallery = await HttpClient.serverSideGet<GalleryDetail>(
      `blog/gallery/${id}`,
    );
    return {
      ...gallery,
      cover: transformPhoto(gallery.cover),
      photos: gallery.photos.map(transformPhoto),
    };
  }

  export function transformPhoto<T extends Photo | undefined>(photo: T): T {
    if (photo) {
      photo.url = `${HttpClient.STATIC_URL}/${photo.url}`;
      photo.thumbnailUrl = `${HttpClient.STATIC_URL}/${photo.thumbnailUrl}`;
    }
    return photo;
  }
}
