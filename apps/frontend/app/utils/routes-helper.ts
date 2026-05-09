import { route } from '@react-router/dev/routes';

type RouteEntry = {
  path: string;
  module: string;
};

export function expandRoutes(routes: Record<string, RouteEntry>) {
  return Object.values(routes).map((r) => route(r.path, r.module));
}
