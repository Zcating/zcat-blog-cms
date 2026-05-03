import { Hono } from 'hono';
import { describe, expect, it, vi } from 'vitest';

const mockSettingService = vi.hoisted(() => ({
  getUploadToken: vi.fn(),
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

  describe('GET /api/cms/system-setting/upload-token', () => {
    it('returns upload token', async () => {
      mockSettingService.getUploadToken.mockReturnValue({
        uploadToken: 'token',
      });
      const app = createApp();

      const res = await app.request(
        '/api/cms/system-setting/upload-token?type=article',
      );
      const body = await res.json();

      expect(body.code).toBe('0000');
      expect(body.data.uploadToken).toBe('token');
    });

    it('returns error on exception', async () => {
      mockSettingService.getUploadToken.mockImplementation(() => {
        throw new Error('fail');
      });
      const app = createApp();

      const res = await app.request(
        '/api/cms/system-setting/upload-token?type=article',
      );
      const body = await res.json();

      expect(body.code).toBe('ERR0006');
    });
  });
});
