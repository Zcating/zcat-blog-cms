import {
  LineChartOutlined,
  SmileOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Line, Column } from '@ant-design/plots';
import { Card, CardContent, CardHeader, CardTitle, ZButton } from '@zcat/ui';
import React from 'react';

import { StatisticsApi } from '@cms/api';

import type { Route } from './+types/dashboard';

// 模拟API调用 - 实际项目中应该从API获取数据

export async function clientLoader({ request }: Route.LoaderArgs) {
  // 在实际项目中，这里应该调用API获取统计数据
  // const statisticsApi = new StatisticsApi();
  const [summary, chartData, detailData] = await Promise.all([
    StatisticsApi.getSummary(),
    StatisticsApi.getChartData(),
    StatisticsApi.getStatistics(),
  ]);

  return {
    summary,
    chartData,
    detailData,
  };
}

export default function DashboardPage(props: Route.ComponentProps) {
  const { summary, chartData, detailData } = props.loaderData;

  // 统计卡片数据
  const statsCards = [
    {
      title: '总访问量',
      value: summary.totalVisits.toLocaleString(),
      icon: (
        <TeamOutlined
          style={{ color: 'oklch(62.3% 0.214 259.815)' }}
          className="text-3xl"
        />
      ),
    },
    {
      title: '独立访客',
      value: summary.totalUniqueVisitors.toLocaleString(),
      icon: (
        <UserOutlined
          style={{ color: 'oklch(72.3% 0.219 149.579)' }}
          className="text-3xl"
        />
      ),
    },
    {
      title: '今日访问',
      value: summary.todayVisits.toLocaleString(),
      icon: (
        <LineChartOutlined
          style={{ color: 'oklch(70.5% 0.213 47.604)' }}
          className="text-3xl"
        />
      ),
    },
    {
      title: '今日访客',
      value: summary.todayUniqueVisitors.toLocaleString(),
      icon: (
        <SmileOutlined
          style={{ color: 'oklch(62.7% 0.265 303.9)' }}
          className="text-3xl"
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">仪表盘</h1>
        <ZButton onClick={() => window.location.reload()}>刷新数据</ZButton>
      </div>

      {/* 统计卡片 */}
      <div className="flex gap-5">
        {statsCards.map((card, index) => (
          <Card key={index} className="text-center flex-1">
            <CardContent className="flex flex-col items-center gap-2">
              {card.icon}
              <div className="text-sm text-muted-foreground">{card.title}</div>
              <p className="text-3xl font-bold text-gray-900">{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 访问趋势图表 */}
      <Card>
        <CardHeader>
          <CardTitle>访问趋势（最近7天）</CardTitle>
        </CardHeader>
        <CardContent>
          <Line
            data={chartData.flatMap((item) => [
              { date: item.date, value: item.visits, category: '访问量' },
              {
                date: item.date,
                value: item.uniqueVisitors,
                category: '独立访客',
              },
            ])}
            height={300}
            xField="date"
            yField="value"
            seriesField="category"
            color={['#3b82f6', '#10b981']}
            point={{
              size: 4,
              shape: 'circle',
            }}
            tooltip={{
              shared: true,
              showCrosshairs: true,
            }}
            legend={{
              position: 'top-right',
            }}
            smooth={true}
            animation={{
              appear: {
                animation: 'path-in',
                duration: 1000,
              },
            }}
          />
        </CardContent>
      </Card>

      {/* 热门页面 */}
      <Card>
        <CardHeader>
          <CardTitle>热门页面（最近7天）</CardTitle>
        </CardHeader>
        <CardContent>
          <Column
            data={summary.topPages}
            height={300}
            xField="pageTitle"
            yField="visitCount"
            color="#8884d8"
            columnWidthRatio={0.6}
            label={{
              position: 'top',
              style: {
                fill: '#666',
                fontSize: 12,
              },
            }}
            tooltip={{
              formatter: (datum: { pageTitle: string; visitCount: number }) => {
                return {
                  name: '访问量',
                  value: datum.visitCount,
                };
              },
            }}
            xAxis={{
              label: {
                autoRotate: true,
                autoHide: true,
                style: {
                  fontSize: 12,
                },
              },
            }}
            yAxis={{
              label: {
                formatter: (v: any) => `${v}`,
              },
            }}
            animation={{
              appear: {
                animation: 'grow-in-y',
                duration: 1000,
              },
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
