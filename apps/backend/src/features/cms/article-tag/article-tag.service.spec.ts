import { createPrismaServiceMock } from '../test-helpers/service-test-helper';

import { ArticleTagService } from './article-tag.service';

describe('ArticleTagService', () => {
  let prismaService: ReturnType<typeof createPrismaServiceMock>;
  let service: ArticleTagService;

  beforeEach(() => {
    prismaService = createPrismaServiceMock();
    service = new ArticleTagService(prismaService as any);
  });

  it('findAll returns all tags from prisma', async () => {
    prismaService.articleTag.findMany.mockResolvedValue([
      { id: 1, name: 'ts' },
    ]);

    const result = await service.findAll();

    expect(prismaService.articleTag.findMany).toHaveBeenCalledTimes(1);
    expect(result).toEqual([{ id: 1, name: 'ts' }]);
  });

  it('create forwards dto to prisma', async () => {
    prismaService.articleTag.create.mockResolvedValue({ id: 2, name: 'nest' });

    const result = await service.create({ name: 'nest' } as any);

    expect(prismaService.articleTag.create).toHaveBeenCalledWith({
      data: { name: 'nest' },
    });
    expect(result).toEqual({ id: 2, name: 'nest' });
  });

  it('findOne parses string id before prisma call', async () => {
    prismaService.articleTag.findUnique.mockResolvedValue({
      id: 12,
      name: 'db',
    });

    await service.findOne('12');

    expect(prismaService.articleTag.findUnique).toHaveBeenCalledWith({
      where: { id: 12 },
    });
  });

  it('update parses string id before prisma call', async () => {
    prismaService.articleTag.update.mockResolvedValue({
      id: 3,
      name: 'updated',
    });

    await service.update('3', { name: 'updated' } as any);

    expect(prismaService.articleTag.update).toHaveBeenCalledWith({
      where: { id: 3 },
      data: { name: 'updated' },
    });
  });

  it('remove parses string id before prisma call', async () => {
    prismaService.articleTag.delete.mockResolvedValue({
      id: 5,
      name: 'remove',
    });

    await service.remove('5');

    expect(prismaService.articleTag.delete).toHaveBeenCalledWith({
      where: { id: 5 },
    });
  });
});
