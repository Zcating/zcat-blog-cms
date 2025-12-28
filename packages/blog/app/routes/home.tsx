import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  View,
  ZAvatar,
  ZSelect,
} from "@blog/components";
import { ArticleApi, UserApi } from "@blog/apis";
import { Link } from "react-router";
import type { Route } from "./+types/home";
import { PostExcerptCard } from "@blog/modules";
import React from "react";

export async function loader() {
  return {
    userInfo: await UserApi.getUserInfo(),
    pagination: await ArticleApi.getArticleList(),
  };
}

export function meta() {
  return [
    { title: "ZCAT - 我知道你在看" },
    { name: "description", content: "个人技术博客" },
  ];
}

const SORT_OPTIONS = [
  { value: "latest", label: "最新" },
  { value: "oldest", label: "最早" },
];

/**
 * 首页文章列表实现
 *
 */
export default function HomePage(props: Route.ComponentProps) {
  const loaderData = props.loaderData;
  const userInfo = loaderData.userInfo;
  const [articles, setArticles] = React.useState(
    loaderData.pagination?.data || [],
  );
  const [sort, setSort] = React.useState("latest");
  const handleSortChange = (value: string) => {
    setSort(value);
    if (value === "latest") {
      setArticles(loaderData.pagination?.data || []);
    } else {
      setArticles(loaderData.pagination?.data?.reverse() || []);
    }
  };

  return (
    <View className="px-4 flex gap-12">
      <View className="sticky top-24 flex flex-col gap-3 self-start">
        <Card className="w-xs">
          <CardHeader className="flex justify-center">
            <ZAvatar src={userInfo.avatar} fallback={userInfo.name} />
          </CardHeader>
          <CardContent className="flex flex-col gap-4 items-center">
            <p className="text-2xl font-bold">{userInfo.name}</p>
            <p className="text-lg">噢！你来了！</p>
          </CardContent>
        </Card>
        <Card className="w-xs">
          <CardHeader>
            <CardTitle>文章排序</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 items-center">
            <ZSelect
              className="w-full"
              options={SORT_OPTIONS}
              value={sort}
              onValueChange={handleSortChange}
            />
          </CardContent>
        </Card>
      </View>
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
