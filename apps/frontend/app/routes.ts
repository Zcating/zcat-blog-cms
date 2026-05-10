import {
  type RouteConfig,
  index,
  layout,
  route,
} from '@react-router/dev/routes';

import { albumRoutes } from './features/album';
import { articleRoutes } from './features/article';
import { authRoutes } from './features/auth';
import { dashboardRoutes } from './features/dashboard';
import { photoRoutes } from './features/photo';
import { settingsRoutes } from './features/settings';
import { userInfoRoutes } from './features/user-info';
import { runWithRequest } from './api/context/request-context';

export const middleware = [
  async ({ request }: { request: Request }, next: () => Promise<unknown>) => {
    return runWithRequest(request, next);
  },
];

export default [
  index('routes/home.tsx'),
  ...Object.values(authRoutes).map((r) => route(r.path, r.module)),
  route('api/bff/*', 'routes/api-bff.$.ts'),
  layout('layouts/cms-layout.tsx', [
    ...Object.values(dashboardRoutes).map((r) => route(r.path, r.module)),
    ...Object.values(articleRoutes).map((r) => route(r.path, r.module)),
    route('article-categories', 'routes/article-categories.tsx'),
    ...Object.values(albumRoutes).map((r) => route(r.path, r.module)),
    ...Object.values(photoRoutes).map((r) => route(r.path, r.module)),
    ...Object.values(userInfoRoutes).map((r) => route(r.path, r.module)),
    ...Object.values(settingsRoutes).map((r) => route(r.path, r.module)),
  ]),
  route('articles/edit', 'features/article/routes/articles.edit.tsx'),
] satisfies RouteConfig;
