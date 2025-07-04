import {
  type RouteConfig,
  index,
  layout,
  route,
} from '@react-router/dev/routes';

export default [
  index('routes/home.tsx'),
  route('login', 'routes/login.tsx'),
  layout('routes/cms-layout.tsx', [
    route('dashboard', 'routes/dashboard.tsx'),
    route('articles', 'routes/articles.tsx'),
    route('articles/:id', 'routes/articles.id.tsx'),
    route('article-categories', 'routes/article-categories.tsx'),
    route('albums', 'routes/albums.tsx'),
    route('albums/:id', 'routes/albums.id.tsx'),
    route('photos', 'routes/photos.tsx'),
    route('user-info', 'routes/user-info.tsx'),
    route('settings', 'routes/settings.tsx'),
  ]),
] satisfies RouteConfig;
