import { ApiPropertyOptional } from '@nestjs/swagger';

import { IsBoolean, IsNumber, IsString } from 'class-validator';

export class UpdateAlbumPhotoDto {
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
  name: string;

  @ApiPropertyOptional({
    description: '是否封面',
    example: true,
  })
  @IsBoolean()
  isCover: boolean;

  @ApiPropertyOptional({
    description: '所属相册ID',
    example: 2,
  })
  @IsNumber()
  albumId: number;
}

export class UpdateAlbumPhotoResultDto {
  id: number;

  name: string;

  url: string;

  isCover: boolean = false;

  thumbnailUrl: string;

  albumId: number;

  createdAt: Date;

  updatedAt: Date;
}
