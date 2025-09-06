import React, { useState } from 'react';
import { ArticlesApi } from '@cms/api';
import { ArticleEditor, ArticleViewer } from '@cms/core/modules';
import type { Route } from './+types/articles.id';
import { useLoadingFn } from '@cms/components';
import { useNavigate } from 'react-router';

export async function clientLoader({ params }: Route.ClientLoaderArgs) {
  if (params.id === 'create') {
    return {
      article: {
        title: '',
        excerpt: '',
        content: '',
      } satisfies ArticlesApi.Article,
    };
  }
  const id = Number(params.id);
  if (isNaN(id)) {
    throw new Error('文章ID无效');
  }

  const article = await ArticlesApi.getArticle(id);
  return {
    article,
  };
}

export default function Article({ loaderData }: Route.ComponentProps) {
  const [article, setArticle] = useState(loaderData.article);
  const [isEditing, setIsEditing] = useState(!article.id);

  const navigate = useNavigate();
  // 保存文章
  const handleSave = useLoadingFn(async (article: ArticlesApi.Article) => {
    if (!article.id) {
      article = await ArticlesApi.createArticle(article);
    } else {
      article = await ArticlesApi.updateArticle(article.id, {
        title: article.title,
        excerpt: article.excerpt,
        content: article.content,
      });
    }
    setIsEditing(false);
    setArticle(article);
    navigate(`/articles/${article.id}`);
  });

  // 取消编辑
  const handleCancel = () => {
    setIsEditing(false);
  };

  // 开始编辑
  const handleEdit = () => {
    setIsEditing(true);
  };

  return (
    <React.Fragment>
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
    </React.Fragment>
  );
}
