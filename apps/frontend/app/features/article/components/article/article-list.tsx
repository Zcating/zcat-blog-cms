/**
 * Article list page (feature component).
 *
 * Phase 3b contract: the page reads from the TanStack Query cache,
 * never from `useLoaderData` or the legacy `HttpClient`. Pagination,
 * optimistic delete, and the empty / error / loading states are
 * owned by this component. The thin route file in
 * `app/routes/_cms/articles.tsx` is the only place that wires the
 * loader.
 *
 * The list schema deliberately omits `content` and `tags` — the
 * backend's `cms/articles` list endpoint does not project those
 * columns (see `@cms/server/articles/schemas.ts`). Anything that
 * needs the body must load the detail Query.
 */

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ZButton,
  ZDialog,
  safeDateString,
} from '@zcat/ui';
import { useSuspenseQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import React from 'react';

import { articlesListQueryOptions } from '@cms/server/articles';
import type { Article, PaginatedArticles } from '@cms/server/articles/schemas';
import { PaginationWorkspace } from '@cms/core/ui/workspace';

import { useArticleListDelete } from '../../hooks/use-article-list';

interface ArticleListPageProps {
  page: number;
  pageSize: number;
  search: { page?: number; pageSize?: number };
}

export function ArticleListPage({
  page,
  pageSize,
  search,
}: ArticleListPageProps) {
  const navigate = useNavigate();
  const { data } = useSuspenseQuery(
    articlesListQueryOptions({ page, pageSize }),
  );
  const deleteArticle = useArticleListDelete(page, pageSize);

  const articles = data.data;

  const handleCreate = React.useCallback(() => {
    void navigate({ to: '/articles/edit' });
  }, [navigate]);

  const handleView = React.useCallback(
    (id: number) => {
      void navigate({
        to: '/articles/$articleId',
        params: { articleId: String(id) },
      });
    },
    [navigate],
  );

  const handleDelete = React.useCallback(
    async (article: Article) => {
      const confirmed = await ZDialog.confirm({
        title: '温馨提示',
        content: `确定删除文章"${article.title}"吗？`,
      });
      if (!confirmed) return;
      try {
        await deleteArticle({ id: article.id });
      } catch (error) {
        // Optimistic rollback already restored the cache; surface
        // the failure to the user via the global HttpClient
        // notification subscriber (root layout).
        if (error instanceof Error) {
          // eslint-disable-next-line no-console
          console.error('deleteArticle failed:', error.message);
        }
      }
    },
    [deleteArticle],
  );

  if (articles.length === 0) {
    return (
      <PaginationWorkspace
        title="文章列表"
        operation={<ZButton onClick={handleCreate}>新增文章</ZButton>}
        pageSize={pageSize}
        totalPages={Math.max(1, data.totalPages)}
        page={page}
      >
        <div className="py-10 text-center text-muted-foreground">暂无文章</div>
      </PaginationWorkspace>
    );
  }

  return (
    <PaginationWorkspace
      title="文章列表"
      operation={<ZButton onClick={handleCreate}>新增文章</ZButton>}
      pageSize={pageSize}
      totalPages={Math.max(1, data.totalPages)}
      page={page}
    >
      <div className="flex flex-col gap-5">
        {articles.map((article) => (
          <Card key={article.id} data-testid={`article-row-${article.id}`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{article.title}</CardTitle>
              <CardDescription className="text-xs">
                发布时间：
                {safeDateString(article.publishAt, '未发布')}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {article.excerpt}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <ZButton onClick={() => handleView(article.id)}>详情</ZButton>
                <ZButton
                  variant="destructive"
                  onClick={() => void handleDelete(article)}
                >
                  删除
                </ZButton>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </PaginationWorkspace>
  );
}
