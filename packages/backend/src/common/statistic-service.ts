import { Injectable } from '@nestjs/common';

import { Statistic } from '@backend/prisma';

import { Request } from 'express';

import { hashTest } from '@backend/utils/hash';

import { PrismaService } from './prisma.service';

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

@Injectable()
export class StatisticService {
  private readonly osList = [
    'macOS',
    'Windows',
    'iOS',
    'iPadOS',
    'Android',
    'Linux',
  ];

  constructor(private readonly prisma: PrismaService) {}

  /**
   * 记录博客访客
   * @param {Request} request 请求对象
   * @param {BlogVisitorDto} visitorDto 博客访客记录DTO
   * @returns {Promise<void>}
   */
  async recordVisitor(
    request: Request,
    visitorDto: BlogVisitorDto,
  ): Promise<void> {
    const hash = request.headers['data-hash'] as string;
    const result = hashTest(visitorDto, hash);
    if (!result) {
      return;
    }

    if (!visitorDto.browser || !visitorDto.os || !visitorDto.device) {
      return;
    }

    if (!this.osList.includes(visitorDto.os)) {
      return;
    }

    // 获取客户端IP
    const clientIp =
      request.ip || (request.headers['x-forwarded-for'] as string) || 'unknown';

    // 获取referrer信息
    const referrer = visitorDto.referrer || request.get('Referer') || '';

    // 创建统计记录，直接使用前端传递的设备信息
    // 异步入库

    await this.prisma.statistic.create({
      data: {
        pagePath: visitorDto.pagePath,
        pageTitle: visitorDto.pageTitle,
        browser: visitorDto.browser,
        os: visitorDto.os,
        device: visitorDto.device,
        deviceId: visitorDto.deviceId,
        ip: clientIp,
        referrer,
      },
    });
  }

  /**
   * 获取统计数据（分页）
   */
  async getStatistics(
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
    const total = await this.prisma.statistic.count({
      where: condition,
    });

    // 获取分页数据
    const data = await this.prisma.statistic.findMany({
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
   * 获取统计摘要
   */
  async getSummary(): Promise<StatisticsSummary> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // 总访问量
    const totalVisits = await this.prisma.statistic.count();

    // 总独立访客数（按设备ID去重）
    const totalUniqueVisitors = await this.prisma.statistic.groupBy({
      by: ['deviceId'],
      _count: {
        deviceId: true,
      },
    });

    // 今日访问量
    const todayVisits = await this.prisma.statistic.count({
      where: {
        time: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    // 今日独立访客数（按设备ID去重）
    const todayUniqueVisitors = await this.prisma.statistic.groupBy({
      by: ['deviceId'],
      where: {
        time: {
          gte: today,
          lt: tomorrow,
        },
      },
      _count: {
        ip: true,
      },
    });

    // 热门页面（最近7天）
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const topPagesData = await this.prisma.statistic.groupBy({
      by: ['pagePath', 'pageTitle'],
      where: {
        time: {
          gte: sevenDaysAgo,
        },
        pagePath: {
          not: null,
        },
      },
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: 10,
    });

    const topPages = topPagesData.map((item) => ({
      pagePath: item.pagePath || '',
      pageTitle: item.pageTitle || item.pagePath || '',
      visitCount: item._count.id,
    }));

    return {
      totalVisits,
      totalUniqueVisitors: totalUniqueVisitors.length,
      todayVisits,
      todayUniqueVisitors: todayUniqueVisitors.length,
      topPages,
    };
  }

  /**
   * 获取图表数据
   */
  async getChartData(days: number = 7): Promise<StatisticsChartData[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days + 1);
    startDate.setHours(0, 0, 0, 0);

    // 生成日期范围
    const dateRange: Date[] = [];
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      dateRange.push(date);
    }

    // 获取每天的统计数据
    const chartData: StatisticsChartData[] = [];

    for (const date of dateRange) {
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      // 当天访问量
      const visits = await this.prisma.statistic.count({
        where: {
          time: {
            gte: date,
            lt: nextDate,
          },
        },
      });

      // 当天独立访客数
      const uniqueVisitorsData = await this.prisma.statistic.groupBy({
        by: ['ip'],
        where: {
          time: {
            gte: date,
            lt: nextDate,
          },
        },
        _count: {
          ip: true,
        },
      });

      chartData.push({
        date: date.toISOString().split('T')[0],
        visits,
        uniqueVisitors: uniqueVisitorsData.length,
      });
    }

    return chartData;
  }
}
