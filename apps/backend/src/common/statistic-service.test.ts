import { describe, expect, it, vi } from 'vitest';

const mockStatistic = vi.hoisted(() => ({
  create: vi.fn(),
  count: vi.fn(),
  findMany: vi.fn(),
  groupBy: vi.fn(),
}));

vi.mock('./prisma.service', () => ({
  prismaService: {
    statistic: mockStatistic,
  },
}));

const mockHashTest = vi.hoisted(() => vi.fn());
vi.mock('@backend/utils/hash', () => ({
  hashTest: mockHashTest,
}));

import {
  getChartData,
  getStatistics,
  getSummary,
  recordVisitor,
} from './statistic-service';

describe('statistic-service', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('recordVisitor', () => {
    const baseRequest = {
      ip: '192.168.1.1',
      get: vi.fn().mockReturnValue(''),
    } as any;

    const validVisitorDto = {
      pagePath: '/test',
      pageTitle: 'Test Page',
      referrer: '',
      browser: 'Chrome',
      os: 'macOS',
      device: 'Desktop',
      deviceId: 'dev-123',
      hmac: 'valid-hmac',
    };

    it('records visitor successfully', async () => {
      mockHashTest.mockReturnValue(true);
      mockStatistic.create.mockResolvedValue({ id: 1 });

      const request = {
        ...baseRequest,
        headers: { 'data-hash': 'valid-hash' },
      };

      await recordVisitor(request, validVisitorDto);

      expect(mockStatistic.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          pagePath: '/test',
          browser: 'Chrome',
          os: 'macOS',
          device: 'Desktop',
          ip: '192.168.1.1',
          referrer: '',
        }),
      });
    });

    it('returns early when hash is invalid', async () => {
      mockHashTest.mockReturnValue(false);

      const request = {
        ...baseRequest,
        headers: { 'data-hash': 'bad-hash' },
      };

      await recordVisitor(request, validVisitorDto);
      expect(mockStatistic.create).not.toHaveBeenCalled();
    });

    it('returns early when browser is missing', async () => {
      mockHashTest.mockReturnValue(true);

      const request = {
        ...baseRequest,
        headers: { 'data-hash': 'valid-hash' },
      };

      await recordVisitor(request, { ...validVisitorDto, browser: '' });
      expect(mockStatistic.create).not.toHaveBeenCalled();
    });

    it('returns early when os is missing', async () => {
      mockHashTest.mockReturnValue(true);

      const request = {
        ...baseRequest,
        headers: { 'data-hash': 'valid-hash' },
      };

      await recordVisitor(request, { ...validVisitorDto, os: '' });
      expect(mockStatistic.create).not.toHaveBeenCalled();
    });

    it('returns early when device is missing', async () => {
      mockHashTest.mockReturnValue(true);

      const request = {
        ...baseRequest,
        headers: { 'data-hash': 'valid-hash' },
      };

      await recordVisitor(request, { ...validVisitorDto, device: '' });
      expect(mockStatistic.create).not.toHaveBeenCalled();
    });

    it('returns early when OS is not in allowed list', async () => {
      mockHashTest.mockReturnValue(true);

      const request = {
        ...baseRequest,
        headers: { 'data-hash': 'valid-hash' },
      };

      await recordVisitor(request, { ...validVisitorDto, os: 'FreeBSD' });
      expect(mockStatistic.create).not.toHaveBeenCalled();
    });

    it('uses x-forwarded-for when request.ip is not available', async () => {
      mockHashTest.mockReturnValue(true);
      mockStatistic.create.mockResolvedValue({ id: 1 });

      const request = {
        ...baseRequest,
        ip: undefined,
        headers: { 'data-hash': 'valid-hash', 'x-forwarded-for': '10.0.0.1' },
      };

      await recordVisitor(request, validVisitorDto);

      expect(mockStatistic.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ ip: '10.0.0.1' }),
      });
    });

    it('uses "unknown" when no IP source is available', async () => {
      mockHashTest.mockReturnValue(true);
      mockStatistic.create.mockResolvedValue({ id: 1 });

      const request = {
        ...baseRequest,
        ip: undefined,
        headers: { 'data-hash': 'valid-hash' },
      };

      await recordVisitor(request, validVisitorDto);

      expect(mockStatistic.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ ip: 'unknown' }),
      });
    });

    it('uses referrer from request getter when visitorDto.referrer is empty', async () => {
      mockHashTest.mockReturnValue(true);
      mockStatistic.create.mockResolvedValue({ id: 1 });

      const request = {
        ...baseRequest,
        headers: { 'data-hash': 'valid-hash' },
        get: vi.fn().mockReturnValue('https://referrer.com'),
      };

      await recordVisitor(request, { ...validVisitorDto, referrer: '' });

      expect(mockStatistic.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ referrer: 'https://referrer.com' }),
      });
    });
  });

  describe('getStatistics', () => {
    it('returns paginated statistics with defaults', async () => {
      mockStatistic.count.mockResolvedValue(2);
      mockStatistic.findMany.mockResolvedValue([
        { id: 1, pagePath: '/a' },
        { id: 2, pagePath: '/b' },
      ]);

      const result = await getStatistics({});

      expect(result).toEqual({
        data: [
          { id: 1, pagePath: '/a' },
          { id: 2, pagePath: '/b' },
        ],
        total: 2,
        page: 1,
        limit: 10,
      });
      expect(mockStatistic.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: { time: 'desc' },
        skip: 0,
        take: 10,
      });
    });

    it('returns paginated statistics with custom params', async () => {
      mockStatistic.count.mockResolvedValue(1);
      mockStatistic.findMany.mockResolvedValue([{ id: 1 }]);

      const result = await getStatistics(
        { pagePath: '/test', browser: 'Chrome' },
        2,
        5,
      );

      expect(result.page).toBe(2);
      expect(result.limit).toBe(5);
      expect(mockStatistic.findMany).toHaveBeenCalledWith({
        where: { pagePath: '/test', browser: 'Chrome' },
        orderBy: { time: 'desc' },
        skip: 5,
        take: 5,
      });
    });

    it('handles empty results', async () => {
      mockStatistic.count.mockResolvedValue(0);
      mockStatistic.findMany.mockResolvedValue([]);

      const result = await getStatistics({}, 1, 10);

      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  describe('getSummary', () => {
    it('returns summary with all computed values', async () => {
      mockStatistic.count.mockResolvedValueOnce(100).mockResolvedValueOnce(5);

      mockStatistic.groupBy
        .mockResolvedValueOnce([
          { deviceId: 'a', _count: { deviceId: 1 } },
          { deviceId: 'b', _count: { deviceId: 1 } },
        ])
        .mockResolvedValueOnce([
          { ip: '1.1.1.1', _count: { ip: 1 } },
          { ip: '2.2.2.2', _count: { ip: 1 } },
          { ip: '3.3.3.3', _count: { ip: 1 } },
        ])
        .mockResolvedValueOnce([
          { pagePath: '/a', pageTitle: 'Page A', _count: { id: 5 } },
          { pagePath: '/b', pageTitle: null, _count: { id: 3 } },
          { pagePath: '/c', pageTitle: 'Page C', _count: { id: 1 } },
        ]);

      const result = await getSummary();

      expect(result).toEqual({
        totalVisits: 100,
        totalUniqueVisitors: 2,
        todayVisits: 5,
        todayUniqueVisitors: 3,
        topPages: [
          { pagePath: '/a', pageTitle: 'Page A', visitCount: 5 },
          { pagePath: '/b', pageTitle: '/b', visitCount: 3 },
          { pagePath: '/c', pageTitle: 'Page C', visitCount: 1 },
        ],
      });
    });
  });

  describe('getChartData', () => {
    it('returns chart data for specified number of days', async () => {
      mockStatistic.count.mockResolvedValue(10);
      mockStatistic.groupBy.mockResolvedValue([
        { ip: '1.1.1.1', _count: { ip: 1 } },
        { ip: '2.2.2.2', _count: { ip: 1 } },
      ]);

      const result = await getChartData(2);

      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('date');
      expect(result[0].visits).toBe(10);
      expect(result[0].uniqueVisitors).toBe(2);
      expect(result[1]).toHaveProperty('date');
      expect(result[1].visits).toBe(10);
      expect(result[1].uniqueVisitors).toBe(2);
    });

    it('returns chart data for single day', async () => {
      mockStatistic.count.mockResolvedValue(5);
      mockStatistic.groupBy.mockResolvedValue([]);

      const result = await getChartData(1);

      expect(result).toHaveLength(1);
      expect(result[0].visits).toBe(5);
      expect(result[0].uniqueVisitors).toBe(0);
    });

    it('uses default of 7 days when called without argument', async () => {
      mockStatistic.count.mockResolvedValue(0);
      mockStatistic.groupBy.mockResolvedValue([]);

      const result = await getChartData();

      expect(result).toHaveLength(7);
    });
  });
});
