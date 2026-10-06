import { createFileRoute } from '@tanstack/react-router';

import { resolveBlogSiteUrl } from '@blog/server/env';

export const Route = createFileRoute('/robots.txt')({
  server: {
    handlers: {
      GET: async () => {
        const site = resolveBlogSiteUrl();
        const body = `User-agent: *
Allow: /

Sitemap: ${site}/sitemap.xml
`;
        return new Response(body, {
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        });
      },
    },
  },
});
