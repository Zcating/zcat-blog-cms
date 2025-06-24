import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdatePhotoDto {
  @ApiPropertyOptional({
    description: '照片名称',
    example: '美丽的风景（已更新）',
  })
  name?: string;

  @ApiPropertyOptional({
    description: '照片URL',
    example: '/uploads/photos/photo-123-updated.jpg',
  })
  url?: string;

  @ApiPropertyOptional({
    description: '所属相册ID',
    example: 2,
  })
  albumId?: number;
}
