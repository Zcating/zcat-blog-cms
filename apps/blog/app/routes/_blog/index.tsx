import {
  Card,
  StaggerReveal,
  ZImagePreload,
  ZView,
  ZWaterfall,
} from '@zcat/ui';
import { Link, createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

import { Hero, PostExcerptCard } from '@blog/features';
import { getArticleList } from '@blog/server/article';
import { getPhotoList } from '@blog/server/photo';
import { getUserInfo } from '@blog/server/user';

import type { Article } from '@blog/server/article/schemas';
import type { GetArticleListInput } from '@blog/server/article/schemas';
import type { PhotoFeedItem } from '@blog/server/photo/schemas';

const SITE = 'https://blog.zcat.example';

const ARTICLE_COUNT = 5;
const PHOTO_COUNT = 12;
const PHOTOS_PER_ARTICLE = 2;

type Order = GetArticleListInput['order'];

const homeSearchSchema = z.looseObject({
  order: z.enum(['latest', 'oldest']).optional(),
});

export type HomeGridItem =
  | { kind: 'photo'; photo: PhotoFeedItem }
  | { kind: 'article'; article: Article };

interface HomeLoaderArgs {
  search: { page?: number; order?: Order };
}

export function buildHomeGridItems(
  articles: Article[],
  photos: PhotoFeedItem[],
): HomeGridItem[] {
  const items: HomeGridItem[] = [];
  let articleIndex = 0;
  let photoIndex = 0;
  let photosSinceArticle = 0;

  while (articleIndex < articles.length || photoIndex < photos.length) {
    const photoRoom = photos.length - photoIndex;
    const articleRoom = articles.length - articleIndex;

    if (
      articleRoom > 0 &&
      photosSinceArticle >= PHOTOS_PER_ARTICLE &&
      articleRoom <= photoRoom
    ) {
      items.push({ kind: 'article', article: articles[articleIndex]! });
      articleIndex += 1;
      photosSinceArticle = 0;
      continue;
    }

    if (photoRoom > 0) {
      items.push({ kind: 'photo', photo: photos[photoIndex]! });
      photoIndex += 1;
      photosSinceArticle += 1;
      continue;
    }

    items.push({ kind: 'article', article: articles[articleIndex]! });
    articleIndex += 1;
    photosSinceArticle = 0;
  }

  return items;
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

function HomePage() {
  const { userInfo, items } = Route.useLoaderData();

  return (
    <ZView className="flex flex-col gap-5 px-4 md:px-10">
      <Hero userInfo={userInfo} />
      <StaggerReveal
        selector='[data-home-grid-item="true"]'
        direction="bottom"
        dependencies={[items]}
      >
        <ZWaterfall
          data={items}
          columnCount={4}
          columnCountConfig={{ sm: 2, lg: 3 }}
          renderItem={(item) => <HomeGridItemCard item={item} />}
        />
      </StaggerReveal>
    </ZView>
  );
}

function HomeGridItemCard({ item }: { item: HomeGridItem }) {
  if (item.kind === 'photo') {
    return <PhotoCard photo={item.photo} />;
  }
  return (
    <Link
      to="/post-board/$id"
      params={{ id: String(item.article.id) }}
      preload="intent"
      className="block"
    >
      <PostExcerptCard value={item.article} />
    </Link>
  );
}

function PhotoCard({ photo }: { photo: PhotoFeedItem }) {
  return (
    <Link
      to="/gallery/$id"
      params={{ id: String(photo.albumId) }}
      preload="intent"
      className="block"
    >
      <Card
        data-home-grid-item="true"
        className="group relative p-0! overflow-hidden"
      >
        <ZImagePreload src={photo.url} />
        <ZView className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/50 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <p className="text-xl font-bold text-white text-center px-4">
            {photo.name}
          </p>
          <p className="text-sm text-white/80">{photo.albumName}</p>
        </ZView>
      </Card>
    </Link>
  );
}
