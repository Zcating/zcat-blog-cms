import { ApiProperty } from '@nestjs/swagger';

import { Transform } from 'class-transformer';
import { IsOptional, IsString, IsDateString, IsNumber } from 'class-validator';

export class StatisticQueryDto {
  @ApiProperty({ description: '页面路径过滤', required: false })
  @IsOptional()
  @IsString()
  pagePath?: string;

  @ApiProperty({
    description: '开始日期',
    example: '2024-01-01',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({
    description: '结束日期',
    example: '2024-01-31',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({ description: '页码', example: 1, required: false, default: 1 })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value) || 1)
  page?: number = 1;

  @ApiProperty({
    description: '每页数量',
    example: 10,
    required: false,
    default: 10,
  })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value) || 10)
  limit?: number = 10;

  @ApiProperty({ description: 'IP地址过滤', required: false })
  @IsOptional()
  @IsString()
  ip?: string;

  @ApiProperty({ description: '浏览器过滤', required: false })
  @IsOptional()
  @IsString()
  browser?: string;

  @ApiProperty({ description: '操作系统过滤', required: false })
  @IsOptional()
  @IsString()
  os?: string;

  @ApiProperty({ description: '设备类型过滤', required: false })
  @IsOptional()
  @IsString()
  device?: string;
}
