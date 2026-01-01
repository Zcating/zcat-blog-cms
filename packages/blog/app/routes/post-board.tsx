import { ArticleApi } from "@blog/apis";
import { Link, useNavigate } from "react-router";
import {
  safePositiveNumber,
  StaggerReveal,
  View,
  ZPagination,
} from "@blog/components";
import { PostExcerptCard } from "@blog/modules/post";
import type { Route } from "./+types/post-board";

export function meta() {
  return [{ title: "文章" }, { name: "description", content: "个人技术博客" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const page = safePositiveNumber(url.searchParams.get("page"), 1);

  return {
    pagination: await ArticleApi.getArticleList({
      page: page,
      pageSize: 10,
      order: "latest",
    }),
    page,
  };
}

export default function PostBoardPage({ loaderData }: Route.ComponentProps) {
  const pagination = loaderData.pagination;
  const currentPage = loaderData.page;
  const navigate = useNavigate();

  const toSearch = (nextPage: number) => `?page=${nextPage}`;

  const goToPage = (page: number) => {
    navigate(toSearch(page));
  };

  const articles = pagination.data;
  return (
    <StaggerReveal
      className="max-w-4xl mx-auto space-y-4"
      selector='[data-post-excerpt-card="true"]'
      direction="right"
    >
      <h1 data-post-excerpt-card="true">博客文章</h1>
      {articles.map((article, index) => (
        <Link
          data-post-excerpt-card="true"
          key={index.toString()}
          to={`/post-board/${article.id}`}
          className="block"
        >
          <PostExcerptCard value={article} />
        </Link>
      ))}

      <ZPagination
        page={currentPage}
        totalPages={pagination.totalPages}
        onPageChange={goToPage}
      />
    </StaggerReveal>
  );
}
