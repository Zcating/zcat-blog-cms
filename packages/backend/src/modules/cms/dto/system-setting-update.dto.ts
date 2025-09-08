import { IsString } from 'class-validator';

export class SystemSettingUpdateDto {
  @IsString()
  ossConfig: string;
}
