import { Controller, Get, Query, UseGuards, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';

import {
  StatisticService,
  StatisticsSummary,
  StatisticsChartData,
} from '@backend/common';
import { createResult, ResultCode, ResultData } from '@backend/model';
import { Statistic } from '@backend/prisma';

import { JwtAuthGuard } from '../jwt-auth.guard';
import { StatisticQueryDto } from '../schemas';

@ApiTags('访问统计管理')
@Controller('api/cms/statistics')
export class StatisticsController {
  private readonly logger = new Logger(StatisticsController.name);

  constructor(private readonly statisticService: StatisticService) {}

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

      const result = await this.statisticService.getStatistics(
        condition,
        page,
        limit,
      );

      this.logger.log(`成功获取统计数据，共 ${result.total} 条记录`);

      return createResult({
        code: ResultCode.Success,
        message: '成功',
        data: result,
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

      const summary = await this.statisticService.getSummary();

      this.logger.log('成功获取统计摘要数据');

      return createResult({
        code: ResultCode.Success,
        message: '成功',
        data: summary,
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
      const chartData = await this.statisticService.getChartData(daysCount);

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
