import { createFileRoute } from '@tanstack/react-router';

import DashboardPage from '@cms/features/dashboard/routes/dashboard';
import {
  statisticsChartDataOptions,
  statisticsSummaryOptions,
} from '@cms/server/statistics';

export const Route = createFileRoute('/_cms/dashboard')({
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.query({
        ...statisticsSummaryOptions(),
        staleTime: 'static',
      }),
      context.queryClient.query({
        ...statisticsChartDataOptions(),
        staleTime: 'static',
      }),
    ]),
  component: DashboardPage,
});
