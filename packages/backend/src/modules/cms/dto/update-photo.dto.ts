import { ApiPropertyOptional } from '@nestjs/swagger';

import { IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdatePhotoDto {
  @ApiPropertyOptional({
    description: '照片ID',
    example: 1,
  })
  @IsNumber()
  id: number;

  @ApiPropertyOptional({
    description: '照片名称',
    example: '美丽的风景（已更新）',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: '相册ID',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  albumId?: number;

  @ApiPropertyOptional({
    description: '照片URL',
    example: 'https://example.com/photo.jpg',
  })
  @IsOptional()
  @IsString()
  url?: string;

  @ApiPropertyOptional({
    description: '照片缩略图URL',
    example: 'https://example.com/photo-thumbnail.jpg',
  })
  @IsOptional()
  @IsString()
  thumbnailUrl?: string;
}
