import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePhotoDto {
  @ApiProperty({
    description: '照片名称',
    example: '美丽的风景',
  })
  name: string;

  @ApiProperty({
    description: '照片URL',
    example: '/uploads/photos/photo-123.jpg',
  })
  url: string;

  @ApiProperty({
    description: '缩略图URL',
    example: '/uploads/photos/thumbnails/photo-123-thumb.jpg',
  })
  thumbnailUrl: string;

  @ApiPropertyOptional({
    description: '所属相册ID',
    example: 1,
  })
  albumId?: number;
}
