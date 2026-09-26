/**
 * TanStack Start server-function lane for the statistics domain.
 *
 * The `StatisticsApi` operations (`cms/statistics/summary`,
 * `cms/statistics/chart-data`, `cms/statistics/detail`) all ride the
 * shared server boundary. Every operation:
 *
 *   - Reads `BACKEND_API_URL` per request via the shared
 *     `resolveBackendApiUrl` (no `VITE_*` fallback, no `/api/bff/*`).
 *   - Forwards the request's Cookie Bearer as `Authorization` from the
 *     shared `authorizeFromCookie` helper.
 *   - Parses the backend envelope through the shared `parseEnvelope`
 *     and validates the unwrapped `data` against a per-operation Zod
 *     schema. A schema mismatch throws a typed `ResponseValidationError`;
 *     a non-success envelope throws a typed `ApiError`.
 *   - Has no automatic retries. The `fetch` boundary is called exactly
 *     once per operation.
 *
 * The export surface:
 *   - `getStatisticsSummaryServerFn` / `getStatisticsChartDataServerFn`
 *     / `getStatisticsDetailServerFn` — `createServerFn({ method: 'GET' })`
 *     wrappers guarded by the protected-function middleware.
 *   - `statisticsSummaryOptions` / `statisticsChartDataOptions` /
 *     `statisticsDetailOptions` — stable `queryOptions` factories that
 *     key off the operation and re-use the server-function body so
 *     consumers don't need to know the wire details.
 */

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

// ---------------------------------------------------------------------------
// Per-operation response schemas
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// QueryFn factories (the wire-boundary seam used by the server functions below).
// ---------------------------------------------------------------------------

interface QueryFnDeps {
  env?: BackendEnv;
  cookie?: CookieIO;
  fetch?: FetchLike;
}

const defaultEnv: BackendEnv = { resolveBaseUrl: resolveBackendApiUrl };

/**
 * `queryFn` for the statistics-summary read. Exposed so tests can drive
 * the wire boundary directly without re-implementing the schema /
 * envelope logic.
 */
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

/**
 * `queryFn` for the statistics-chart-data read.
 */
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

/**
 * `queryFn` for the statistics-detail read.
 */
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

// ---------------------------------------------------------------------------
// queryOptions factories
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Protected server functions
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Type-only re-exports
// ---------------------------------------------------------------------------

export type StatisticsSummary = z.infer<typeof StatisticsSummarySchema>;
export type StatisticsChartData = z.infer<typeof StatisticsChartPointSchema>;
export type StatisticsDetailData = z.infer<typeof StatisticsDetailRowSchema>;
