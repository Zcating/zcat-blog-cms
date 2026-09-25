/**
 * Minimal `/dashboard` route registered only so the TanStack Start
 * generated route tree compiles.
 *
 * Phase 3a scope: this file exists so:
 *   - the generated `routeTree.gen.ts` exposes a `/dashboard` route
 *     that the login redirect can target without an `as never` cast;
 *   - the shell can compile end-to-end with the `_cms` layout
 *     registered.
 *
 * Phase 3b will migrate the full dashboard data wiring (summary,
 * chart data, top pages). That lane owns `StatisticsApi`, the
 * `chartData` / `summary` loaders, and the lazy chart components.
 * Until then this stub renders a single placeholder card so the
 * route is functional.
 */

import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_cms/dashboard')({
  component: DashboardPlaceholder,
});

function DashboardPlaceholder() {
  return (
    <div className="w-full p-4">
      <h1 className="text-2xl font-bold text-gray-900">仪表盘</h1>
      <p className="mt-2 text-muted-foreground">
        仪表盘数据接入将在 Phase 3b 完成。
      </p>
    </div>
  );
}
