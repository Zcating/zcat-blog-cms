import {
  Calendar,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  RainbowBorder,
  StaggerReveal,
  ZAvatar,
  ZPagination,
  ZSelect,
  ZView,
} from '@zcat/ui';
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router';
import { z } from 'zod';

import { safePositiveNumber } from '@blog/common';
import { PostExcerptCard } from '@blog/features';
import { getArticleList } from '@blog/server/article';
import { getUserInfo } from '@blog/server/user';

import type { GetArticleListInput } from '@blog/server/article/schemas';

const SITE = 'https://blog.zcat.example';

type Order = GetArticleListInput['order'];

const SORT_OPTIONS = [
  { value: 'latest', label: '最新' },
  { value: 'oldest', label: '最早' },
] as CommonOption<Order>[];

const homeSearchSchema = z.looseObject({
  page: z.string().optional(),
  order: z.enum(['latest', 'oldest']).optional(),
});

type HomeSearch = z.infer<typeof homeSearchSchema>;

interface HomeLoaderArgs {
  search: HomeSearch;
}

export async function loader({ search }: HomeLoaderArgs) {
  const page = safePositiveNumber(search.page, 1);
  const order: Order = search.order ?? 'latest';

  const [userInfo, pagination] = await Promise.all([
    getUserInfo(),
    getArticleList({ data: { page, pageSize: 10, order } }),
  ]);

  return { userInfo, pagination, page, order };
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
  const { userInfo, pagination, page, order } = Route.useLoaderData();
  const navigate = useNavigate();

  const toSearch = (nextPage: number, nextOrder: Order) => ({
    page: String(nextPage),
    order: nextOrder,
  });

  const goToPage = (nextPage: number) => {
    navigate({ to: '/', search: toSearch(nextPage, order) });
  };

  const handleOrderChange = (value: Order) => {
    navigate({ to: '/', search: toSearch(1, value) });
  };

  return (
    <ZView className="flex flex-col gap-5">
      <ZView className="px-4 flex gap-12 overflow-x-hidden">
        <StaggerReveal
          selector='[data-home-left-card="true"]'
          className="sticky flex flex-col gap-3 self-start"
        >
          <Card data-home-left-card="true" className="w-xs">
            <CardHeader className="flex justify-center">
              <RainbowBorder className="rounded-full">
                <ZAvatar
                  alt={userInfo.name}
                  src={userInfo.avatar}
                  fallback={userInfo.name}
                />
              </RainbowBorder>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 items-center">
              <p className="text-2xl font-bold">{userInfo.name}</p>
              <p className="text-lg">噢！你来了！</p>
            </CardContent>
          </Card>
          <Card data-home-left-card="true" className="w-xs">
            <CardHeader>
              <CardTitle>文章排序</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 items-center">
              <ZSelect
                className="w-full"
                options={SORT_OPTIONS}
                value={order}
                onValueChange={handleOrderChange}
              />
            </CardContent>
          </Card>
          <Card data-home-left-card="true" className="w-xs">
            <CardHeader>
              <CardTitle>日历</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Calendar
                mode="single"
                className="rounded-md border shadow-sm"
                aria-hidden="true"
              />
            </CardContent>
          </Card>
        </StaggerReveal>
        <StaggerReveal
          className="flex-1 flex flex-col gap-5"
          selector='[data-home-article-card="true"]'
          direction="right"
          dependencies={[pagination]}
        >
          {pagination.data.map((article, index) => (
            <Link
              data-home-article-card="true"
              to="/post-board/$id"
              params={{ id: String(article.id) }}
              preload="intent"
              className="block"
              key={index}
            >
              <PostExcerptCard value={article} />
            </Link>
          ))}
        </StaggerReveal>
      </ZView>
      <ZPagination
        page={page}
        totalPages={pagination.totalPages}
        onPageChange={goToPage}
      />
    </ZView>
  );
}
