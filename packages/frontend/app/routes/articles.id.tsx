import React from 'react';
import { ArticlesApi } from '@cms/api';
import { ArticleEditor, ArticleViewer, Workspace } from '@cms/core';
import type { Route } from './+types/articles.id';
import { useNavigate } from 'react-router';

export async function clientLoader({ params }: Route.ClientLoaderArgs) {
  const isCreating = params.id === 'create';
  if (isCreating) {
    return {
      article: {
        id: 0,
        title: '',
        excerpt: '',
        content: '',
      } as ArticlesApi.Article,
      isCreating,
    };
  }
  const id = Number(params.id);
  if (isNaN(id)) {
    throw new Error('文章ID无效');
  }

  const article = await ArticlesApi.getArticle(id);
  return {
    article,
    isCreating,
  };
}

export default function Article({ loaderData }: Route.ComponentProps) {
  const [article, setArticle] = React.useState(loaderData.article);
  const [optimisticArticle, setOptimisticArticle] = React.useOptimistic(
    article,
    (prev, values: ArticlesApi.Article) => ({
      ...prev,
      ...values,
    }),
  );
  const [isEditing, setIsEditing] = React.useState(!article.id);

  const navigate = useNavigate();

  // 保存文章
  const handleSave = async (article: ArticlesApi.Article) => {
    React.startTransition(async () => {
      setOptimisticArticle(article);
      setIsEditing(false);

      if (article.id === 0) {
        const result = await ArticlesApi.createArticle(article);
        await navigate(`/articles/${result.id}`);
        setArticle(result);
      } else {
        const updated = await ArticlesApi.updateArticle({
          id: article.id,
          title: article.title,
          excerpt: article.excerpt,
          content: article.content,
        });
        setArticle(updated);
      }
      setIsEditing(false);
    });
  };

  // 取消编辑
  const handleCancel = async () => {
    if (loaderData.isCreating) {
      await navigate('/articles');
      return;
    }
    setIsEditing(false);
  };

  // 开始编辑
  const handleEdit = () => {
    setIsEditing(true);
  };

  return (
    <Workspace title="文章详情">
      {isEditing ? (
        <ArticleEditor
          article={optimisticArticle}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      ) : (
        <ArticleViewer article={article} onEdit={handleEdit} />
      )}
    </Workspace>
  );
}
