import { ApiProperty } from '@nestjs/swagger';

export class ReturnArticleDto {
  @ApiProperty({ description: '文章ID' })
  id: number;

  @ApiProperty({ description: '文章标题' })
  title: string;

  @ApiProperty({ description: '文章摘要' })
  excerpt: string;

  @ApiProperty({ description: '创建时间' })
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  updatedAt: Date;

  // @ApiProperty({ description: '创建用户' })
  // createByUser: UserInfo;

  // @ApiProperty({ description: '文章标签' })
  // tags: ArticleTag[];
}
