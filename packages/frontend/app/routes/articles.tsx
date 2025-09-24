import { ArticlesApi } from '@cms/api';
import { useNavigate } from 'react-router';
import type { Route } from './+types/articles';
import { Button, Card, List, Row } from '@cms/components';

export async function clientLoader() {
  const articles = await ArticlesApi.getArticles();
  return { articles };
}

export function ErrorBoundary() {
  return <div>发生错误</div>;
}

export default function Articles(props: Route.ComponentProps) {
  const { loaderData } = props;

  const navigate = useNavigate();
  const handleClick = () => {
    navigate('/articles/create');
  };
  return (
    <div className="space-y-10">
      <div className="text-2xl font-bold">文章列表</div>
      <div>
        <button className="btn btn-primary" onClick={handleClick}>
          新增文章
        </button>
      </div>
      <List
        data={loaderData.articles}
        contentContainerClassName="px-10 gap-5"
        renderItem={(article) => (
          <Card>
            <Card.Body>
              <Row justify="between">
                <div>
                  <h2 className="card-title">{article.title}</h2>
                  <p className="card-text">{article.excerpt}</p>
                </div>
                <div>
                  <Button
                    variant="primary"
                    onClick={() => navigate(`/articles/${article.id}`)}
                  >
                    详情
                  </Button>
                </div>
              </Row>
            </Card.Body>
          </Card>
        )}
      />
    </div>
  );
}
