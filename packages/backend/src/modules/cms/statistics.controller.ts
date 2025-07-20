import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';

import { createResult, ResultData } from '@backend/model';
import { PageStatistics } from '@backend/table';

import { Request } from 'express';
import { Repository, Between, Like, FindOperator } from 'typeorm';

import { CreatePageStatisticsDto, PageStatisticsQueryDto } from './dto';
import { JwtAuthGuard } from './jwt-auth.guard';

interface StatisticsResult {
  total: string;
}

interface PageStatisticsResult {
  pagePath: string;
  pageTitle: string;
  visitCount: number;
}

interface PageStatisticsQueryResult {
  totalVisits: number;
  totalUniqueVisitors: number;
  todayVisits: number;
  todayUniqueVisitors: number;
  topPages: Array<PageStatisticsResult>;
}

interface StatisticsChartResult {
  date: string;
  visits: number;
  uniqueVisitors: number;
}

@ApiTags('页面统计管理')
@Controller('api/cms/statistics')
export class StatisticsController {
  constructor(
    @InjectRepository(PageStatistics)
    private statisticsRepository: Repository<PageStatistics>,
  ) {}

  @Post('visit')
  @ApiOperation({ summary: '记录页面访问' })
  @ApiResponse({ status: 200, description: '访问记录成功' })
  async recordVisit(
    @Body() createStatisticsDto: CreatePageStatisticsDto,
    @Req() request: Request,
  ): Promise<ResultData<void>> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const visitorIp =
      createStatisticsDto.visitorIp ||
      request.ip ||
      request.connection.remoteAddress ||
      'unknown';

    // 查找今天该页面的统计记录
    let statistics = await this.statisticsRepository.findOne({
      where: {
        pagePath: createStatisticsDto.pagePath,
        visitDate: today,
      },
    });

    if (statistics) {
      // 更新访问次数
      statistics.visitCount += 1;

      // 检查是否是新的独立访客（简单的IP去重）
      const existingVisitor = await this.statisticsRepository.findOne({
        where: {
          pagePath: createStatisticsDto.pagePath,
          visitDate: today,
          visitorIp: visitorIp,
        },
      });

      if (!existingVisitor) {
        statistics.uniqueVisitors += 1;
      }

      await this.statisticsRepository.save(statistics);
    } else {
      // 创建新的统计记录
      statistics = this.statisticsRepository.create({
        pagePath: createStatisticsDto.pagePath,
        pageTitle: createStatisticsDto.pageTitle,
        visitCount: 1,
        uniqueVisitors: 1,
        visitDate: today,
        visitorIp: visitorIp,
        userAgent: createStatisticsDto.userAgent || request.get('User-Agent'),
        referrer: createStatisticsDto.referrer || request.get('Referer'),
      });

      await this.statisticsRepository.save(statistics);
    }

