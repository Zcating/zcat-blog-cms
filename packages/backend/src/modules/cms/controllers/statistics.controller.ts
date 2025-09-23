import { Controller, Get, Query, UseGuards, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';

import { PrismaService } from '@backend/core';
import { createResult, ResultCode, ResultData } from '@backend/model';
import { Statistic } from '@backend/prisma';

import { StatisticQueryDto } from '../dto';
import { JwtAuthGuard } from '../jwt-auth.guard';

interface StatisticsSummary {
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

interface StatisticsChartData {
  date: string;
  visits: number;
  uniqueVisitors: number;
}

@ApiTags('访问统计管理')
@Controller('api/cms/statistics')
export class StatisticsController {
  private readonly logger = new Logger(StatisticsController.name);

  constructor(private prisma: PrismaService) {}

  @Get('/detail')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '获取统计数据' })
  @ApiResponse({ status: 200, description: '成功获取统计数据' })
  async getStatistics(@Query() query: StatisticQueryDto): Promise<
    ResultData<{
      data: Statistic[];
      total: number;
      page: number;
      limit: number;
    }>
  > {
    try {
      this.logger.log('开始获取统计数据');
      const { pagePath, page = 1, limit = 10, ip, browser, os, device } = query;

      const condition = {
        pagePath,
        ip,
        browser,
        os,
        device,
      };

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

      this.logger.log(`成功获取统计数据，共 ${total} 条记录`);

      return createResult({
        code: ResultCode.Success,
        message: '成功',
        data: {
          data,
          total,
          page,
          limit,
        },
      });
    } catch (error) {
      this.logger.error('获取统计数据失败', error);
      throw error;
    }
  }

  @Get('/summary')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '获取统计摘要' })
  @ApiResponse({ status: 200, description: '成功获取统计摘要' })
  async getSummary(): Promise<ResultData<StatisticsSummary>> {
    try {
      this.logger.log('开始获取统计摘要数据');

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // 总访问量
      const totalVisits = await this.prisma.statistic.count();

      // 总独立访客数（按IP去重）
      const totalUniqueVisitors = await this.prisma.statistic.groupBy({
        by: ['ip'],
        _count: {
          ip: true,
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

      // 今日独立访客数
      const todayUniqueVisitors = await this.prisma.statistic.groupBy({
        by: ['ip'],
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

      this.logger.log('成功获取统计摘要数据');

      return createResult({
        code: ResultCode.Success,
        message: '成功',
        data: {
          totalVisits,
          totalUniqueVisitors: totalUniqueVisitors.length,
          todayVisits,
          todayUniqueVisitors: todayUniqueVisitors.length,
          topPages,
        },
      });
    } catch (error) {
      this.logger.error('获取统计摘要数据失败', error);
      throw error;
    }
  }

  @Get('/chart-data')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '获取图表数据' })
  @ApiQuery({ name: 'days', description: '天数', example: 7, required: false })
  @ApiResponse({ status: 200, description: '成功获取图表数据' })
  async getChartData(
    @Query('days') days: string = '7',
  ): Promise<ResultData<StatisticsChartData[]>> {
    try {
      this.logger.log(`开始获取图表数据，天数: ${days}`);

      const daysCount = parseInt(days) || 7;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysCount + 1);
      startDate.setHours(0, 0, 0, 0);

      // 生成日期范围
      const dateRange: Date[] = [];
      for (let i = 0; i < daysCount; i++) {
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

      this.logger.log(`成功获取图表数据，共 ${chartData.length} 天的数据`);

      return createResult({
        code: ResultCode.Success,
        message: '成功',
        data: chartData,
      });
    } catch (error) {
      this.logger.error('获取图表数据失败', error);
      throw error;
    }
  }
}
