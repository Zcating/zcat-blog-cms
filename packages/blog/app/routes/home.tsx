import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  View,
  ZAvatar,
  ZPagination,
  ZSelect,
} from "@blog/components";
import { ArticleApi, UserApi } from "@blog/apis";
import { createSearchParams, Link, useNavigate } from "react-router";
import type { Route } from "./+types/home";
import { PostExcerptCard } from "@blog/modules";

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const page = Number(url.searchParams.get("page") ?? "1");
  const order = (url.searchParams.get("order") ??
    "latest") as ArticleApi.OrderEnum;

  return {
    userInfo: await UserApi.getUserInfo(),
    pagination: await ArticleApi.getArticleList({
      page: Number.isFinite(page) && page > 0 ? page : 1,
      pageSize: 10,
      order: order,
    }),
    page: Number.isFinite(page) && page > 0 ? page : 1,
    order,
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
  const pagination = loaderData.pagination;
  const currentPage = loaderData.page;
  const order = loaderData.order;
  const navigate = useNavigate();

  const toSearch = (nextPage: number, nextOrder: ArticleApi.OrderEnum) =>
    `?${createSearchParams({
      page: String(nextPage),
      order: nextOrder,
    })}`;

  const goToPage = (page: number) => {
    navigate(toSearch(page, order));
  };

  const handleOrderChange = (value: string) => {
    const nextSort = value === "oldest" ? "oldest" : "latest";
    navigate(toSearch(1, nextSort));
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
              value={order}
              onValueChange={handleOrderChange}
            />
          </CardContent>
        </Card>
      </View>
      <View className="flex-1 flex flex-col gap-5">
        {pagination.data.map((article, index) => (
          <Link to={`/post-board/${article.id}`} className="block" key={index}>
            <PostExcerptCard value={article} />
          </Link>
        ))}
        <ZPagination
          currentPage={currentPage}
          totalPages={pagination.totalPages}
          getHref={(page) => toSearch(page, order)}
          onPageChange={goToPage}
        />
      </View>
    </View>
  );
}
