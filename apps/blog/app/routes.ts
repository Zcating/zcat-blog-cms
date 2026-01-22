import {
  type RouteConfig,
  index,
  layout,
  route,
} from '@react-router/dev/routes';
export default [
  layout('features/layouts/blog-layout/blog.layout.tsx', [
    index('routes/index/home.page.tsx'),
    route('post-board', 'routes/index/post-board.tsx'),
    route('post-board/:id', 'routes/index/post-board.id.tsx'),
    route('about', 'routes/index/about.tsx'),
    route('gallery', 'routes/index/gallery.tsx'),
  ]),
  layout('features/layouts/toolbox-layout/toolbox.layout.tsx', [
    route('toolbox', 'routes/toolbox/home.page.tsx'),
    route('toolbox/base64-to-image', 'routes/toolbox/base64-to-image.page.tsx'),
    route(
      'toolbox/id-card-generator',
      'routes/toolbox/id-card-generator.page.tsx',
    ),
    route('toolbox/ip-lookup', 'routes/toolbox/ip-lookup.page.tsx'),
    route('toolbox/hash', 'routes/toolbox/hash.page.tsx'),
    route('toolbox/rsa-crypto', 'routes/toolbox/rsa-crypto.page.tsx'),
  ]),
  route('gallery/:id', 'routes/index/gallery.id.tsx'),
] satisfies RouteConfig;
