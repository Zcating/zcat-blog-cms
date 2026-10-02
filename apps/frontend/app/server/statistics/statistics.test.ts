/**
 * Focused tests for the statistics domain server-function lane.
 *
 * The only seam these tests touch is the global `fetch` boundary — every
 * other collaborator (env resolver, cookie reader, envelope parser, Zod
 * schema) is exercised through the actual exported `queryFn` helpers
 * and `queryOptions` factories.
 *
 * Goals:
 * 1. Each operation GETs the documented backend path on the resolved base
 *    URL, with the session Cookie forwarded as `Authorization`.
 * 2. The envelope's `data` payload is unwrapped through the shared
 *    `parseEnvelope` helper, validated by the operation's Zod schema.
 * 3. Non-success envelopes throw a typed `ApiError`.
 * 4. The `queryOptions` factories expose a stable queryKey + queryFn that
 *    Phase 3 consumers can pick up unchanged.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { CookieIO } from '@cms/server/cookies';
import {
  statisticsChartDataOptions,
  statisticsChartDataQueryFn,
  statisticsDetailOptions,
  statisticsDetailQueryFn,
  statisticsSummaryOptions,
  statisticsSummaryQueryFn,
} from './index';

const testEnv = { resolveBaseUrl: () => 'http://backend.local/api' };

let originalEnv: NodeJS.ProcessEnv;
beforeEach(() => {
  originalEnv = { ...process.env };
  process.env.BACKEND_API_URL = 'http://backend.local/api';
});
afterEach(() => {
  process.env = originalEnv;
  vi.unstubAllGlobals();
});

function makeCookieIo(cookieValue: string | undefined): CookieIO {
  return {
    getCookie: vi.fn(() => cookieValue),
    setCookie: vi.fn(),
    deleteCookie: vi.fn(),
  };
}

interface FetchCall {
  url: string;
  init: RequestInit;
}

function captureFetch(body: unknown, status = 200): FetchCall[] {
  const calls: FetchCall[] = [];
  const fetchMock = vi.fn(
    async (input: RequestInfo | URL, init?: RequestInit) => {
      calls.push({
        url: typeof input === 'string' ? input : input.toString(),
        init: init ?? {},
      });
      return {
        status,
        ok: status >= 200 && status < 300,
        json: async () => body,
      } as Response;
    },
  ) as unknown as typeof fetch;
  vi.stubGlobal('fetch', fetchMock);
  return calls;
}

describe('statistics summary', () => {
  const body = {
    code: '0000',
    message: 'ok',
    data: {
      totalVisits: 12580,
      totalUniqueVisitors: 8420,
      todayVisits: 156,
      todayUniqueVisitors: 98,
      topPages: [
        {
          pagePath: '/blog/article/1',
          pageTitle: 'React 19 新特性详解',
          visitCount: 1250,
        },
      ],
    },
  };

  it('GETs /cms/statistics/summary on the resolved base URL and unwraps the data', async () => {
    const calls = captureFetch(body);
    const result = await statisticsSummaryQueryFn({
      env: testEnv,
      cookie: makeCookieIo(undefined),
    });

    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe(
      'http://backend.local/api/cms/statistics/summary',
    );
    expect(calls[0].init.method).toBe('GET');
    expect(result).toEqual(body.data);
  });

  it('forwards a Bearer session Cookie as Authorization on the GET', async () => {
    const calls = captureFetch(body);
    await statisticsSummaryQueryFn({
      env: testEnv,
      cookie: makeCookieIo('Bearer abc.def.ghi'),
    });

    const headers = calls[0].init.headers as Record<string, string>;
    expect(headers.Authorization).toBe('Bearer abc.def.ghi');
  });

  it('re-wraps a raw-token session Cookie so the backend always sees "Bearer <token>"', async () => {
    const calls = captureFetch(body);
    await statisticsSummaryQueryFn({
      env: testEnv,
      cookie: makeCookieIo('raw-token-only'),
    });

    const headers = calls[0].init.headers as Record<string, string>;
    expect(headers.Authorization).toBe('Bearer raw-token-only');
  });

  it('throws a typed ApiError on a non-success envelope', async () => {
    captureFetch({ code: 'ERR0002', message: 'unauthorized', data: null });
    await expect(
      statisticsSummaryQueryFn({
        env: testEnv,
        cookie: makeCookieIo(undefined),
      }),
    ).rejects.toMatchObject({
      _tag: 'LoginError',
      message: 'unauthorized',
    });
  });

  it('throws a typed ResponseValidationError when the data payload fails the schema', async () => {
    captureFetch({
      code: '0000',
      message: 'ok',
      // Missing required numeric fields + topPages array.
      data: { totalVisits: 'not-a-number' },
    });
    await expect(
      statisticsSummaryQueryFn({
        env: testEnv,
        cookie: makeCookieIo(undefined),
      }),
    ).rejects.toMatchObject({
      name: 'ResponseValidationError',
    });
  });

  it('exposes a stable queryOptions shape (queryKey + queryFn)', () => {
    const opts = statisticsSummaryOptions();
    expect(opts.queryKey).toEqual(['statistics', 'summary']);
    expect(typeof opts.queryFn).toBe('function');
  });
});

describe('statistics chart-data', () => {
  const data = [
    { date: '2024-01-15', visits: 120, uniqueVisitors: 85 },
    { date: '2024-01-16', visits: 156, uniqueVisitors: 102 },
  ];
  const body = { code: '0000', message: 'ok', data };

  it('GETs /cms/statistics/chart-data and unwraps an array of points', async () => {
    const calls = captureFetch(body);
    const result = await statisticsChartDataQueryFn({
      env: testEnv,
      cookie: makeCookieIo(undefined),
    });

    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe(
      'http://backend.local/api/cms/statistics/chart-data',
    );
    expect(calls[0].init.method).toBe('GET');
    expect(result).toEqual(data);
  });

  it('throws a typed ResponseValidationError when a chart point fails the schema', async () => {
    captureFetch({
      code: '0000',
      message: 'ok',
      data: [{ date: '2024-01-15', visits: 'oops', uniqueVisitors: 85 }],
    });
    await expect(
      statisticsChartDataQueryFn({
        env: testEnv,
        cookie: makeCookieIo(undefined),
      }),
    ).rejects.toMatchObject({
      name: 'ResponseValidationError',
    });
  });

  it('exposes a stable queryOptions shape', () => {
    const opts = statisticsChartDataOptions();
    expect(opts.queryKey).toEqual(['statistics', 'chart-data']);
    expect(typeof opts.queryFn).toBe('function');
  });
});

describe('statistics detail', () => {
  const data = [
    {
      id: 1,
      time: '2024-01-21 14:30:25',
      pagePath: '/blog/article/1',
      pageTitle: 'React 19 新特性详解',
      ip: '192.168.1.100',
      location: 'Beijing, China',
      browser: 'Chrome 120.0.0.0',
      os: 'Windows 10',
      device: 'Desktop',
    },
  ];
  const body = { code: '0000', message: 'ok', data };

  it('GETs /cms/statistics/detail and unwraps an array of detail rows', async () => {
    const calls = captureFetch(body);
    const result = await statisticsDetailQueryFn({
      env: testEnv,
      cookie: makeCookieIo(undefined),
    });

    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe('http://backend.local/api/cms/statistics/detail');
    expect(calls[0].init.method).toBe('GET');
    expect(result).toEqual(data);
  });

  it('throws a typed ResponseValidationError when a detail row is malformed', async () => {
    captureFetch({
      code: '0000',
      message: 'ok',
      data: [{ id: 'not-a-number' }],
    });
    await expect(
      statisticsDetailQueryFn({
        env: testEnv,
        cookie: makeCookieIo(undefined),
      }),
    ).rejects.toMatchObject({
      name: 'ResponseValidationError',
    });
  });

  it('exposes a stable queryOptions shape', () => {
    const opts = statisticsDetailOptions();
    expect(opts.queryKey).toEqual(['statistics', 'detail']);
    expect(typeof opts.queryFn).toBe('function');
  });
});
