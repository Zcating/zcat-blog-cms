import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import {
  statisticsChartDataOptions,
  statisticsSummaryOptions,
} from '@cms/server/statistics';

import DashboardPage from './dashboard';

// Chart rendering is a browser-only visual boundary; the page behavior under
// test is the stats content and refresh control, not Ant Design's renderer.
vi.mock('../components/charts', () => ({
  VisitTrend: () => <div data-testid="visit-trend" />,
  TopPages: () => <div data-testid="top-pages" />,
}));

const summary = {
  totalVisits: 100,
  totalUniqueVisitors: 50,
  todayVisits: 10,
  todayUniqueVisitors: 5,
  topPages: [{ pagePath: '/posts', pageTitle: 'Posts', visitCount: 8 }],
};

const chartData = [{ date: '2026-09-25', visits: 10, uniqueVisitors: 5 }];

function renderDashboard() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  queryClient.setQueryData(statisticsSummaryOptions().queryKey, summary);
  queryClient.setQueryData(statisticsChartDataOptions().queryKey, chartData);

  return render(
    <QueryClientProvider client={queryClient}>
      <DashboardPage />
    </QueryClientProvider>,
  );
}

describe('DashboardPage', () => {
  it('renders summary values from the Query cache', () => {
    renderDashboard();

    expect(screen.getByRole('heading', { name: '仪表盘' })).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument();
    expect(screen.getByText('访问趋势（最近7天）')).toBeInTheDocument();
    expect(screen.getByText('热门页面（最近7天）')).toBeInTheDocument();
  });

  it('exposes a refresh control for the statistics queries', () => {
    renderDashboard();

    expect(
      screen.getByRole('button', { name: '刷新数据' }),
    ).toBeInTheDocument();
  });
});
