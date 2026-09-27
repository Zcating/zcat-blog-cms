import { StaggerReveal, ZPagination, ZView } from '@zcat/ui';
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router';
import { z } from 'zod';

import { safePositiveNumber } from '@blog/common';
import { PostExcerptCard } from '@blog/features';
import { getArticleList } from '@blog/server/article';

const SITE = 'https://blog.zcat.example';

const postBoardSearchSchema = z.looseObject({
  page: z.coerce.number().int().positive().optional(),
});

interface PostBoardLoaderArgs {
  search: { page?: string | number };
}

export async function loader({ search }: PostBoardLoaderArgs) {
  const page = safePositiveNumber(search.page, 1);

  const pagination = await getArticleList({
    data: { page, pageSize: 10, order: 'latest' },
  });

  return { pagination, page };
}

export const Route = createFileRoute('/_blog/post-board')({
  validateSearch: postBoardSearchSchema,
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

function PostBoardPage() {
  const { pagination, page } = Route.useLoaderData();
  const navigate = useNavigate();

  const goToPage = (nextPage: number) => {
    navigate({ to: '/post-board', search: { page: String(nextPage) } });
  };

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
        {pagination.data.map((article, index) => (
          <Link
            data-post-excerpt-card="true"
            key={index.toString()}
            to="/post-board/$id"
            params={{ id: String(article.id) }}
            preload="intent"
            className="block"
          >
            <PostExcerptCard value={article} />
          </Link>
        ))}

        <ZPagination
          page={page}
          totalPages={pagination.totalPages}
          onPageChange={goToPage}
        />
      </StaggerReveal>
    </ZView>
  );
}
