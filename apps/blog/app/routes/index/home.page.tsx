import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ZView,
  ZAvatar,
  ZPagination,
  ZSelect,
  StaggerReveal,
  Calendar,
} from '@zcat/ui';
import { useState } from 'react';
import { createSearchParams, Link, useNavigate } from 'react-router';

import { ArticleApi, UserApi } from '@blog/apis';
import { PostExcerptCard } from '@blog/features';
import { safePositiveNumber } from '@blog/utils';

import type { Route } from '../index/+types/home.page';

/**
 * 排序选项
 */
const SORT_OPTIONS = [
  { value: 'latest', label: '最新' },
  { value: 'oldest', label: '最早' },
] as CommonOption<ArticleApi.OrderEnum>[];

/**
 * 首页文章列表加载器
 * @param {Route.LoaderArgs} params
 * @returns
 */
export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const page = safePositiveNumber(url.searchParams.get('page'), 1);
  const order = (url.searchParams.get('order') ??
    'latest') as ArticleApi.OrderEnum;

  return {
    userInfo: await UserApi.getUserInfo(),
    pagination: await ArticleApi.getArticleList({
      page: Number.isFinite(page) && page > 0 ? page : 1,
      pageSize: 10,
      order: order,
    }),
    page: Number.isFinite(page) && page > 0 ? page : 1,
    order,
  };
}

export function meta() {
  return [
    { title: 'ZCAT - 我知道你在看' },
    { name: 'description', content: '个人技术博客' },
  ];
}

/**
 * 首页文章列表实现
 *
 */
export default function HomePage(props: Route.ComponentProps) {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const loaderData = props.loaderData;
  const userInfo = loaderData.userInfo;
  const pagination = loaderData.pagination;
  const currentPage = loaderData.page;
  const order = loaderData.order;
  const navigate = useNavigate();

  const toSearch = (nextPage: number, nextOrder: ArticleApi.OrderEnum) =>
    `?${createSearchParams({
      page: String(nextPage),
      order: nextOrder,
    })}`;

  const goToPage = (page: number) => {
    navigate(toSearch(page, order));
  };

  const handleOrderChange = (value: ArticleApi.OrderEnum) => {
    navigate(toSearch(1, value));
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
              <ZAvatar
                alt={userInfo.name}
                src={userInfo.avatar}
                fallback={userInfo.name}
              />
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
                selected={date}
                onSelect={setDate}
                className="rounded-md border shadow-sm"
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
              to={`/post-board/${article.id}`}
              className="block"
              key={index}
            >
              <PostExcerptCard value={article} />
            </Link>
          ))}
        </StaggerReveal>
      </ZView>
      <ZPagination
        page={currentPage}
        totalPages={pagination.totalPages}
        onPageChange={goToPage}
      />
    </ZView>
  );
}
