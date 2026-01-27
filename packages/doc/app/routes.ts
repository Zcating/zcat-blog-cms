import {
  type RouteConfig,
  index,
  layout,
  route,
} from '@react-router/dev/routes';

export default [
  layout('routes/layout.tsx', [
    index('routes/home.page.tsx'),
    route('/:component', 'routes/index.page.tsx'),
  ]),
] satisfies RouteConfig;
