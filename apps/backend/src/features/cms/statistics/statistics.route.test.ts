import { Hono } from 'hono';
import { describe, expect, it, vi } from 'vitest';
import { Effect } from 'effect';

vi.mock('@backend/common', () => ({
  getStatistics: vi.fn(),
  getSummary: vi.fn(),
  getChartData: vi.fn(),
}));

import statisticsRoutes from './statistics.route';

const createApp = () => {
  const app = new Hono();
  app.onError((err, c) =>
    c.json({ code: 'ERR0006', message: err.message }, 200),
  );
  app.route('/', statisticsRoutes);
  return app;
};

describe('statisticsRoutes', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /statistics/detail', () => {
    it('returns statistics', async () => {
      const { getStatistics } = await import('@backend/common');
      (getStatistics as any).mockReturnValue(
        Effect.succeed({ data: [], total: 0 }),
      );
      const app = createApp();

      const res = await app.request('/statistics/detail');
      const body = await res.json();

      expect(body.code).toBe('0000');
    });

    it('returns error when getStatistics fails', async () => {
      const { getStatistics } = await import('@backend/common');
      (getStatistics as any).mockReturnValue(Effect.fail(new Error('stats error')));
      const app = createApp();

      const res = await app.request('/statistics/detail');
      const body = await res.json();

      expect(body.code).toBe('ERR0006');
    });
  });

  describe('GET /statistics/summary', () => {
    it('returns summary', async () => {
      const { getSummary } = await import('@backend/common');
      (getSummary as any).mockReturnValue(Effect.succeed({ totalVisits: 100 }));
      const app = createApp();

      const res = await app.request('/statistics/summary');
      const body = await res.json();

      expect(body.code).toBe('0000');
      expect(body.data.totalVisits).toBe(100);
    });

    it('returns error when getSummary fails', async () => {
      const { getSummary } = await import('@backend/common');
      (getSummary as any).mockReturnValue(Effect.fail(new Error('summary error')));
      const app = createApp();

      const res = await app.request('/statistics/summary');
      const body = await res.json();

      expect(body.code).toBe('ERR0006');
    });
  });

  describe('GET /statistics/chart-data', () => {
    it('returns chart data', async () => {
      const { getChartData } = await import('@backend/common');
      (getChartData as any).mockReturnValue(Effect.succeed([]));
      const app = createApp();

      const res = await app.request('/statistics/chart-data');
      const body = await res.json();

      expect(body.code).toBe('0000');
    });

    it('returns error when getChartData fails', async () => {
      const { getChartData } = await import('@backend/common');
      (getChartData as any).mockReturnValue(Effect.fail(new Error('chart error')));
      const app = createApp();

      const res = await app.request('/statistics/chart-data');
      const body = await res.json();

      expect(body.code).toBe('ERR0006');
    });
  });
});