import { ApiPropertyOptional } from '@nestjs/swagger';

import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class UpdateAlbumDto {
  @ApiPropertyOptional({
    description: '相册ID',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  id?: number;

  @ApiPropertyOptional({
    description: '相册名称',
    example: '相册（已更新）',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: '相册描述',
    example: '这是一个更新后的相册描述',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: '相册是否可用',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  available?: boolean;

  @ApiPropertyOptional({
    description: '封面照片ID',
    example: 2,
  })
  @IsOptional()
  @IsNumber()
  coverId?: number;

  @ApiPropertyOptional({
    description: '相册中的照片ID数组',
    example: [1, 2, 3, 4],
    type: [Number],
  })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  photoIds?: number[];
}
