import { ApiPropertyOptional } from '@nestjs/swagger';

import { IsNumber, IsString } from 'class-validator';

export class UpdateAlbumDto {
  @ApiPropertyOptional({
    description: '相册名称',
    example: '相册（已更新）',
  })
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: '相册描述',
    example: '这是一个更新后的相册描述',
  })
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: '封面照片ID',
    example: 2,
  })
  @IsNumber()
  coverId?: number;

  @ApiPropertyOptional({
    description: '相册中的照片ID数组',
    example: [1, 2, 3, 4],
    type: [Number],
  })
  @IsNumber({}, { each: true })
  photoIds?: number[];
}
