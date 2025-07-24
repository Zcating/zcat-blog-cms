import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { IsNumber, IsString, MaxLength, MinLength } from 'class-validator';

export class CreatePhotoDto {
  @ApiProperty({
    description: '照片名称',
    example: '美丽的风景',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(32)
  name: string;

  @ApiPropertyOptional({
    description: '所属相册ID',
    example: 1,
  })
  @IsNumber()
  albumId?: number;

  @ApiPropertyOptional({
    description: '是否封面',
    example: false,
  })
  isCover?: boolean;
}
