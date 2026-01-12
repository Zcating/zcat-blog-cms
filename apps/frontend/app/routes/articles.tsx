import React from 'react';
import { useNavigate } from 'react-router';

import { ArticlesApi } from '@cms/api';
import {
  Button,
  Card,
  Dialog,
  List,
  Pagination,
  Row,
  useLoadingFn,
} from '@cms/components';
import { Workspace } from '@cms/core';

import type { Route } from './+types/articles';

export async function clientLoader() {
  const pagination = await ArticlesApi.getArticles({
    page: 1,
  });
  return { pagination };
}

export function ErrorBoundary() {
  return <div>发生错误</div>;
}

export default function Articles(props: Route.ComponentProps) {
  const pagination = props.loaderData.pagination;

  const [articles, setArticles] = React.useState(pagination.data);

  const navigate = useNavigate();
  const handleClick = () => {
    navigate('/articles/edit');
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

  const handlePageChange = useLoadingFn(async (page: number) => {
    const result = await ArticlesApi.getArticles({
      page: page,
    });
    setArticles(result.data);
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
        contentContainerClassName="gap-5"
        FooterComponent={
          <div className="mt-10 mr-10 flex justify-end">
            <Pagination
              totalPages={pagination.totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        }
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
