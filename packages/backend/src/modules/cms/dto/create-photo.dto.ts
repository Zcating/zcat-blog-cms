import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { safeNumber } from '@backend/utils';

import { Type } from 'class-transformer';
import { MaxLength, MinLength } from 'class-validator';

export class CreatePhotoDto {
  @ApiProperty({
    description: '照片名称',
    example: '美丽的风景',
  })
  @Type(() => String)
  @MinLength(1)
  @MaxLength(32)
  name: string;

  @ApiPropertyOptional({
    description: '所属相册ID',
    example: 1,
  })
  @Type(() => safeNumber)
  albumId: number;

  @ApiPropertyOptional({
    description: '是否封面',
    example: false,
  })
  isCover?: boolean;
}
