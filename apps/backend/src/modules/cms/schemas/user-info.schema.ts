import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

interface OssConfig {
  accessKey: string;
  secretKey: string;
}

export const UserInfoSchema = z.object({
  name: z.string().min(1, '用户名不能为空'),
  contact: z.object({
    email: z.email('请输入有效的邮箱地址'),
    github: z.string(),
  }),
  occupation: z.string(),
  avatar: z.string(),
  aboutMe: z.string(),
  abstract: z.string(),
});

export interface SystemSetting {
  ossConfig: OssConfig;
}

export class UserInfoDto extends createZodDto(UserInfoSchema) {}
