import { useNavigate } from 'react-router';

import { ArticlesApi } from '@cms/api';
import { ArticleViewer, Workspace } from '@cms/core';

import type { Route } from './+types/articles.id';

export async function clientLoader(props: Route.ClientLoaderArgs) {
  const id = Number(props.params.id);
  if (isNaN(id)) {
    throw new Error('文章ID无效');
  }

  const article = await ArticlesApi.getArticle(id);
  return {
    article,
  };
}

export default function Article({ loaderData }: Route.ComponentProps) {
  const article = loaderData.article;

  const navigate = useNavigate();

  // 开始编辑
  const handleEdit = () => {
    navigate(`/articles/edit?id=${article.id}`);
  };

  return (
    <Workspace title="文章详情">
      <ArticleViewer article={article} onEdit={handleEdit} />
    </Workspace>
  );
}
