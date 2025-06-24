import { ArticlesApi } from "@/api";

export async function clientLoader() {
  const articles = await ArticlesApi.getArticles();
  return articles;
}

export function ErrorBoundary() {
  return <div>发生错误</div>;
}

export default function Articles() {
  return (
    <div>
      <h1>文章列表</h1>
    </div>
  );
}
