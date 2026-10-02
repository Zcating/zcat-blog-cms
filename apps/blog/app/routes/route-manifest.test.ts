import { describe, expect, it } from 'vitest';

import {
  createMemoryHistory,
  createRouter,
  type AnyRoute,
} from '@tanstack/react-router';

import { routeTree } from '../routeTree.gen';

const loaderFreeRouter = createRouter({ routeTree });

/**
 * Reads the route a URL resolves to without running any loader.
 */
function matchRoute(pathname: string) {
  const [, params, found] = loaderFreeRouter.getMatchedRoutes(pathname);
  return { id: found?.id, params };
}

function findRouteById(id: string): AnyRoute {
  let found: AnyRoute | undefined;
  const walk = (route: AnyRoute) => {
    if (route.id === id) found = route;
    for (const child of route.children ?? []) walk(child);
  };
  walk(routeTree);
  if (!found) throw new Error(`no route with id ${id}`);
  return found;
}

/**
 * Runs the real matcher. Only safe for URLs whose routes declare no loader,
 * which is every route this phase added.
 */
async function resolve(pathname: string) {
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [pathname] }),
  });
  await router.load();
  const matches = router.state.matches;
  const deepest = matches.at(-1);
  const route = deepest ? findRouteById(deepest.routeId) : undefined;
  return {
    id: deepest?.routeId,
    isLeaf: Boolean(deepest) && !route?.children,
    rendersNotFound: matches.some((match) => match._notFound),
  };
}

const TOOLBOX_PAGES = [
  ['/toolbox', '/toolbox/', '工具箱'],
  ['/toolbox/aes-crypto', '/toolbox/aes-crypto', 'AES 加解密'],
  [
    '/toolbox/base64-to-image',
    '/toolbox/base64-to-image',
    '图片和 Base64 互转',
  ],
  ['/toolbox/hash', '/toolbox/hash', 'Hash 计算工具'],
  ['/toolbox/id-card-generator', '/toolbox/id-card-generator', '身份证生成'],
  ['/toolbox/ip-lookup', '/toolbox/ip-lookup', 'IP 查询'],
  ['/toolbox/json-viewer', '/toolbox/json-viewer', 'JSON 结构化工具'],
  [
    '/toolbox/markdown-to-html',
    '/toolbox/markdown-to-html',
    'Markdown 转 HTML',
  ],
  ['/toolbox/qrcode-generator', '/toolbox/qrcode-generator', '二维码生成器'],
  ['/toolbox/rsa-crypto', '/toolbox/rsa-crypto', 'RSA 加解密'],
] as const;

describe('migrated toolbox URLs', () => {
  it.each(TOOLBOX_PAGES)('%s renders the %s page', async (pathname, id) => {
    const resolved = await resolve(pathname);

    expect(resolved.id).toBe(id);
    expect(resolved.isLeaf).toBe(true);
    expect(resolved.rendersNotFound).toBe(false);
  });

  it.each(TOOLBOX_PAGES)(
    '%s is backed by a real page with its own title',
    (_pathname, id, title) => {
      const route = findRouteById(id);

      expect(route.options.component).toBeTypeOf('function');
      const head = route.options.head?.({} as never) as
        | { meta?: Array<Record<string, string>> }
        | undefined;
      expect(head?.meta).toContainEqual({ title });
    },
  );
});

describe('migrated ai-chat and XML feed URLs', () => {
  it('renders the ai-chat page', async () => {
    const resolved = await resolve('/ai-chat');

    expect(resolved.id).toBe('/ai-chat');
    expect(resolved.isLeaf).toBe(true);
    expect(resolved.rendersNotFound).toBe(false);
  });

  it.each([
    ['/rss.xml', '/rss.xml'],
    ['/sitemap.xml', '/sitemap.xml'],
  ])(
    'the bracket-escaped feed file is reachable at %s',
    async (pathname, id) => {
      const resolved = await resolve(pathname);

      expect(resolved.id).toBe(id);
      expect(resolved.isLeaf).toBe(true);
    },
  );
});

describe('detail URLs still reach their detail route, not the parent list', () => {
  it.each([
    ['/post-board/21', '/_blog/post-board_/$id', '21'],
    ['/gallery/12', '/_blog/gallery_/$id', '12'],
  ])('%s resolves to %s', (pathname, id, segment) => {
    const match = matchRoute(pathname);

    expect(match.id).toBe(id);
    expect(match.params.id).toBe(segment);
  });
});

describe('the root document advertises the live feeds', () => {
  it('links the RSS feed for autodiscovery', () => {
    const head = routeTree.options.head?.({} as never) as
      | { links?: Array<Record<string, string>> }
      | undefined;

    expect(head?.links).toContainEqual({
      rel: 'alternate',
      type: 'application/rss+xml',
      title: 'ZCAT Blog',
      href: '/rss.xml',
    });
  });
});

describe('unknown URLs fall through to the root not-found screen', () => {
  it.each([
    '/toolbox/not-a-tool',
    '/toolbox/markdown-to-html/extra',
    '/ai-chat/extra',
    '/nope',
  ])('%s', async (pathname) => {
    const resolved = await resolve(pathname);

    expect(resolved.rendersNotFound).toBe(true);
  });

  it('keeps the root not-found screen wired', () => {
    expect(routeTree.options.notFoundComponent).toBeDefined();
    expect(routeTree.options.errorComponent).toBeDefined();
  });
});
