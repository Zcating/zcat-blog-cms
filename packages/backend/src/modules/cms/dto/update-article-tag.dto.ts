import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateArticleTagDto {
  @ApiPropertyOptional({
    description: '标签名称',
    example: 'TypeScript',
  })
  name?: string;
}
