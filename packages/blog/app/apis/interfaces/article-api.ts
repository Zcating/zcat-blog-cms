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

  export async function getArticleList(): Promise<Pagination<Article>> {
    return HttpClient.serverSideGet<Pagination>("blog/article/list");
  }

  export async function getArticleDetail(id: string) {
    const article = HttpClient.serverSideGet<ArticleDetail>(
      `blog/article/${id}`,
    );
    return article;
  }
}
