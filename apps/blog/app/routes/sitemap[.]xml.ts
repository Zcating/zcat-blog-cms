import { createFileRoute } from '@tanstack/react-router';

import { getArticleList } from '@blog/server/article';

const SITE = 'https://blog.zcat.example';

export const Route = createFileRoute('/sitemap.xml')({
  server: {
    handlers: {
      GET: async () => {
        const { data } = await getArticleList({
          data: { page: 1, pageSize: 1000, order: 'latest' },
        });
        const staticUrls = ['', 'post-board', 'about', 'gallery'];
        const urls = [
          ...staticUrls.map((p) => ({
            loc: `${SITE}/${p}`,
            lastmod: new Date().toISOString(),
          })),
          ...data.map((a) => ({
            loc: `${SITE}/post-board/${a.id}`,
            lastmod: a.updatedAt,
          })),
        ];
        const xml =
          '<?xml version="1.0" encoding="UTF-8"?>' +
          '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' +
          urls
            .map(
              (u) =>
                `<url><loc>${u.loc}</loc><lastmod>${u.lastmod}</lastmod></url>`,
            )
            .join('') +
          '</urlset>';
        return new Response(xml, {
          headers: { 'Content-Type': 'application/xml' },
        });
      },
    },
  },
});
