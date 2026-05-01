import {
  createDate,
  createOssServiceMock,
  createPrismaServiceMock,
} from '../test-helpers/service-test-helper';

import { ArticleService } from './article.service';

describe('ArticleService', () => {
  let prismaService: ReturnType<typeof createPrismaServiceMock>;
  let ossService: ReturnType<typeof createOssServiceMock>;
  let service: ArticleService;

  beforeEach(() => {
    prismaService = createPrismaServiceMock();
    ossService = createOssServiceMock();
    service = new ArticleService(prismaService as any, ossService as any);
  });

  it('findArticles returns mapped pagination result', async () => {
    const createdAt = createDate('2026-02-01T10:00:00.000Z');
    const updatedAt = createDate('2026-02-02T10:00:00.000Z');
    const publishAt = createDate('2026-02-03T10:00:00.000Z');

    prismaService.article.findMany.mockResolvedValue([
      {
        id: 1,
        title: 'Hello',
        excerpt: 'World',
        createdAt,
        updatedAt,
        publishAt,
        createByUserId: 100,
      },
    ]);
    prismaService.article.count.mockResolvedValue(21);

    const result = await service.findArticles({
      page: 2,
      pageSize: 10,
      order: 'latest',
    } as any);

    expect(prismaService.article.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { createdAt: 'desc' },
        skip: 10,
        take: 10,
      }),
    );
    expect(prismaService.article.count).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      data: [
        {
          id: 1,
          title: 'Hello',
          excerpt: 'World',
          createdAt,
          updatedAt,
          publishAt,
        },
      ],
      totalPages: 3,
      page: 2,
      pageSize: 10,
      total: 21,
    });
  });

  it('getArticle returns null for invalid id', async () => {
    const result = await service.getArticle('invalid-id');

    expect(result).toBeNull();
    expect(prismaService.article.findUnique).not.toHaveBeenCalled();
  });

  it('uploadArticleImages maps through oss service', () => {
    const result = service.uploadArticleImages(['cover.png', 'body.png']);

    expect(ossService.getArticleUrl).toHaveBeenNthCalledWith(1, 'cover.png');
    expect(ossService.getArticleUrl).toHaveBeenNthCalledWith(2, 'body.png');
    expect(result).toEqual(['article://cover.png', 'article://body.png']);
  });
});
