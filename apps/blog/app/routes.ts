import {
  type RouteConfig,
  index,
  layout,
  route,
} from '@react-router/dev/routes';
export default [
  layout('features/layouts/views/blog.layout.tsx', [
    index('routes/index/home.page.tsx'),
    route('post-board', 'routes/index/post-board.tsx'),
    route('post-board/:id', 'routes/index/post-board.id.tsx'),
    route('about', 'routes/index/about.tsx'),
    route('gallery', 'routes/index/gallery.tsx'),
    route('gallery/:id', 'routes/index/gallery.id.tsx'),
  ]),
  layout('features/layouts/views/ai-chat.layout.tsx', [
    route('ai-chat', 'routes/ai-chat/ai-chat.page.tsx', [
      { lazy: () => import('./routes/ai-chat/ai-chat.page') },
    ]),
  ]),
  layout('features/layouts/views/toolbox.layout.tsx', [
    route('toolbox', 'routes/toolbox/home.page.tsx', [
      { lazy: () => import('./routes/toolbox/home.page') },
    ]),
    route('toolbox/base64-to-image', 'routes/toolbox/base64-to-image.page.tsx', [
      { lazy: () => import('./routes/toolbox/base64-to-image.page') },
    ]),
    route('toolbox/id-card-generator', 'routes/toolbox/id-card-generator.page.tsx', [
      { lazy: () => import('./routes/toolbox/id-card-generator.page') },
    ]),
    route('toolbox/ip-lookup', 'routes/toolbox/ip-lookup.page.tsx', [
      { lazy: () => import('./routes/toolbox/ip-lookup.page') },
    ]),
    route('toolbox/hash', 'routes/toolbox/hash.page.tsx', [
      { lazy: () => import('./routes/toolbox/hash.page') },
    ]),
    route('toolbox/rsa-crypto', 'routes/toolbox/rsa-crypto.page.tsx', [
      { lazy: () => import('./routes/toolbox/rsa-crypto.page') },
    ]),
    route('toolbox/json-viewer', 'routes/toolbox/json-viewer.page.tsx', [
      { lazy: () => import('./routes/toolbox/json-viewer.page') },
    ]),
    route('toolbox/aes-crypto', 'routes/toolbox/aes-crypto.page.tsx', [
      { lazy: () => import('./routes/toolbox/aes-crypto.page') },
    ]),
    route('toolbox/qrcode-generator', 'routes/toolbox/qrcode-generator.page.tsx', [
      { lazy: () => import('./routes/toolbox/qrcode-generator.page') },
    ]),
    route('toolbox/markdown-to-html', 'routes/toolbox/markdown-to-html.page.tsx', [
      { lazy: () => import('./routes/toolbox/markdown-to-html.page') },
    ]),
  ]),
] satisfies RouteConfig;
