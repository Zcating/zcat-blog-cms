import {
  type RouteConfig,
  index,
  layout,
  route,
} from '@react-router/dev/routes';

export default [
  layout('routes/layout.tsx', [
    index('routes/home-page.tsx'),
    route('button', 'routes/components/button-page.tsx'),
    route('select', 'routes/components/select-page.tsx'),
    route('pagination', 'routes/components/pagination-page.tsx'),
    route('view', 'routes/components/view-page.tsx'),
    route('avatar', 'routes/components/avatar-page.tsx'),
    route('z-image', 'routes/components/z-image-page.tsx'),
    route('cascader', 'routes/components/cascader-page.tsx'),
    route('markdown', 'routes/components/z-markdown-page.tsx'),
    route('stagger-reveal', 'routes/animation/stagger-reveal-page.tsx'),
  ]),
] satisfies RouteConfig;
