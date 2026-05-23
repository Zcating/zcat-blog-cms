import { describe, expect, it, vi } from 'vitest';

import { ArticleApi } from './article-api';
import { HttpClient } from '../http/http-client';

vi.mock('../http/http-client', () => ({
  HttpClient: {
    serverSideGet: vi.fn(),
  },
}));

describe('ArticleApi', () => {
  it('getArticleList calls serverSideGet with correct params', async () => {
    vi.mocked(HttpClient.serverSideGet).mockResolvedValueOnce({
      data: [],
      totalPages: 1,
      page: 1,
      pageSize: 10,
    });

    const result = await ArticleApi.getArticleList({
      page: 1,
      pageSize: 10,
      order: 'latest',
    });

    expect(HttpClient.serverSideGet).toHaveBeenCalledWith(
      'blog/article/list',
      { page: 1, pageSize: 10, order: 'latest' },
    );
    expect(result).toEqual({
      data: [],
      totalPages: 1,
      page: 1,
      pageSize: 10,
    });
  });

  it('getArticleDetail calls serverSideGet with correct id', async () => {
    vi.mocked(HttpClient.serverSideGet).mockResolvedValueOnce({
      id: '1',
      title: 'Test',
    });

    const result = await ArticleApi.getArticleDetail('1');

    expect(HttpClient.serverSideGet).toHaveBeenCalledWith('blog/article/1');
    expect(result).toEqual({ id: '1', title: 'Test' });
  });
});
