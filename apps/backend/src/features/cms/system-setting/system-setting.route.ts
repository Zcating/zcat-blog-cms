import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';

import { createResult, ResultCode } from '@backend/model';

import { UploadTokenDtoSchema } from './system-setting.schema';
import { systemSettingService } from './system-setting.service';

const systemSettingRoutes = new Hono().basePath('/api/cms/system-setting');

// GET /upload-token - 获取上传凭证
systemSettingRoutes.get(
  '/upload-token',
  zValidator('query', UploadTokenDtoSchema),
  async (c) => {
    try {
      const { type } = c.req.valid('query');
      const result = systemSettingService.getUploadToken(type);

      return c.json(
        createResult({
          code: ResultCode.Success,
          message: 'success',
          data: result,
        }),
      );
    } catch (error) {
      console.error('获取上传凭证失败', error);
      throw error;
    }
  },
);

export default systemSettingRoutes;
