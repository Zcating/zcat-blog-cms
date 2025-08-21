import dayjs from "dayjs";
import { HttpClient } from "../http/http-client";
import { articles } from "../mock-data/articles-mock";

export namespace ArticleApi {
  export interface Article {
    id: string;
    title: string;
    excerpt: string;
    createdAt: dayjs.Dayjs;
    updatedAt: dayjs.Dayjs;
  }

  export interface ArticleDetail {
    id: string;
    title: string;
    excerpt: string;
    content: string;
    createdAt: dayjs.Dayjs;
    updatedAt: dayjs.Dayjs;
  }

  export async function getArticleList(): Promise<Pagination<Article>> {
    const pagination = await HttpClient.get<Pagination>("blog/article/list");
    return {
      ...pagination,
      data: pagination.data.map((article: any) => ({
        ...article,
        createdAt: dayjs(article.createdAt),
        updatedAt: dayjs(article.updatedAt),
      })),
    };
    // return articles;
  }

  export async function getArticleDetail(id: string) {
    const article = await HttpClient.get<ArticleDetail>(`blog/article/${id}`);
    return {
      ...article,
      createdAt: dayjs(article.createdAt),
      updatedAt: dayjs(article.updatedAt),
    };

    // return articles.find((article) => article.id === id);
  }
}
