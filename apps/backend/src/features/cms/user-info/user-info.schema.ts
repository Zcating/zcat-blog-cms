import { z } from 'zod';

import { OssObjectKeySchema } from '@backend/model';

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
  avatar: OssObjectKeySchema,
  aboutMe: z.string(),
  abstract: z.string(),
});

export interface SystemSetting {
  ossConfig: OssConfig;
}

export type UserInfoDto = z.infer<typeof UserInfoSchema>;

export const UserInfoResponseDtoSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  contact: z.string().nullable(),
  occupation: z.string().nullable(),
  avatar: z.string().nullable(),
  signedAvatar: z.string(),
  aboutMe: z.string().nullable(),
  abstract: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  userId: z.number().int().nullable(),
});

export type UserInfoResponseDto = z.infer<typeof UserInfoResponseDtoSchema>;
