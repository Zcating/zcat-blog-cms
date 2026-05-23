import { describe, expect, it, vi } from 'vitest';

import { apiKeyPromption } from './api-key-promption';
import { AiApi } from '../apis/ai-api';

vi.mock('@zcat/ui', () => ({
  ZNotification: {
    error: vi.fn(),
  },
  ZDialog: {
    confirm: vi.fn().mockResolvedValue(false),
    show: vi.fn(),
  },
}));

vi.mock('../apis/ai-api', () => ({
  AiApi: {
    checkApiKey: vi.fn(),
    test: vi.fn(),
    saveApiKey: vi.fn(),
  },
}));

describe('apiKeyPromption', () => {
  it('returns null when no model is given', async () => {
    const result = await apiKeyPromption(undefined);
    expect(result).toBeNull();
  });
});
