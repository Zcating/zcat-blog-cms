import { describe, expect, it, vi } from 'vitest';

import { StatisticsApi } from './statistics-api';
import { HttpClient } from '../http/http-client';

vi.mock('../http/http-client', () => ({
  HttpClient: { get: vi.fn() },
}));

describe('StatisticsApi', () => {
  it('getSummary calls HttpClient.get', async () => {
    vi.mocked(HttpClient.get).mockResolvedValueOnce({ totalVisits: 100 });
    const result = await StatisticsApi.getSummary();
    expect(HttpClient.get).toHaveBeenCalledWith({
      path: 'cms/statistics/summary',
      signal: undefined,
    });
    expect(result.totalVisits).toBe(100);
  });

  it('getChartData calls HttpClient.get', async () => {
    vi.mocked(HttpClient.get).mockResolvedValueOnce([]);
    await StatisticsApi.getChartData();
    expect(HttpClient.get).toHaveBeenCalledWith({
      path: 'cms/statistics/chart-data',
      signal: undefined,
    });
  });
});
