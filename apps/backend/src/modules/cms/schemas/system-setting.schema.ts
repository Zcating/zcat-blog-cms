import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

interface OssConfig {
  accessKey: string;
  secretKey: string;
}

export const OssConfigSchema = z.object({
  accessKey: z.string(),
  secretKey: z.string(),
});

export const SystemSettingDtoSchema = z.object({
  ossConfig: OssConfigSchema,
});

export const SystemSettingUpdateDtoSchema = z.object({
  ossConfig: OssConfigSchema.optional(),
});

export const UploadTokenDtoSchema = z.object({
  type: z.enum(['article', 'photo']),
});

export interface SystemSetting {
  ossConfig: OssConfig;
}

export class SystemSettingDto extends createZodDto(SystemSettingDtoSchema) {}

export class SystemSettingUpdateDto extends createZodDto(
  SystemSettingUpdateDtoSchema,
) {}

export class UploadTokenDto extends createZodDto(UploadTokenDtoSchema) {}
