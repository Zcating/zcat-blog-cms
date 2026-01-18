import { safeNumber } from '@zcat/ui';
import { useNavigate } from 'react-router';

import { ArticlesApi } from '@cms/api';
import { ArticleEditor, OssAction } from '@cms/core';

import type { Route } from './+types/articles.edit';

export async function clientLoader(props: Route.ClientLoaderArgs) {
  const url = new URL(props.request.url);
  const id = safeNumber(url.searchParams.get('id'));
  if (!id) {
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
    let result: ArticlesApi.Article;
    if (article.id === 0) {
      result = await OssAction.createArticle(article);
    } else {
      result = await OssAction.updateArticle(article);
    }
    navigate(`/articles/${result.id}`);
  };

  return (
    <ArticleEditor
      article={article}
      onSave={handleSave}
      onCancel={() => navigate('/articles')}
    />
  );
}
