import React from 'react';
import { ArticlesApi } from '@cms/api';
import { ArticleEditor, ArticleViewer, Workspace } from '@cms/core';
import type { Route } from './+types/articles.id';
import { useLoadingFn } from '@cms/components';
import { useNavigate } from 'react-router';

export async function clientLoader({ params }: Route.ClientLoaderArgs) {
  const isCreating = params.id === 'create';
  if (isCreating) {
    return {
      article: {
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
  const [isEditing, setIsEditing] = React.useState(!article.id);

  const navigate = useNavigate();

  // 保存文章
  const handleSave = useLoadingFn(async (article: ArticlesApi.Article) => {
    if (!article.id) {
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
          article={article}
          onSave={handleSave}
          onCancel={handleCancel}
          loading={handleSave.loading}
        />
      ) : (
        <ArticleViewer article={article} onEdit={handleEdit} />
      )}
    </Workspace>
  );
}
