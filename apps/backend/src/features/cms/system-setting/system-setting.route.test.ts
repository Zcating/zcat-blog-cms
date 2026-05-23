import { Hono } from 'hono';
import { describe, expect, it, vi } from 'vitest';

const mockSettingService = vi.hoisted(() => ({
  getUploadConfig: vi.fn(),
}));

vi.mock('./system-setting.service', () => ({
  systemSettingService: mockSettingService,
}));

import systemSettingRoutes from './system-setting.route';

const createApp = () => {
  const app = new Hono();
  app.onError((err, c) => {
    return c.json({ code: 'ERR0006', message: err.message }, 200);
  });
  app.route('/', systemSettingRoutes);
  return app;
};

describe('systemSettingRoutes', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /system-setting/upload-config', () => {
    it('returns presignedUrl', async () => {
      mockSettingService.getUploadConfig.mockResolvedValue({
        presignedUrl:
          'http://localhost:9000/photos-bucket/test.jpg?presigned=abc',
      });
      const app = createApp();

      const res = await app.request(
        '/system-setting/upload-config?type=photo&key=test.jpg',
      );
      const body = await res.json();

      expect(body.code).toBe('0000');
      expect(body.data.presignedUrl).toBe(
        'http://localhost:9000/photos-bucket/test.jpg?presigned=abc',
      );
    });

    it('returns error on exception', async () => {
      mockSettingService.getUploadConfig.mockRejectedValue(new Error('fail'));
      const app = createApp();

      const res = await app.request(
        '/system-setting/upload-config?type=photo&key=test.jpg',
      );
      const body = await res.json();

      expect(body.code).toBe('ERR0006');
    });
  });
});
