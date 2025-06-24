import { ApiProperty } from '@nestjs/swagger';

export class CreateArticleTagDto {
  @ApiProperty({
    description: '标签名称',
    example: 'JavaScript',
  })
  name: string;
}
