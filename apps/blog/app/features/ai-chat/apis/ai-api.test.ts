import { describe, expect, it, vi } from 'vitest';

import { AiApi } from './ai-api';

describe('AiApi', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('saveApiKey / getApiKey / deleteApiKey', () => {
    it('saveApiKey stores the key trimmed', () => {
      AiApi.saveApiKey('deepseek', ' my-key ');
      expect(localStorage.getItem('model-deepseek-api-key')).toBe('my-key');
    });

    it('saveApiKey throws on empty key', () => {
      expect(() => AiApi.saveApiKey('deepseek', '')).toThrow();
      expect(() => AiApi.saveApiKey('deepseek', '   ')).toThrow();
    });

    it('getApiKey returns empty string when not set', () => {
      expect(AiApi.getApiKey('deepseek')).toBe('');
    });

    it('getApiKey returns stored key', () => {
      localStorage.setItem('model-deepseek-api-key', 'stored-key');
      expect(AiApi.getApiKey('deepseek')).toBe('stored-key');
    });

    it('deleteApiKey removes the key', () => {
      localStorage.setItem('model-deepseek-api-key', 'val');
      AiApi.deleteApiKey('deepseek');
      expect(localStorage.getItem('model-deepseek-api-key')).toBeNull();
    });
  });

  describe('chat', () => {
    it('returns a handler with create and abort', () => {
      vi.stubGlobal('fetch', vi.fn());
      localStorage.setItem('model-deepseek-api-key', 'test-key');

      const handler = AiApi.chat({
        modelName: 'deepseek',
        messages: [{ role: 'user', content: 'hi' }],
        deepThinking: false,
      });

      expect(handler).toHaveProperty('create');
      expect(handler).toHaveProperty('abort');
      expect(typeof handler.create).toBe('function');
      expect(typeof handler.abort).toBe('function');
    });
  });

  describe('API_MODELS', () => {
    it('contains deepseek model', () => {
      const names = AiApi.API_MODELS.map((m) => m.value);
      expect(names).toContain('deepseek');
    });
  });
});
