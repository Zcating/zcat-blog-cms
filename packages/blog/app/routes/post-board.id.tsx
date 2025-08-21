import { View } from "@blog/components";
import { PostContentView } from "@blog/modules";
import { ArticleApi } from "@blog/apis";
import type { Route } from "./+types/post-board.id";

export function meta() {
  return [{ title: "文章" }, { name: "description", content: "个人技术博客" }];
}

export async function clientLoader({ params }: Route.LoaderArgs) {
  const { id } = params;
  const article = await ArticleApi.getArticleDetail(id);
  if (!article) {
    throw new Error("文章不存在");
  }
  return {
    article: article,
  };
}

// export function ErrorBoundary() {
//   const error = useRouteError();
//   if (error instanceof Error) {
//     return ;
//   }
// }

export default function PostBoardDetailPage({
  loaderData,
}: Route.ComponentProps) {
  const article = loaderData.article;
  return (
    <View>
      <PostContentView value={article} />
    </View>
  );
}
