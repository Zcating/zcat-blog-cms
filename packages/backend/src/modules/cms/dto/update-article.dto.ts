import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateArticleDto {
  @ApiPropertyOptional({
    description: '文章标题',
    example: '我的第一篇文章（已更新）',
  })
  title?: string;

  @ApiPropertyOptional({
    description: '文章摘要',
    example: '这是一篇关于技术分享的文章摘要（已更新）',
  })
  excerpt?: string;

  @ApiPropertyOptional({
    description: '文章内容',
    example: '这里是文章的详细内容...（已更新）',
  })
  content?: string;

  @ApiPropertyOptional({
    description: '文章标签ID数组',
    example: [1, 2, 4],
    type: [Number],
  })
  tagIds?: number[];
}
