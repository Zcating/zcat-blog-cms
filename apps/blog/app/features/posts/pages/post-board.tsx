import { StaggerReveal, ZPagination, ZView } from '@zcat/ui';
import { Link, getRouteApi, useNavigate } from '@tanstack/react-router';

import { PostExcerptCard } from '../components/post-excerpt-card';

const routeApi = getRouteApi('/_blog/post-board');

export function PostBoardPage() {
  const { pagination, page } = routeApi.useLoaderData();
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
