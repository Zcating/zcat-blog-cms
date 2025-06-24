import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdatePhotoAlbumDto {
  @ApiPropertyOptional({
    description: '相册名称',
    example: '相册（已更新）',
  })
  name?: string;

  @ApiPropertyOptional({
    description: '封面照片ID',
    example: 2,
  })
  coverId?: number;

  @ApiPropertyOptional({
    description: '相册中的照片ID数组',
    example: [1, 2, 3, 4],
    type: [Number],
  })
  photoIds?: number[];
}
