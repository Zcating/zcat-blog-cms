import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { IsArray, IsNotEmpty } from 'class-validator';

export class CreateArticleDto {
  @ApiProperty({
    description: '文章标题',
    example: '我的第一篇文章',
  })
  @IsNotEmpty({ message: '标题不能为空' })
  title: string;

  @ApiProperty({
    description: '文章摘要',
    example: '这是一篇关于技术分享的文章摘要',
  })
  @IsNotEmpty({ message: '摘要不能为空' })
  excerpt: string;

  @ApiProperty({
    description: '文章内容',
    example: '这里是文章的详细内容...',
  })
  @IsNotEmpty({ message: '内容不能为空' })
  content: string;

  @ApiPropertyOptional({
    description: '文章标签ID数组',
    example: [1, 2, 3],
    type: [Number],
  })
  @IsArray({ message: '标签ID数组必须是数组' })
  tagIds?: number[];
}
