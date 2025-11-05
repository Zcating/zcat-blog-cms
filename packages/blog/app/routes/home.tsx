import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Card,
  CardContent,
  View,
} from "@blog/components";
import { ArticleApi, UserApi } from "@blog/apis";
import { Link } from "react-router";
import type { Route } from "./+types/home";
import { PostExcerptCard } from "@blog/modules";

export function meta() {
  return [
    { title: "我的博客" },
    { name: "description", content: "个人技术博客" },
  ];
}

export async function loader() {
  return {
    userInfo: await UserApi.getUserInfo(),
    pagination: await ArticleApi.getArticleList(),
  };
}

// 首页文章列表实现
export default function HomePage(props: Route.ComponentProps) {
  const articles = props.loaderData.pagination.data;
  const userInfo = props.loaderData.userInfo;
  return (
    <View className="px-4 flex gap-12">
      <View className="absolute top-4 left-3 bottom-3 w-xs">
        <Card className="w-xs flex items-center self-start sticky">
          <Avatar className="w-32 h-32">
            <AvatarImage src={userInfo.avatar} />
            <AvatarFallback>{userInfo.name}</AvatarFallback>
          </Avatar>
          <CardContent className="flex flex-col gap-4 items-center">
            <p className="text-5xl font-bold">{userInfo.name}</p>
            <p className="text-lg">{userInfo.occupation}</p>
          </CardContent>
        </Card>
      </View>
      <View className="w-xs" />
      <View className="flex-1 flex flex-col gap-5">
        {articles.map((article, index) => (
          <Link to={`/post-board/${article.id}`} className="block" key={index}>
            <PostExcerptCard value={article} />
          </Link>
        ))}
      </View>
    </View>
  );
}
