import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getMock, postMock, delMock } = vi.hoisted(() => ({
  getMock: vi.fn(),
  postMock: vi.fn(),
  delMock: vi.fn(),
}));

vi.mock('../http/http-client', () => ({
  HttpClient: {
    get: getMock,
    post: postMock,
    del: delMock,
  },
}));

import { ArticlesApi } from './articles-api';

describe('ArticlesApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('gets article list with cms path and pagination params', async () => {
    getMock.mockResolvedValueOnce({
      data: [],
      total: 0,
      page: 1,
      pageSize: 10,
    });

    await ArticlesApi.getArticles({ page: 1, pageSize: 10 });

    expect(getMock).toHaveBeenCalledWith({
      path: 'cms/articles',
      params: { page: 1, pageSize: 10 },
    });
  });

  it('deletes an article by id', async () => {
    delMock.mockResolvedValueOnce(undefined);

    await ArticlesApi.deleteArticle(7);

    expect(delMock).toHaveBeenCalledWith({ path: 'cms/articles/7' });
  });

  it('uploads article images through the cms endpoint', async () => {
    postMock.mockResolvedValueOnce(['a.png']);

    await ArticlesApi.uploadArticleImages(['base64-data']);

    expect(postMock).toHaveBeenCalledWith({
      path: 'cms/articles/upload-images',
      params: { images: ['base64-data'] },
    });
  });
});
