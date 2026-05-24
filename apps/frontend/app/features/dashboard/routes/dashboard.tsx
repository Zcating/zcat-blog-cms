import {
  LineChartOutlined,
  SmileOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ZButton,
  useClient,
} from '@zcat/ui';
import { lazy, Suspense } from 'react';

import { StatisticsApi } from '@cms/api';

import type { Route } from './+types/dashboard';

const VisitTrend = lazy(() =>
  import('../components/charts').then((m) => ({ default: m.VisitTrend })),
);

const TopPages = lazy(() =>
  import('../components/charts').then((m) => ({ default: m.TopPages })),
);

export async function loader() {
  const [summary, chartData] = await Promise.all([
    StatisticsApi.getSummary(),
    StatisticsApi.getChartData(),
  ]);

  return {
    summary,
    chartData,
  };
}

export default function DashboardPage(props: Route.ComponentProps) {
  const { summary, chartData } = props.loaderData;
  const isClient = useClient();

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
    <div className="space-y-6 w-full p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">仪表盘</h1>
        <ZButton onClick={() => window.location.reload()}>刷新数据</ZButton>
      </div>

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

      <Card>
        <CardHeader>
          <CardTitle>访问趋势（最近7天）</CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense
            fallback={
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                加载中...
              </div>
            }
          >
            {isClient && <VisitTrend data={chartData} />}
            {!isClient && <div className="h-75" />}
          </Suspense>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>热门页面（最近7天）</CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense
            fallback={
              <div className="h-75 flex items-center justify-center text-muted-foreground">
                加载中...
              </div>
            }
          >
            {isClient && <TopPages data={summary.topPages} />}
            {!isClient && <div className="h-75" />}
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
