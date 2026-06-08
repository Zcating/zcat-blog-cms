import { StaggerReveal, ZView, ZPagination } from '@zcat/ui';
import { Link, useNavigate } from 'react-router';

import { ArticleApi } from '@blog/apis';
import { safePositiveNumber } from '@blog/common';
import { PostExcerptCard } from '@blog/features';

import type { Route } from '../index/+types/post-board';

export function meta() {
  const SITE = 'https://blog.zcat.example';
  return [
    { title: '文章 - ZCAT' },
    { name: 'description', content: '个人技术博客文章列表' },
    { property: 'og:type', content: 'website' },
    { property: 'og:title', content: '文章 - ZCAT' },
    { property: 'og:description', content: '个人技术博客文章列表' },
    { property: 'og:url', content: `${SITE}/post-board` },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: '文章 - ZCAT' },
    { name: 'twitter:description', content: '个人技术博客文章列表' },
    { tagName: 'link', rel: 'canonical', href: `${SITE}/post-board` },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const page = safePositiveNumber(url.searchParams.get('page'), 1);

  return {
    pagination: await ArticleApi.getArticleList({
      page: page,
      pageSize: 10,
      order: 'latest',
    }),
    page,
  };
}

export default function PostBoardPage({ loaderData }: Route.ComponentProps) {
  const pagination = loaderData.pagination;
  const currentPage = loaderData.page;
  const navigate = useNavigate();

  const toSearch = (nextPage: number) => `?page=${nextPage}`;

  const goToPage = (page: number) => {
    navigate(toSearch(page));
  };

  const articles = pagination.data;
  return (
    <ZView className="flex flex-col items-center overflow-x-hidden">
      <StaggerReveal
        className="max-w-4xl space-y-4"
        selector='[data-post-excerpt-card="true"]'
        direction="right"
      >
        <ZView data-post-excerpt-card="true" className="text-2xl font-bold">
          博客文章
        </ZView>
        {articles.map((article, index) => (
          <Link
            data-post-excerpt-card="true"
            key={index.toString()}
            to={`/post-board/${article.id}`}
            prefetch="intent"
            className="block"
          >
            <PostExcerptCard value={article} />
          </Link>
        ))}

        <ZPagination
          page={currentPage}
          totalPages={pagination.totalPages}
          onPageChange={goToPage}
        />
      </StaggerReveal>
    </ZView>
  );
}
