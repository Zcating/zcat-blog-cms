import { ArticlesApi } from '@cms/api';
import { useNavigate } from 'react-router';
import type { Route } from './+types/articles';
import { Button, Card, Dialog, List, Row, useLoadingFn } from '@cms/components';
import { Workspace } from '@cms/core';
import React from 'react';

export async function clientLoader() {
  const articles = await ArticlesApi.getArticles();
  return { articles };
}

export function ErrorBoundary() {
  return <div>发生错误</div>;
}

export default function Articles(props: Route.ComponentProps) {
  const { loaderData } = props;

  const [articles, setArticles] = React.useState(loaderData.articles);

  const navigate = useNavigate();
  const handleClick = () => {
    navigate('/articles/create');
  };
  const deleteArticles = useLoadingFn(async (article: ArticlesApi.Article) => {
    if (!article.id) {
      return;
    }
    const isConfirmed = await Dialog.confirm({
      title: '温馨提示',
      content: `确定删除文章“${article.title}”吗？`,
    });
    if (!isConfirmed) {
      return;
    }
    await ArticlesApi.deleteArticle(article.id);
    setArticles(articles.filter((item) => item.id !== article.id));
  });

  return (
    <Workspace
      title="文章列表"
      operation={
        <Button variant="primary" onClick={handleClick}>
          新增文章
        </Button>
      }
    >
      <List
        data={articles}
        contentContainerClassName="px-10 gap-5"
        renderItem={(article) => (
          <Card>
            <Card.Body>
              <Row justify="between">
                <div>
                  <h2 className="card-title">{article.title}</h2>
                  <p className="card-text">{article.excerpt}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="primary"
                    onClick={() => navigate(`/articles/${article.id}`)}
                  >
                    详情
                  </Button>
                  <Button
                    variant="error"
                    onClick={() => deleteArticles(article)}
                  >
                    删除
                  </Button>
                </div>
              </Row>
            </Card.Body>
          </Card>
        )}
      />
    </Workspace>
  );
}
