import { Photo, PhotoAlbum } from '@backend/prisma';

export interface ReturnPhotoAlbumDto extends Omit<PhotoAlbum, 'coverId'> {
  cover?: Photo;
}
