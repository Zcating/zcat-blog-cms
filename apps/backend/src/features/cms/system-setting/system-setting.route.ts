import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';

import { createResult, ResultCode } from '@backend/model';
import { logger } from '@backend/utils';

import { UploadTokenDtoSchema } from './system-setting.schema';
import { systemSettingService } from './system-setting.service';

const systemSettingRoutes = new Hono().basePath('/system-setting');

// GET /upload-config - 获取上传配置（预签名URL）
systemSettingRoutes.get(
  '/upload-config',
  zValidator('query', UploadTokenDtoSchema),
  async (c) => {
    try {
      const { key } = c.req.valid('query');
      const result = await systemSettingService.getUploadConfig(key);

      return c.json(
        createResult({
          code: ResultCode.Success,
          message: 'success',
          data: result,
        }),
      );
    } catch (error) {
      logger.error('获取上传配置失败', error);
      throw error;
    }
  },
);

export default systemSettingRoutes;
