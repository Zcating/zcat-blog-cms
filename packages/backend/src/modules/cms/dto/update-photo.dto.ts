import { ApiPropertyOptional } from '@nestjs/swagger';

import { IsNumber, IsString } from 'class-validator';

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
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: '相册ID',
    example: 1,
  })
  @IsNumber()
  albumId?: number;
}
