import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';

import { StatisticService } from '@backend/common';
import { createResult, ResultCode } from '@backend/model';

import { prismaService } from '../../../services';

import { StatisticQueryDtoSchema } from './statistics.schema';

const statisticsRoutes = new Hono().basePath('/api/cms/statistics');

const statisticService = new StatisticService(prismaService);

// GET /detail - 获取统计数据
statisticsRoutes.get(
  '/detail',
  zValidator('query', StatisticQueryDtoSchema),
  async (c) => {
    try {
      const query = c.req.valid('query');
      const { pagePath, page = 1, limit = 10, ip, browser, os, device } = query;

      console.log('开始获取统计数据');

      const result = await statisticService.getStatistics(
        { pagePath, ip, browser, os, device },
        page,
        limit,
      );

      console.log('成功获取统计数据');

      return c.json(
        createResult({
          code: ResultCode.Success,
          message: '成功',
          data: result,
        }),
      );
    } catch (error) {
      console.error('获取统计数据失败', error);
      throw error;
    }
  },
);

// GET /summary - 获取统计摘要
statisticsRoutes.get('/summary', async (c) => {
  try {
    console.log('开始获取统计摘要');

    const summary = await statisticService.getSummary();

    console.log('成功获取统计摘要');

    return c.json(
      createResult({
        code: ResultCode.Success,
        message: '成功',
        data: summary,
      }),
    );
  } catch (error) {
    console.error('获取统计摘要失败', error);
    throw error;
  }
});

// GET /chart-data - 获取图表数据
statisticsRoutes.get(
  '/chart-data',
  zValidator('query', z.object({ days: z.string().optional().default('7') })),
  async (c) => {
    try {
      const { days } = c.req.valid('query');

      console.log(`开始获取图表数据，天数: ${days}`);

      const daysCount = parseInt(days, 10) || 7;
      const chartData = await statisticService.getChartData(daysCount);

      console.log('成功获取图表数据');

      return c.json(
        createResult({
          code: ResultCode.Success,
          message: '成功',
          data: chartData,
        }),
      );
    } catch (error) {
      console.error('获取图表数据失败', error);
      throw error;
    }
  },
);

export default statisticsRoutes;
