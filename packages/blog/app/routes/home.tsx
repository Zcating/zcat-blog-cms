import { View } from "@blog/components";
import { ArticleApi } from "@blog/apis";
import { PostExcerptCard } from "@blog/modules";
import { Link } from "react-router";
import type { Route } from "./+types/home";

export function meta() {
  return [
    { title: "我的博客" },
    { name: "description", content: "个人技术博客" },
  ];
}

export async function loader() {
  return {
    pagination: await ArticleApi.getArticleList(),
  };
}

// 首页文章列表实现
export default function HomePage(props: Route.ComponentProps) {
  const articles = props.loaderData.pagination.data;
  return (
    <View className="max-w-4xl mx-auto space-y-4">
      {articles.map((article, index) => (
        <Link to={`/post-board/${article.id}`} className="block" key={index}>
          <PostExcerptCard value={article} />
        </Link>
      ))}
    </View>
  );
}
