import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import * as qiniu from 'qiniu';

import { createResult, ResultCode } from '@backend/model';

import { ossService } from '../../../services';

import { UploadTokenDtoSchema } from './system-setting.schema';

const systemSettingRoutes = new Hono().basePath('/api/cms/system-setting');

// GET /upload-token - 获取上传凭证
systemSettingRoutes.get(
  '/upload-token',
  zValidator('query', UploadTokenDtoSchema),
  async (c) => {
    try {
      const { type } = c.req.valid('query');

      console.log(`开始获取上传凭证: ${type}`);

      const accessKey = process.env.OSS_ACCESS_KEY ?? '';
      const secretKey = process.env.OSS_SECRET_KEY ?? '';
      const bucket = ossService.getBucket(type);

      const mac = new qiniu.auth.digest.Mac(accessKey, secretKey);
      const putPolicy = new qiniu.rs.PutPolicy({
        scope: bucket,
        expires: 60,
      });

      const uploadToken = putPolicy.uploadToken(mac);

      console.log('成功获取上传凭证');

      return c.json(
        createResult({
          code: ResultCode.Success,
          message: 'success',
          data: {
            uploadToken,
          },
        }),
      );
    } catch (error) {
      console.error('获取上传凭证失败', error);
      throw error;
    }
  },
);

export default systemSettingRoutes;
