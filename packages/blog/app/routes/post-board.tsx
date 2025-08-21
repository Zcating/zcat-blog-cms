import { ArticleApi } from "@blog/apis";
import { Link } from "react-router";
import type { Route } from "./post-board/+types/post-board-page";
import { View } from "@blog/components";
import { PostExcerptCard } from "@blog/modules/post";

export function meta() {
  return [{ title: "文章" }, { name: "description", content: "个人技术博客" }];
}

export async function clientLoader() {
  return {
    pagination: await ArticleApi.getArticleList(),
  };
}

export default function PostBoardPage({ loaderData }: Route.ComponentProps) {
  const articles = loaderData.pagination.data;
  return (
    <View className="max-w-4xl mx-auto space-y-4">
      <h1>博客文章</h1>
      {articles.map((article) => (
        <Link to={`/post-board/${article.id}`} className="block">
          <PostExcerptCard value={article} />
        </Link>
      ))}
    </View>
  );
}
