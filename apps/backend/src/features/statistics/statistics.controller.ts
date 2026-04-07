import { Controller, Get, Query, UseGuards, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';

import { StatisticsChartData, StatisticsSummary } from '@backend/common';
import { createResult, ResultCode, ResultData } from '@backend/model';
import { Statistic } from '@backend/prisma';

import { CmsJwtAuthGuard } from '../cms/cms-jwt-auth.guard';

import { StatisticQueryDto } from './statistics.schema';
import { StatisticsService } from './statistics.service';

@ApiTags('访问统计管理')
@Controller('api/cms/statistics')
export class StatisticsController {
  private readonly logger = new Logger(StatisticsController.name);

  constructor(private readonly statisticsService: StatisticsService) {}

  @Get('/detail')
  @UseGuards(CmsJwtAuthGuard)
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
    this.logger.log('开始获取统计数据');
    const result = await this.statisticsService.getStatistics(query);
    return createResult({
      code: ResultCode.Success,
      message: '成功',
      data: result,
    });
  }

  @Get('/summary')
  @UseGuards(CmsJwtAuthGuard)
  @ApiOperation({ summary: '获取统计摘要' })
  @ApiResponse({ status: 200, description: '成功获取统计摘要' })
  async getSummary(): Promise<ResultData<StatisticsSummary>> {
    const summary = await this.statisticsService.getSummary();
    return createResult({
      code: ResultCode.Success,
      message: '成功',
      data: summary,
    });
  }

  @Get('/chart-data')
  @UseGuards(CmsJwtAuthGuard)
  @ApiOperation({ summary: '获取图表数据' })
  @ApiQuery({ name: 'days', description: '天数', example: 7, required: false })
  @ApiResponse({ status: 200, description: '成功获取图表数据' })
  async getChartData(
    @Query('days') days: string = '7',
  ): Promise<ResultData<StatisticsChartData[]>> {
    const chartData = await this.statisticsService.getChartData(days);
    return createResult({
      code: ResultCode.Success,
      message: '成功',
      data: chartData,
    });
  }
}
