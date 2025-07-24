import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePhotoAlbumDto {
  @ApiProperty({
    description: '相册名称',
    example: '旅行相册',
  })
  name: string;

  @ApiPropertyOptional({
    description: '封面照片ID',
    example: 1,
  })
  coverId?: number;

  @ApiPropertyOptional({
    description: '相册中的照片ID数组',
    example: [1, 2, 3],
    type: [Number],
  })
  photoIds?: number[];
}
