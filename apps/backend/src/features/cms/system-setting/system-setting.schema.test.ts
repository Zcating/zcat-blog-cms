import { describe, expect, it } from 'vitest';

import {
  SystemSettingDtoSchema,
  SystemSettingUpdateDtoSchema,
  UploadTokenDtoSchema,
} from './system-setting.schema';

describe('system-setting schema', () => {
  describe('SystemSettingDtoSchema', () => {
    it('accepts valid config', () => {
      const result = SystemSettingDtoSchema.safeParse({
        ossConfig: { accessKey: 'ak', secretKey: 'sk' },
      });
      expect(result.success).toBe(true);
    });

    it('rejects missing ossConfig', () => {
      const result = SystemSettingDtoSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe('SystemSettingUpdateDtoSchema', () => {
    it('accepts partial update', () => {
      const result = SystemSettingUpdateDtoSchema.safeParse({
        ossConfig: { accessKey: 'new-ak', secretKey: 'new-sk' },
      });
      expect(result.success).toBe(true);
    });

    it('accepts empty update', () => {
      const result = SystemSettingUpdateDtoSchema.safeParse({});
      expect(result.success).toBe(true);
    });
  });

  describe('UploadTokenDtoSchema', () => {
    it('accepts article type', () => {
      const result = UploadTokenDtoSchema.safeParse({ type: 'article' });
      expect(result.success).toBe(true);
    });

    it('accepts photo type', () => {
      const result = UploadTokenDtoSchema.safeParse({ type: 'photo' });
      expect(result.success).toBe(true);
    });

    it('rejects invalid type', () => {
      const result = UploadTokenDtoSchema.safeParse({ type: 'video' });
      expect(result.success).toBe(false);
    });
  });
});
