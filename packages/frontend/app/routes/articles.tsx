import { ArticlesApi } from '@cms/api';
import { useNavigate } from 'react-router';

export async function clientLoader() {
  const articles = await ArticlesApi.getArticles();
  return articles;
}

export function ErrorBoundary() {
  return <div>发生错误</div>;
}

export default function Articles() {
  const navigate = useNavigate();
  const handleClick = () => {
    navigate('/articles/create');
  };
  return (
    <div>
      <h1>文章列表</h1>
      <div>
        <button className="btn btn-primary" onClick={handleClick}>
          新增文章
        </button>
      </div>
    </div>
  );
}
