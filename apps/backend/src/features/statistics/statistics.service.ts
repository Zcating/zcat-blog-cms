import { Injectable } from '@nestjs/common';

import { StatisticService } from '@backend/common';

import { StatisticQueryDto } from './statistics.schema';

@Injectable()
export class StatisticsService {
  constructor(private readonly statisticService: StatisticService) {}

  async getStatistics(query: StatisticQueryDto) {
    const { pagePath, page = 1, limit = 10, ip, browser, os, device } = query;

    return this.statisticService.getStatistics(
      {
        pagePath,
        ip,
        browser,
        os,
        device,
      },
      page,
      limit,
    );
  }

  async getSummary() {
    return this.statisticService.getSummary();
  }

  async getChartData(days: string) {
    const daysCount = parseInt(days, 10) || 7;
    return this.statisticService.getChartData(daysCount);
  }
}
