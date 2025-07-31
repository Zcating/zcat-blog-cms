import { IsInt } from 'class-validator';

export class SetCoverDto {
  @IsInt({ message: '相册ID必须是整数' })
  albumId: number;

  @IsInt({ message: '照片ID必须是整数' })
  photoId: number;
}
