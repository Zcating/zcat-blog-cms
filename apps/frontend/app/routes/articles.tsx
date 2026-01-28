import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ZButton,
  ZDialog,
  safeNumber,
} from '@zcat/ui';
import React from 'react';
import { useNavigate } from 'react-router';

import { ArticlesApi } from '@cms/api';
import { PaginationWorkspace, useLoadingFn } from '@cms/core';

import type { Route } from './+types/articles';

export async function clientLoader({ request }: Route.ClientLoaderArgs) {
  const url = new URL(request.url);
  const page = safeNumber(url.searchParams.get('page'), 1);
  const pageSize = safeNumber(url.searchParams.get('pageSize'), 10);

  const pagination = await ArticlesApi.getArticles({
    page,
    pageSize,
  });

  return { pagination };
}

export function ErrorBoundary() {
  return <div>发生错误</div>;
}

export default function Articles(props: Route.ComponentProps) {
  const { pagination } = props.loaderData;

  const [articles, setArticles] = React.useState(pagination.data);

  const navigate = useNavigate();

  const handleClick = () => {
    navigate('/articles/edit');
  };

  const deleteArticles = useLoadingFn(async (article: ArticlesApi.Article) => {
    if (!article.id) {
      return;
    }
    const isConfirmed = await ZDialog.confirm({
      title: '温馨提示',
      content: `确定删除文章"${article.title}"吗？`,
    });
    if (!isConfirmed) {
      return;
    }
    await ArticlesApi.deleteArticle(article.id);
    setArticles((prev) => prev.filter((item) => item.id !== article.id));
  });

  return (
    <PaginationWorkspace
      title="文章列表"
      operation={<ZButton onClick={handleClick}>新增文章</ZButton>}
      pageSize={pagination.pageSize}
      totalPages={pagination.totalPages}
      page={pagination.page}
    >
      <div className="flex flex-col gap-5">
        {articles.map((article) => (
          <Card key={article.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{article.title}</CardTitle>
            </CardHeader>
            <CardContent className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {article.excerpt}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <ZButton onClick={() => navigate(`/articles/${article.id}`)}>
                  详情
                </ZButton>
                <ZButton
                  variant="destructive"
                  onClick={() => deleteArticles(article)}
                  loading={deleteArticles.loading}
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
