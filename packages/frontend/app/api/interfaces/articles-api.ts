import { HttpClient } from '../http/http-client';
import type { PaginateResult } from './types';

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
    id: number;
    title?: string;
    excerpt?: string;
    content?: string;
  }

  export interface GetArticlesParams {
    page?: number;
    pageSize?: number;
  }

  // Article API functions
  export async function getArticles(
    params: GetArticlesParams,
  ): Promise<PaginateResult<Article>> {
    return await HttpClient.get('cms/articles', params);
  }

  export async function getArticle(id: number): Promise<Article> {
    return await HttpClient.get(`cms/articles/detail`, { id });
  }

  export async function createArticle(params: Article): Promise<Article> {
    return await HttpClient.post('cms/articles/create', params);
  }

  export async function updateArticle(
    params: UpdateArticleParams,
  ): Promise<Article> {
    return await HttpClient.post(`cms/articles/update`, params);
  }

  export async function deleteArticle(id: number): Promise<void> {
    return await HttpClient.post(`cms/articles/delete`, { id });
  }
}
