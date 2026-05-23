import { describe, expect, it, vi } from 'vitest';

import { ArticleTagsApi } from './article-tags-api';
import { HttpClient } from '../http/http-client';

vi.mock('../http/http-client', () => ({
  HttpClient: {
    get: vi.fn(),
    post: vi.fn(),
    del: vi.fn(),
  },
}));

describe('ArticleTagsApi', () => {
  it('getArticleTags calls HttpClient.get', async () => {
    vi.mocked(HttpClient.get).mockResolvedValueOnce([]);
    await ArticleTagsApi.getArticleTags();
    expect(HttpClient.get).toHaveBeenCalledWith({ path: 'cms/article-tags' });
  });
});
