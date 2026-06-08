import { afterEach, describe, expect, it, vi } from 'vitest';

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

import { logger } from '@backend/utils';
import {
  getChartData,
  getStatistics,
  getSummary,
  recordVisitor,
} from './statistic-service';

describe('statistic-service', () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
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

    it('records visitor successfully with masked IPv4', async () => {
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
          ip: '192.168.1.0',
          referrer: '',
        }),
      });
    });

    it('logs warn with event=hmac_failed when hash is invalid and skips create', async () => {
      mockHashTest.mockReturnValue(false);
      const warnSpy = vi.spyOn(logger, 'warn').mockImplementation(() => {});

      const request = {
        ...baseRequest,
        headers: { 'data-hash': 'bad-hash' },
      };

      await recordVisitor(request, validVisitorDto);

      expect(mockStatistic.create).not.toHaveBeenCalled();
      expect(warnSpy).toHaveBeenCalledWith(
        expect.objectContaining({ event: 'hmac_failed', pagePath: '/test' }),
        expect.any(String),
      );
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

    it('uses x-forwarded-for when request.ip is not available and masks it', async () => {
      mockHashTest.mockReturnValue(true);
      mockStatistic.create.mockResolvedValue({ id: 1 });

      const request = {
        ...baseRequest,
        ip: undefined,
        headers: { 'data-hash': 'valid-hash', 'x-forwarded-for': '10.0.0.1' },
      };

      await recordVisitor(request, validVisitorDto);

      expect(mockStatistic.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ ip: '10.0.0.0' }),
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

    // P0 A.5 — IP truncation (GDPR)
    it('truncates IPv4 to /24: keeps first three octets, zeros last', async () => {
      mockHashTest.mockReturnValue(true);
      mockStatistic.create.mockResolvedValue({ id: 1 });

      const request = {
        ip: '203.0.113.45',
        headers: { 'data-hash': 'valid-hash' },
        get: vi.fn().mockReturnValue(''),
      } as any;

      await recordVisitor(request, validVisitorDto);

      expect(mockStatistic.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ ip: '203.0.113.0' }),
      });
    });

    it('keeps already-zeroed IPv4 unchanged', async () => {
      mockHashTest.mockReturnValue(true);
      mockStatistic.create.mockResolvedValue({ id: 1 });

      const request = {
        ip: '10.0.0.0',
        headers: { 'data-hash': 'valid-hash' },
        get: vi.fn().mockReturnValue(''),
      } as any;

      await recordVisitor(request, validVisitorDto);

      expect(mockStatistic.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ ip: '10.0.0.0' }),
      });
    });

    it('returns "unknown" for invalid IPv4 (wrong octet count)', async () => {
      mockHashTest.mockReturnValue(true);
      mockStatistic.create.mockResolvedValue({ id: 1 });

      const request = {
        ip: '1.2.3',
        headers: { 'data-hash': 'valid-hash' },
        get: vi.fn().mockReturnValue(''),
      } as any;

      await recordVisitor(request, validVisitorDto);

      expect(mockStatistic.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ ip: 'unknown' }),
      });
    });

    it('returns "unknown" for non-IP strings', async () => {
      mockHashTest.mockReturnValue(true);
      mockStatistic.create.mockResolvedValue({ id: 1 });

      const request = {
        ip: 'not-an-ip',
        headers: { 'data-hash': 'valid-hash' },
        get: vi.fn().mockReturnValue(''),
      } as any;

      await recordVisitor(request, validVisitorDto);

      expect(mockStatistic.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ ip: 'unknown' }),
      });
    });

    it('truncates IPv6 keeping first 48 bits', async () => {
      mockHashTest.mockReturnValue(true);
      mockStatistic.create.mockResolvedValue({ id: 1 });

      const request = {
        ip: '2001:db8:1234:5678:9abc:def0:1234:5678',
        headers: { 'data-hash': 'valid-hash' },
        get: vi.fn().mockReturnValue(''),
      } as any;

      await recordVisitor(request, validVisitorDto);

      expect(mockStatistic.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ ip: '2001:db8:1234:0:0:0:0:0' }),
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

    // P0 A.11 — 60s in-memory Cache
    it('caches the result: second call within 60s returns the same value without hitting DB', async () => {
      // summaryCache is module-scoped; previous tests may have populated it.
      // Advance Date.now past the 60s TTL so any stale entry is invalidated,
      // letting this test exercise a fresh DB round-trip + cache hit.
      const dateSpy = vi.spyOn(Date, 'now').mockReturnValue(Date.now() + 61_000);

      mockStatistic.count.mockResolvedValue(100);
      mockStatistic.groupBy.mockResolvedValue([]);

      const first = await getSummary();
      // One getSummary() round-trip = 2 count queries + 3 groupBy queries
      expect(mockStatistic.count).toHaveBeenCalledTimes(2);
      expect(mockStatistic.groupBy).toHaveBeenCalledTimes(3);

      const second = await getSummary();
      expect(first).toBe(second);
      // Cache hit: DB call counts unchanged
      expect(mockStatistic.count).toHaveBeenCalledTimes(2);
      expect(mockStatistic.groupBy).toHaveBeenCalledTimes(3);

      dateSpy.mockRestore();
    });
  });

  describe('getChartData', () => {
    // P0 A.10 — single findMany + app-layer bucketing
    it('returns chart data with single findMany + app-layer bucketing', async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayKey = today.toISOString().split('T')[0];
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayKey = yesterday.toISOString().split('T')[0];

      mockStatistic.findMany.mockResolvedValue([
        { time: today, ip: '1.1.1.1' },
        { time: today, ip: '2.2.2.2' },
        { time: yesterday, ip: '3.3.3.3' },
      ]);

      const result = await getChartData(2);

      expect(result).toHaveLength(2);
      expect(mockStatistic.findMany).toHaveBeenCalledTimes(1);
      expect(mockStatistic.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ time: expect.any(Object) }),
          select: { time: true, ip: true },
        }),
      );
      const todayBucket = result.find((r) => r.date === todayKey)!;
      const yesterdayBucket = result.find((r) => r.date === yesterdayKey)!;
      expect(todayBucket.visits).toBe(2);
      expect(todayBucket.uniqueVisitors).toBe(2);
      expect(yesterdayBucket.visits).toBe(1);
      expect(yesterdayBucket.uniqueVisitors).toBe(1);
    });

    it('returns chart data for single day', async () => {
      mockStatistic.findMany.mockResolvedValue([]);

      const result = await getChartData(1);

      expect(result).toHaveLength(1);
      expect(result[0].visits).toBe(0);
      expect(result[0].uniqueVisitors).toBe(0);
    });

    it('uses default of 7 days when called without argument', async () => {
      mockStatistic.findMany.mockResolvedValue([]);

      const result = await getChartData();

      expect(result).toHaveLength(7);
    });
  });
});
