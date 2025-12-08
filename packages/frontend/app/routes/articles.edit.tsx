import { ArticlesApi } from '@cms/api';
import { ArticleEditor, Workspace } from '@cms/core';
import React from 'react';
import type { Route } from './+types/articles.edit';
import { createSearchParams, useNavigate, useNavigation } from 'react-router';

export async function clientLoader(props: Route.ClientLoaderArgs) {
  // const id = Number(params.id);
  // if (isNaN(id)) {
  //   throw new Error('文章ID无效');
  // }
  const searchParams = new URLSearchParams(props.request.url.split('?')[1]);
  const id = Number(searchParams.get('id'));
  if (isNaN(id)) {
    return {
      article: {
        id: 0,
        title: '',
        excerpt: '',
        content: '',
      },
    };
  }
  const article = await ArticlesApi.getArticle(id);
  return {
    article,
  };
  // console.log(props);
}

export default function ArticleEdit({ loaderData }: Route.ComponentProps) {
  const article: ArticlesApi.Article = loaderData.article;

  const navigate = useNavigate();

  // 保存文章
  const handleSave = async (article: ArticlesApi.Article) => {
    React.startTransition(async () => {
      await ArticlesApi.updateArticle(article);
      navigate(`/articles/${article.id}`);
    });
  };

  return (
    <ArticleEditor
      article={article}
      onSave={handleSave}
      onCancel={() => navigate(-1)}
    />
  );
}
