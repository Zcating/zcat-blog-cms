import { ArticleApi } from '@blog/apis';

const SITE = 'https://blog.zcat.example';

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function loader() {
  const { data } = await ArticleApi.getArticleList({
    page: 1,
    pageSize: 20,
    order: 'latest',
  });
  const items = data
    .map(
      (a) => `<item>
        <title>${escapeXml(a.title)}</title>
        <link>${SITE}/post-board/${a.id}</link>
        <guid>${SITE}/post-board/${a.id}</guid>
        <pubDate>${new Date(a.publishAt).toUTCString()}</pubDate>
        <description>${escapeXml(a.excerpt)}</description>
      </item>`,
    )
    .join('');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>ZCAT Blog</title>
    <link>${SITE}</link>
    <description>个人技术博客</description>
    <language>zh-CN</language>
    ${items}
  </channel>
</rss>`;
  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml' } });
}
