import {
  type RouteConfig,
  index,
  layout,
  route,
} from '@react-router/dev/routes';

export default [
  layout('routes/layout.tsx', [
    index('routes/home-page.tsx'),
    route('button', 'routes/button-page.tsx'),
    route('select', 'routes/select-page.tsx'),
    route('pagination', 'routes/pagination-page.tsx'),
    route('view', 'routes/view-page.tsx'),
    route('avatar', 'routes/avatar-page.tsx'),
    route('z-image', 'routes/z-image-page.tsx'),
    route('cascader', 'routes/cascader-page.tsx'),
    route('stagger-reveal', 'routes/stagger-reveal-page.tsx'),
  ]),
] satisfies RouteConfig;
