import { Type } from 'class-transformer';
import { IsObject, IsOptional, IsString } from 'class-validator';

class OssConfig {
  @IsString()
  accessKey: string;

  @IsString()
  secretKey: string;
}

export interface SystemSetting {
  ossConfig: OssConfig;
}

export class SystemSettingDto {
  @IsObject()
  @Type(() => OssConfig)
  ossConfig: OssConfig;
}

export class SystemSettingUpdateDto {
  @IsOptional()
  @IsObject()
  @Type(() => OssConfig)
  ossConfig?: OssConfig;
}
