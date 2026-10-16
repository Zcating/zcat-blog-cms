import { createFileRoute } from '@tanstack/react-router';

import { MarkdownToHtmlPage } from '@blog/features';

export const Route = createFileRoute('/toolbox/markdown-to-html')({
  head: () => ({
    meta: [
      { title: 'Markdown 转 HTML' },
      {
        name: 'description',
        content: '在线将 Markdown 转换为 HTML，支持 GFM 和数学公式',
      },
    ],
  }),
  component: MarkdownToHtmlPage,
});