    return createResult({
      code: '0000',
      message: '访问记录成功',
    });
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '获取页面统计数据' })
  @ApiResponse({ status: 200, description: '成功获取统计数据' })
  async getStatistics(@Query() query: PageStatisticsQueryDto): Promise<
    ResultData<{
      data: PageStatistics[];
      total: number;
      page: number;
      limit: number;
    }>
  > {
    const { pagePath, startDate, endDate, page = 1, limit = 10 } = query;

    const whereConditions: {
      pagePath?: FindOperator<string>;
      visitDate?: FindOperator<Date>;
    } = {};

    if (pagePath) {
      whereConditions.pagePath = Like(`%${pagePath}%`);
    }

    if (startDate && endDate) {
      whereConditions.visitDate = Between(
        new Date(startDate),
        new Date(endDate),
      );
    } else if (startDate) {
      whereConditions.visitDate = Between(new Date(startDate), new Date());
    } else if (endDate) {
      whereConditions.visitDate = Between(
        new Date('1970-01-01'),
        new Date(endDate),
      );
    }

    const [data, total] = await this.statisticsRepository.findAndCount({
      where: whereConditions,
      order: {
        visitDate: 'DESC',
        visitCount: 'DESC',
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    return createResult({
      code: '0000',
      message: '成功',
      data: {
        data,
        total,
        page,
        limit,
      },
    });
  }

  @Get('summary')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '获取统计摘要' })
  @ApiResponse({ status: 200, description: '成功获取统计摘要' })
  async getSummary(): Promise<ResultData<PageStatisticsQueryResult>> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 总访问量
    const totalVisitsResult = await this.statisticsRepository
      .createQueryBuilder('stats')
      .select('SUM(stats.visitCount)', 'total')
      .getRawOne<StatisticsResult>();

    // 总独立访客数
    const totalUniqueVisitorsResult = await this.statisticsRepository
      .createQueryBuilder('stats')
      .select('SUM(stats.uniqueVisitors)', 'total')
      .getRawOne<StatisticsResult>();

    // 今日访问量
    const todayVisitsResult = await this.statisticsRepository
      .createQueryBuilder('stats')
      .select('SUM(stats.visitCount)', 'total')
      .where('stats.visitDate = :today', { today })
      .getRawOne<StatisticsResult>();

    // 今日独立访客数
    const todayUniqueVisitorsResult = await this.statisticsRepository
      .createQueryBuilder('stats')
      .select('SUM(stats.uniqueVisitors)', 'total')
      .where('stats.visitDate = :today', { today })
      .getRawOne<StatisticsResult>();

    // 热门页面（最近7天）
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const topPages = await this.statisticsRepository
      .createQueryBuilder('stats')
      .select('stats.pagePath', 'pagePath')
      .addSelect('stats.pageTitle', 'pageTitle')
      .addSelect('SUM(stats.visitCount)', 'visitCount')
      .where('stats.visitDate >= :sevenDaysAgo', { sevenDaysAgo })
      .groupBy('stats.pagePath')
      .addGroupBy('stats.pageTitle')
      .orderBy('visitCount', 'DESC')
      .limit(10)
      .getRawMany<{
        pagePath: string;
        pageTitle: string;
        visitCount: string;
      }>();

    return createResult({
      code: '0000',
      message: '成功',
      data: {
        totalVisits: parseInt(totalVisitsResult?.total || '0'),
        totalUniqueVisitors: parseInt(totalUniqueVisitorsResult?.total || '0'),
        todayVisits: parseInt(todayVisitsResult?.total || '0'),
        todayUniqueVisitors: parseInt(todayUniqueVisitorsResult?.total || '0'),
        topPages: topPages.map((page) => ({
          pagePath: page.pagePath,
          pageTitle: page.pageTitle || page.pagePath,
          visitCount: parseInt(page.visitCount),
        })),
      },
    });
  }

  @Get('chart-data')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '获取图表数据' })
  @ApiQuery({ name: 'days', description: '天数', example: 7, required: false })
  @ApiResponse({ status: 200, description: '成功获取图表数据' })
  async getChartData(
    @Query('days') days: string = '7',
  ): Promise<ResultData<StatisticsChartResult[]>> {
    const daysCount = parseInt(days) || 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysCount + 1);
    startDate.setHours(0, 0, 0, 0);

    const chartData = await this.statisticsRepository
      .createQueryBuilder('stats')
      .select('stats.visitDate', 'date')
      .addSelect('SUM(stats.visitCount)', 'visits')
      .addSelect('SUM(stats.uniqueVisitors)', 'uniqueVisitors')
      .where('stats.visitDate >= :startDate', { startDate })
      .groupBy('stats.visitDate')
      .orderBy('stats.visitDate', 'ASC')
      .getRawMany<{ date: string; visits: string; uniqueVisitors: string }>();

    return createResult({
      code: '0000',
      message: '成功',
      data: chartData.map((item) => ({
        date: item.date,
        visits: parseInt(item.visits),
        uniqueVisitors: parseInt(item.uniqueVisitors),
      })),
    });
  }
}
