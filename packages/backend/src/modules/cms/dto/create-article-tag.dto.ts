import { ApiProperty } from '@nestjs/swagger';

import { IsNotEmpty } from 'class-validator';

export class CreateArticleTagDto {
  @ApiProperty({
    description: '标签名称',
    example: 'JavaScript',
  })
  @IsNotEmpty({ message: '标签名称不能为空' })
  name: string;
}
