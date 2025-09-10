import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { safeNumber } from '@backend/utils';

import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreatePhotoDto {
  @ApiProperty({
    description: '照片名称',
    example: '美丽的风景',
  })
  @MinLength(1)
  @MaxLength(32)
  @IsNotEmpty({ message: '照片名称不能为空' })
  name: string;

  @ApiPropertyOptional({
    description: '所属相册ID',
    example: 1,
  })
  @IsOptional()
  @Type(() => safeNumber)
  albumId: number;

  @ApiPropertyOptional({
    description: '是否封面',
    example: false,
  })
  @IsOptional()
  @IsBoolean({ message: '是否封面必须是布尔值' })
  isCover?: boolean;

  @ApiPropertyOptional({
    description: '照片URL',
    example: 'https://example.com/photo.jpg',
  })
  @IsString()
  url: string;

  @ApiPropertyOptional({
    description: '照片缩略图URL',
    example: 'https://example.com/photo-thumbnail.jpg',
  })
  @IsString()
  thumbnailUrl: string;
}
