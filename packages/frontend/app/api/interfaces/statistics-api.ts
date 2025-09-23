import { HttpClient } from '../http';

export namespace StatisticsApi {
  interface StatisticsSummary {
    totalVisits: number;
    totalUniqueVisitors: number;
    todayVisits: number;
    todayUniqueVisitors: number;
    topPages: {
      pagePath: string;
      pageTitle: string;
      visitCount: number;
    }[];
  }
  interface StatisticsChartData {
    date: string;
    visits: number;
    uniqueVisitors: number;
  }
  interface StatisticsDetailData {
    id: number;
    time: string;
    pagePath: string;
    pageTitle: string;
    ip: string;
    location: string;
    browser: string;
    os: string;
    device: string;
  }

  const mockStatisticsData = {
    summary: {
      totalVisits: 12580,
      totalUniqueVisitors: 8420,
      todayVisits: 156,
      todayUniqueVisitors: 98,
      topPages: [
        {
          pagePath: '/blog/article/1',
          pageTitle: 'React 19 新特性详解',
          visitCount: 1250,
        },
        {
          pagePath: '/blog/article/2',
          pageTitle: 'TypeScript 5.0 升级指南',
          visitCount: 980,
        },
        {
          pagePath: '/blog/article/3',
          pageTitle: 'Next.js 14 性能优化',
          visitCount: 756,
        },
        { pagePath: '/blog/about', pageTitle: '关于我们', visitCount: 432 },
        { pagePath: '/blog/contact', pageTitle: '联系我们', visitCount: 298 },
      ],
    },
    chartData: [
      { date: '2024-01-15', visits: 120, uniqueVisitors: 85 },
      { date: '2024-01-16', visits: 156, uniqueVisitors: 102 },
      { date: '2024-01-17', visits: 189, uniqueVisitors: 134 },
      { date: '2024-01-18', visits: 145, uniqueVisitors: 98 },
      { date: '2024-01-19', visits: 203, uniqueVisitors: 156 },
      { date: '2024-01-20', visits: 178, uniqueVisitors: 123 },
      { date: '2024-01-21', visits: 234, uniqueVisitors: 167 },
    ],
    detailData: [
      {
        id: 1,
        time: '2024-01-21 14:30:25',
        pagePath: '/blog/article/1',
        pageTitle: 'React 19 新特性详解',
        ip: '192.168.1.100',
        location: 'Beijing, China',
        browser: 'Chrome 120.0.0.0',
        os: 'Windows 10',
        device: 'Desktop',
      },
      {
        id: 2,
        time: '2024-01-21 14:28:15',
        pagePath: '/blog/article/2',
        pageTitle: 'TypeScript 5.0 升级指南',
        ip: '192.168.1.101',
        location: 'Shanghai, China',
        browser: 'Safari 17.0',
        os: 'macOS 14',
        device: 'Desktop',
      },
      {
        id: 3,
        time: '2024-01-21 14:25:42',
        pagePath: '/blog/about',
        pageTitle: '关于我们',
        ip: '192.168.1.102',
        location: 'Guangzhou, China',
        browser: 'Firefox 121.0',
        os: 'Ubuntu 22.04',
        device: 'Desktop',
      },
    ],
  };

  export function getSummary() {
    return HttpClient.get<StatisticsSummary>('cms/statistics/summary');
  }

  export function getChartData() {
    return HttpClient.get<StatisticsChartData[]>('cms/statistics/chart-data');
  }

  export function getStatistics() {
    return HttpClient.get<StatisticsDetailData[]>('cms/statistics/detail');
  }
}
