import { describe, expect, it, vi } from 'vitest';

import { SystemSettingApi } from './system-setting-api';
import { HttpClient } from '../http/http-client';

vi.mock('../http/http-client', () => ({
  HttpClient: { get: vi.fn() },
}));

describe('SystemSettingApi', () => {
  it('getUploadToken calls HttpClient.get', async () => {
    vi.mocked(HttpClient.get).mockResolvedValueOnce({ uploadToken: 'token-123' });
    const result = await SystemSettingApi.getUploadToken('photo', 'img.jpg');
    expect(HttpClient.get).toHaveBeenCalledWith('cms/system-setting/upload-token', {
      type: 'photo',
      filename: 'img.jpg',
    });
    expect(result.uploadToken).toBe('token-123');
  });
});
