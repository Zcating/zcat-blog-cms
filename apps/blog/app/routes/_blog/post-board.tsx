import { createFileRoute } from '@tanstack/react-router';

import { loadPaginatedList, pageParamSchema } from '@blog/common';
import { PostBoardPage } from '@blog/features';
import { getArticleList } from '@blog/server/article';

const SITE = 'https://blog.zcat.example';

interface PostBoardLoaderArgs {
  search: { page?: string | number };
}

export async function loader({ search }: PostBoardLoaderArgs) {
  return loadPaginatedList({
    to: '/post-board',
    search,
    fetch: (page) =>
      getArticleList({ data: { page, pageSize: 10, order: 'latest' } }),
  });
}

export const Route = createFileRoute('/_blog/post-board')({
  validateSearch: pageParamSchema,
  head: () => ({
    meta: [
      { title: '文章 - ZCAT' },
      { name: 'description', content: '个人技术博客文章列表' },
      { property: 'og:type', content: 'website' },
      { property: 'og:title', content: '文章 - ZCAT' },
      { property: 'og:description', content: '个人技术博客文章列表' },
      { property: 'og:url', content: `${SITE}/post-board` },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: '文章 - ZCAT' },
      { name: 'twitter:description', content: '个人技术博客文章列表' },
    ],
    links: [{ rel: 'canonical', href: `${SITE}/post-board` }],
  }),
  loader: ({ location }) => loader({ search: location.search }),
  component: PostBoardPage,
});
