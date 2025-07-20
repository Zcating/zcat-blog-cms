import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePageStatisticsDto {
  @ApiProperty({
    description: '页面路径',
    example: '/articles/123',
  })
  pagePath: string;

  @ApiPropertyOptional({
    description: '页面标题',
    example: '我的第一篇文章',
  })
  pageTitle?: string;

  @ApiPropertyOptional({
    description: '访客IP地址',
    example: '192.168.1.1',
  })
  visitorIp?: string;

  @ApiPropertyOptional({
    description: '用户代理',
    example: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  })
  userAgent?: string;

  @ApiPropertyOptional({
    description: '来源页面',
    example: 'https://google.com',
  })
  referrer?: string;
}
