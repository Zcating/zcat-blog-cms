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
  key: z.string(),
});

export interface SystemSetting {
  ossConfig: OssConfig;
}

export type SystemSettingDto = z.infer<typeof SystemSettingDtoSchema>;
export type SystemSettingUpdateDto = z.infer<
  typeof SystemSettingUpdateDtoSchema
>;
export type UploadTokenDto = z.infer<typeof UploadTokenDtoSchema>;
