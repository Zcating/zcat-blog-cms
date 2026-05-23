import { ossService } from '../../../common';

export async function getUploadConfig(type: 'article' | 'photo', key: string) {
  const presignedUrl = await ossService.presignUploadUrl(type, key);
  return { presignedUrl };
}

export const systemSettingService = { getUploadConfig };
