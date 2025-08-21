import { HttpClient } from '../http/http-client';
import dayjs from 'dayjs';

export namespace ArticleTagsApi {
  export interface ArticleTag {
    id?: number;
    name: string;
    createdAt?: string;
    updatedAt?: string;
  }

  export interface CreateArticleTagParams {
    name: string;
  }

  export interface UpdateArticleTagParams {
    name?: string;
  }

  // ArticleTag API functions
  export async function getArticleTags(): Promise<ArticleTag[]> {
    return await HttpClient.get('cms/article-tags');
  }

  export async function getArticleTag(id: number): Promise<ArticleTag> {
    return await HttpClient.get(`cms/article-tags/${id}`);
  }

  export async function createArticleTag(
    params: CreateArticleTagParams,
  ): Promise<ArticleTag> {
    return await HttpClient.post('cms/article-tags', params);
  }

  export async function updateArticleTag(
    id: number,
    params: UpdateArticleTagParams,
  ): Promise<ArticleTag> {
    return await HttpClient.put(`cms/article-tags/${id}`, params);
  }

  export async function deleteArticleTag(id: number): Promise<void> {
    return await HttpClient.del(`cms/article-tags/${id}`);
  }
}
