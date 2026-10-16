import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

import { HomePage, buildHomeGridItems } from '@blog/features';
import { getArticleList } from '@blog/server/article';
import { getPhotoList } from '@blog/server/photo';
import { getUserInfo } from '@blog/server/user';

import type { GetArticleListInput } from '@blog/server/article/schemas';

const SITE = 'https://blog.zcat.example';

const ARTICLE_COUNT = 5;
const PHOTO_COUNT = 12;

type Order = GetArticleListInput['order'];

const homeSearchSchema = z.looseObject({
  order: z.enum(['latest', 'oldest']).optional(),
});

interface HomeLoaderArgs {
  search: { page?: number; order?: Order };
}

export async function loader({ search }: HomeLoaderArgs) {
  const order: Order = search.order ?? 'latest';

  const [userInfo, articles, photos] = await Promise.all([
    getUserInfo(),
    getArticleList({ data: { page: 1, pageSize: ARTICLE_COUNT, order } }),
    getPhotoList({ data: { page: 1, pageSize: PHOTO_COUNT } }),
  ]);

  return {
    userInfo,
    order,
    items: buildHomeGridItems(articles.data, photos.data),
  };
}

export const Route = createFileRoute('/_blog/')({
  validateSearch: homeSearchSchema,
  head: () => ({
    meta: [
      { title: 'ZCAT - 我知道你在看' },
      { name: 'description', content: '个人技术博客' },
      { property: 'og:type', content: 'website' },
      { property: 'og:title', content: 'ZCAT - 我知道你在看' },
      { property: 'og:description', content: '个人技术博客' },
      { property: 'og:url', content: SITE },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: 'ZCAT - 我知道你在看' },
      { name: 'twitter:description', content: '个人技术博客' },
    ],
    links: [{ rel: 'canonical', href: SITE }],
  }),
  loader: ({ location }) => loader({ search: location.search }),
  component: HomePage,
});
