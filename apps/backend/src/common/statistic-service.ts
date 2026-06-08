import { Request } from 'express';

import { Statistic } from '@backend/prisma';
import { hashTest } from '@backend/utils/hash';
import { Cache } from '@backend/utils/cache';
import { logger } from '@backend/utils';

import { prismaService } from './prisma.service';

// 博客访客记录DTO
interface BlogVisitorDto {
  pagePath: string;
  pageTitle: string;
  referrer: string;
  browser: string;
  os: string;
  device: string;
  deviceId: string;
  hmac: string;
}

// 统计查询条件
export interface StatisticQueryCondition {
  pagePath?: string;
  ip?: string;
  browser?: string;
  os?: string;
  device?: string;
}

// 统计摘要数据
export interface StatisticsSummary {
  totalVisits: number;
  totalUniqueVisitors: number;
  todayVisits: number;
  todayUniqueVisitors: number;
  topPages: Array<{
    pagePath: string;
    pageTitle: string;
    visitCount: number;
  }>;
}

// 图表数据
export interface StatisticsChartData {
  date: string;
  visits: number;
  uniqueVisitors: number;
}

/**
 * Anonymize a client IP for storage (GDPR / privacy).
 * IPv4: keep first 3 octets, zero the last. IPv6: keep first 48 bits, zero the rest.
 */
function maskClientIp(ip: string): string {
  if (!ip || ip === 'unknown') {
    return ip;
  }
  if (ip.includes(':')) {
    const parts = ip.split(':');
    if (parts.length < 3) {
      return 'unknown';
    }
    const head = parts.slice(0, 3).join(':');
    const tailLen = Math.max(parts.length - 3, 0);
    return head + ':' + Array(tailLen).fill('0').join(':');
  }
  const octets = ip.split('.');
  if (octets.length !== 4) {
    return 'unknown';
  }
  return octets[0] + '.' + octets[1] + '.' + octets[2] + '.0';
}

const osList = ['macOS', 'Windows', 'iOS', 'iPadOS', 'Android', 'Linux'];

// 60s in-memory cache for the dashboard summary; shared across requests.
const summaryCache = new Cache<StatisticsSummary>(1000, 60);

/**
 * 记录博客访客
 */
export async function recordVisitor(
  request: Request,
  visitorDto: BlogVisitorDto,
): Promise<void> {
  const hash = request.headers['data-hash'] as string;
  const result = hashTest(visitorDto, hash);
  if (!result) {
    logger.warn(
      { event: 'hmac_failed', pagePath: visitorDto.pagePath },
      'HMAC validation failed',
    );
    return;
  }

  if (!visitorDto.browser || !visitorDto.os || !visitorDto.device) {
    return;
  }

  if (!osList.includes(visitorDto.os)) {
    return;
  }

  // 获取客户端IP
  const clientIp =
    request.ip || (request.headers['x-forwarded-for'] as string) || 'unknown';
  const maskedIp = maskClientIp(clientIp);

  // 获取referrer信息
  const referrer = visitorDto.referrer || request.get('Referer') || '';

  // 创建统计记录，直接使用前端传递的设备信息
  // 异步入库

  await prismaService.statistic.create({
    data: {
      pagePath: visitorDto.pagePath,
      pageTitle: visitorDto.pageTitle,
      browser: visitorDto.browser,
      os: visitorDto.os,
      device: visitorDto.device,
      deviceId: visitorDto.deviceId,
      ip: maskedIp,
      referrer,
    },
  });
}

/**
 * 获取统计数据（分页）
 */
export async function getStatistics(
  condition: StatisticQueryCondition,
  page: number = 1,
  limit: number = 10,
): Promise<{
  data: Statistic[];
  total: number;
  page: number;
  limit: number;
}> {
  // 获取总数
  const total = await prismaService.statistic.count({
    where: condition,
  });

  // 获取分页数据
  const data = await prismaService.statistic.findMany({
    where: condition,
    orderBy: {
      time: 'desc',
    },
    skip: (page - 1) * limit,
    take: limit,
  });

  return {
    data,
    total,
    page,
    limit,
  };
}

/**
 * 获取统计摘要（并发查询 + 60s 内存缓存）
 */
export async function getSummary(): Promise<StatisticsSummary> {
  const cached = summaryCache.get('summary:v1');
  if (cached) {
    return cached;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  // 并发执行 4 个独立计数 + 1 个 topPages groupBy
  const [totalVisits, totalUniqueVisitors, todayVisits, todayUniqueVisitors, topPagesData] =
    await Promise.all([
      prismaService.statistic.count(),
      prismaService.statistic.groupBy({
        by: ['deviceId'],
        _count: { deviceId: true },
      }),
      prismaService.statistic.count({
        where: { time: { gte: today, lt: tomorrow } },
      }),
      prismaService.statistic.groupBy({
        by: ['deviceId'],
        where: { time: { gte: today, lt: tomorrow } },
        _count: { ip: true },
      }),
      prismaService.statistic.groupBy({
        by: ['pagePath', 'pageTitle'],
        where: { time: { gte: sevenDaysAgo }, pagePath: { not: null } },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      }),
    ]);

  const topPages = topPagesData.map((item: { pagePath: string | null; pageTitle: string | null; _count: { id: number } }) => ({
    pagePath: item.pagePath || '',
    pageTitle: item.pageTitle || item.pagePath || '',
    visitCount: item._count.id,
  }));

  const summary: StatisticsSummary = {
    totalVisits,
    totalUniqueVisitors: totalUniqueVisitors.length,
    todayVisits,
    todayUniqueVisitors: todayUniqueVisitors.length,
    topPages,
  };

  summaryCache.set('summary:v1', summary);
  return summary;
}

/**
 * 获取图表数据（单次拉取 + 应用层按天分桶，从 2N 次查询降到 1 次）
 */
export async function getChartData(
  days: number = 7,
): Promise<StatisticsChartData[]> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days + 1);
  startDate.setHours(0, 0, 0, 0);

  // 一次拉取时间戳，应用层按 YYYY-MM-DD 聚合
  const rows = await prismaService.statistic.findMany({
    where: { time: { gte: startDate } },
    select: { time: true, ip: true },
  });

  // 初始化空白日
  const buckets = new Map<string, { visits: number; uniqueIps: Set<string> }>();
  for (let i = 0; i < days; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().split('T')[0];
    buckets.set(key, { visits: 0, uniqueIps: new Set() });
  }

  for (const row of rows) {
    const key = row.time.toISOString().split('T')[0];
    const bucket = buckets.get(key);
    if (!bucket) continue;
    bucket.visits += 1;
    bucket.uniqueIps.add(row.ip);
  }

  return Array.from(buckets.entries()).map(([date, b]) => ({
    date,
    visits: b.visits,
    uniqueVisitors: b.uniqueIps.size,
  }));
}
