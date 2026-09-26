import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getArticleDetailMock } = vi.hoisted(() => ({
  getArticleDetailMock: vi.fn(),
}));

vi.mock('@blog/server/article', async () => {
  const actual = await vi.importActual<typeof import('@blog/server/article')>(
    '@blog/server/article',
  );
  return {
    ...actual,
    getArticleDetail: (...args: unknown[]) => getArticleDetailMock(...args),
  };
});

// --- import after mocks ---

import { ApiErrorException } from '@blog/server/errors';

import { loader } from './post-board_.$id';

const ARTICLE_DETAIL = {
  id: 42,
  title: '第四十二篇',
  excerpt: '摘要',
  content: '# 正文',
  createdAt: '2026-05-19T12:00:00.000Z',
  updatedAt: '2026-05-20T12:00:00.000Z',
  publishAt: '2026-05-21T12:00:00.000Z',
  articleAndArticleTags: [],
};

describe('route loader: /_blog/post-board/$id', () => {
  beforeEach(() => {
    getArticleDetailMock.mockReset();
    getArticleDetailMock.mockResolvedValue(ARTICLE_DETAIL);
  });

  it('forwards the raw URL id segment as a string, without coercing it to a number', async () => {
    const result = await loader({ params: { id: '42' } });

    expect(getArticleDetailMock).toHaveBeenCalledTimes(1);
    expect(getArticleDetailMock.mock.calls[0]?.[0]).toEqual({
      data: { id: '42' },
    });
    expect(result.article).toEqual(ARTICLE_DETAIL);
  });

  it('builds the JSON-LD payload from the article and omits any image field', async () => {
    const result = await loader({ params: { id: '42' } });

    expect(result.jsonLd).toEqual({
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: '第四十二篇',
      description: '摘要',
      datePublished: '2026-05-21T12:00:00.000Z',
      dateModified: '2026-05-20T12:00:00.000Z',
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': 'https://blog.zcat.example/post-board/42',
      },
    });
    expect(result.jsonLd).not.toHaveProperty('image');
  });

  it('rejects an id outside the id contract without calling the backend', async () => {
    await expect(loader({ params: { id: '4 2' } })).rejects.toMatchObject({
      isNotFound: true,
    });
    expect(getArticleDetailMock).not.toHaveBeenCalled();
  });

  it('rejects a missing id parameter without calling the backend', async () => {
    await expect(loader({ params: {} })).rejects.toMatchObject({
      isNotFound: true,
    });
    expect(getArticleDetailMock).not.toHaveBeenCalled();
  });

  it('lets the backend error envelope for a missing article reach the route error boundary', async () => {
    getArticleDetailMock.mockRejectedValue(
      new ApiErrorException({
        _tag: 'DatabaseError',
        message: '文章不存在-未找到',
      }),
    );

    await expect(loader({ params: { id: '999' } })).rejects.toMatchObject({
      name: 'ApiErrorException',
    });
    expect(getArticleDetailMock).toHaveBeenCalledTimes(1);
  });
});
