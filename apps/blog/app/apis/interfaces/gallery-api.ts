export namespace GalleryApi {
  export interface Photo {
    id: string;
    name: string;
    url: string;
    signedUrl: string;
    signedThumbnailUrl: string;
    thumbnailUrl: string;
  }
}
