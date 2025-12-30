import dayjs from "dayjs";
import { HttpClient } from "../http/http-client";

export namespace ArticleApi {
  export interface Article {
    id: string;
    title: string;
    excerpt: string;
    createdAt: string;
    updatedAt: string;
  }

  export interface ArticleDetail {
    id: string;
    title: string;
    excerpt: string;
    content: string;
    createdAt: string;
    updatedAt: string;
  }

  export interface ArticleParams {
    page: number;
    pageSize: number;
    sort: "desc" | "asc";
  }

  export async function getArticleList(
    params: ArticleParams,
  ): Promise<Pagination<Article>> {
    return HttpClient.serverSideGet<Pagination>("blog/article/list", params);
  }

  export async function getArticleDetail(id: string) {
    const article = HttpClient.serverSideGet<ArticleDetail>(
      `blog/article/${id}`,
    );
    return article;
  }
}
