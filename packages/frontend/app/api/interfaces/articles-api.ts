import { HttpClient } from '../http/http-client';

export namespace ArticlesApi {
  export interface ArticleTag {
    id?: number;
    name: string;
    createdAt?: string;
    updatedAt?: string;
  }

  export interface Article {
    id?: number;
    title: string;
    excerpt: string;
    content: string;
    createdAt?: string;
    updatedAt?: string;
    tags?: ArticleTag[];
  }

  export interface CreateArticleParams {
    title: string;
    excerpt: string;
    contentUrl: string;
  }

  export interface CreateArticleWithFileParams {
    title: string;
    excerpt: string;
    file?: File;
  }

  export interface UpdateArticleParams {
    title?: string;
    excerpt?: string;
    content?: string;
  }

  // Article API functions
  export async function getArticles(): Promise<Article[]> {
    return await HttpClient.get('cms/articles');
  }

  export async function getArticle(id: number): Promise<Article> {
    return await HttpClient.get(`cms/articles/${id}`);
  }

  export async function createArticle(params: Article): Promise<Article> {
    return await HttpClient.post('cms/articles', params);
  }

  export async function updateArticle(
    id: number,
    params: UpdateArticleParams,
  ): Promise<Article> {
    return await HttpClient.put(`cms/articles/${id}`, params);
  }

  export async function deleteArticle(id: number): Promise<void> {
    return await HttpClient.del(`cms/articles/${id}`);
  }
}
