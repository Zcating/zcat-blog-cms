// Every operation goes through the shared `transport` helpers, so the
// base-URL, Authorization, envelope-parsing and no-retry rules in
// `./transport.ts` apply here unchanged.

import { queryOptions } from '@tanstack/react-query';
import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';

import { createProtectedFunctionMiddleware } from '@cms/server/auth-middleware';
import type { CookieIO } from '@cms/server/cookies';
import { resolveBackendApiUrl } from '@cms/server/env';
import {
  getAuthorizedJson,
  type BackendEnv,
  type FetchLike,
} from '@cms/server/transport';

const StatisticsTopPageSchema = z.object({
  pagePath: z.string(),
  pageTitle: z.string(),
  visitCount: z.number(),
});

const StatisticsSummarySchema = z.object({
  totalVisits: z.number(),
  totalUniqueVisitors: z.number(),
  todayVisits: z.number(),
  todayUniqueVisitors: z.number(),
  topPages: z.array(StatisticsTopPageSchema),
});

const StatisticsChartPointSchema = z.object({
  date: z.string(),
  visits: z.number(),
  uniqueVisitors: z.number(),
});

const StatisticsDetailRowSchema = z.object({
  id: z.number(),
  time: z.string(),
  pagePath: z.string(),
  pageTitle: z.string(),
  ip: z.string(),
  location: z.string(),
  browser: z.string(),
  os: z.string(),
  device: z.string(),
});

// The wire-boundary seam used by the server functions below.
interface QueryFnDeps {
  env?: BackendEnv;
  cookie?: CookieIO;
  fetch?: FetchLike;
}

const defaultEnv: BackendEnv = { resolveBaseUrl: resolveBackendApiUrl };

export function statisticsSummaryQueryFn(
  deps: QueryFnDeps = {},
): Promise<z.infer<typeof StatisticsSummarySchema>> {
  return getAuthorizedJson<z.infer<typeof StatisticsSummarySchema>>({
    path: '/cms/statistics/summary',
    dataSchema: StatisticsSummarySchema,
    env: deps.env ?? defaultEnv,
    cookie: deps.cookie,
    fetch: deps.fetch,
  });
}

export function statisticsChartDataQueryFn(
  deps: QueryFnDeps = {},
): Promise<z.infer<typeof StatisticsChartPointSchema>[]> {
  return getAuthorizedJson<z.infer<typeof StatisticsChartPointSchema>[]>({
    path: '/cms/statistics/chart-data',
    dataSchema: z.array(StatisticsChartPointSchema),
    env: deps.env ?? defaultEnv,
    cookie: deps.cookie,
    fetch: deps.fetch,
  });
}

export function statisticsDetailQueryFn(
  deps: QueryFnDeps = {},
): Promise<z.infer<typeof StatisticsDetailRowSchema>[]> {
  return getAuthorizedJson<z.infer<typeof StatisticsDetailRowSchema>[]>({
    path: '/cms/statistics/detail',
    dataSchema: z.array(StatisticsDetailRowSchema),
    env: deps.env ?? defaultEnv,
    cookie: deps.cookie,
    fetch: deps.fetch,
  });
}

export function statisticsSummaryOptions() {
  return queryOptions({
    queryKey: ['statistics', 'summary'] as const,
    queryFn: () => getStatisticsSummaryServerFn(),
  });
}

export function statisticsChartDataOptions() {
  return queryOptions({
    queryKey: ['statistics', 'chart-data'] as const,
    queryFn: () => getStatisticsChartDataServerFn(),
  });
}

export function statisticsDetailOptions() {
  return queryOptions({
    queryKey: ['statistics', 'detail'] as const,
    queryFn: () => getStatisticsDetailServerFn(),
  });
}

const protectedMiddleware = createProtectedFunctionMiddleware();

export const getStatisticsSummaryServerFn = createServerFn({
  method: 'GET',
})
  .middleware([protectedMiddleware])
  .handler(async () => {
    return statisticsSummaryQueryFn();
  });

export const getStatisticsChartDataServerFn = createServerFn({
  method: 'GET',
})
  .middleware([protectedMiddleware])
  .handler(async () => {
    return statisticsChartDataQueryFn();
  });

export const getStatisticsDetailServerFn = createServerFn({
  method: 'GET',
})
  .middleware([protectedMiddleware])
  .handler(async () => {
    return statisticsDetailQueryFn();
  });

export type StatisticsSummary = z.infer<typeof StatisticsSummarySchema>;
export type StatisticsChartData = z.infer<typeof StatisticsChartPointSchema>;
export type StatisticsDetailData = z.infer<typeof StatisticsDetailRowSchema>;
