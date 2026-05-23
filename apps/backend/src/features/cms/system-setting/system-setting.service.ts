import { ossService } from '../../../common';

export async function getUploadConfig(key: string) {
  const presignedUrl = await ossService.presignUploadUrl(key);
  return { presignedUrl };
}

export const systemSettingService = { getUploadConfig };
