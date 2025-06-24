import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateArticleDto {
  @ApiProperty({
    description: '文章标题',
    example: '我的第一篇文章',
  })
  title: string;

  @ApiProperty({
    description: '文章摘要',
    example: '这是一篇关于技术分享的文章摘要',
  })
  excerpt: string;

  @ApiProperty({
    description: '文章内容',
    example: '这里是文章的详细内容...',
  })
  content: string;

  @ApiPropertyOptional({
    description: '文章内容URL（用于文件上传）',
    example: '/uploads/articles/article-123.md',
  })
  contentUrl?: string;

  @ApiPropertyOptional({
    description: '创建用户ID',
    example: 1,
  })
  createByUserId?: number;

  @ApiPropertyOptional({
    description: '文章标签ID数组',
    example: [1, 2, 3],
    type: [Number],
  })
  tagIds?: number[];
}
