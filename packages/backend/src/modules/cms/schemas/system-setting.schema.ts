import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

class OssConfig {
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

export interface SystemSetting {
  ossConfig: OssConfig;
}

export class SystemSettingDto extends createZodDto(SystemSettingDtoSchema) {
  ossConfig: OssConfig;
}

export class SystemSettingUpdateDto extends createZodDto(
  SystemSettingUpdateDtoSchema,
) {
  ossConfig?: OssConfig;
}
