import { Line, Column } from '@ant-design/plots';

import type { StatisticsChartData, StatisticsSummary } from '@cms/api';

interface VisitTrendProps {
  data: StatisticsChartData[];
}

export function VisitTrend({ data }: VisitTrendProps) {
  return (
    <Line
      data={data.flatMap((item) => [
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
  );
}

interface TopPagesProps {
  data: StatisticsSummary['topPages'];
}

export function TopPages({ data }: TopPagesProps) {
  return (
    <Column
      data={data}
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
  );
}
