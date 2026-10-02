import { LineChart, Smile, User, Users } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ZButton,
  useClient,
} from '@zcat/ui';
import {
  useIsFetching,
  useQueryClient,
  useSuspenseQuery,
} from '@tanstack/react-query';
import { lazy, Suspense } from 'react';

import {
  statisticsChartDataOptions,
  statisticsSummaryOptions,
} from '@cms/server/statistics';

const VisitTrend = lazy(() =>
  import('../components/charts').then((m) => ({ default: m.VisitTrend })),
);

const TopPages = lazy(() =>
  import('../components/charts').then((m) => ({ default: m.TopPages })),
);

export default function DashboardPage() {
  const queryClient = useQueryClient();
  const isClient = useClient();
  const isRefreshing = useIsFetching({ queryKey: ['statistics'] }) > 0;
  const { data: summary } = useSuspenseQuery(statisticsSummaryOptions());
  const { data: chartData } = useSuspenseQuery(statisticsChartDataOptions());

  const statsCards = [
    {
      title: '总访问量',
      value: summary.totalVisits.toLocaleString(),
      icon: <Users style={{ color: 'var(--chart-1)' }} className="text-3xl" />,
    },
    {
      title: '独立访客',
      value: summary.totalUniqueVisitors.toLocaleString(),
      icon: <User style={{ color: 'var(--chart-2)' }} className="text-3xl" />,
    },
    {
      title: '今日访问',
      value: summary.todayVisits.toLocaleString(),
      icon: (
        <LineChart style={{ color: 'var(--chart-3)' }} className="text-3xl" />
      ),
    },
    {
      title: '今日访客',
      value: summary.todayUniqueVisitors.toLocaleString(),
      icon: <Smile style={{ color: 'var(--chart-4)' }} className="text-3xl" />,
    },
  ];

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ['statistics'] });
  };

  return (
    <div className="space-y-6 w-full p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">仪表盘</h1>
        <ZButton onClick={refresh} loading={isRefreshing}>
          刷新数据
        </ZButton>
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
