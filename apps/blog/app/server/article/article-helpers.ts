import { resolveBackendApiUrl } from '@blog/server/env';
import {
  getJson,
  type BackendEnv,
  type FetchLike,
} from '@blog/server/transport';

import {
  ArticleDetailSchema,
  ArticleListSchema,
  GetArticleDetailInputSchema,
  GetArticleListInputSchema,
  type ArticleDetail,
  type ArticleList,
  type GetArticleDetailInput,
  type GetArticleListInput,
} from './schemas';

export interface FetchOptions {
  env?: BackendEnv;
  fetch?: FetchLike;
}

const defaultEnv: BackendEnv = { resolveBaseUrl: resolveBackendApiUrl };

export async function fetchArticleList(
  input: GetArticleListInput | undefined,
  options: FetchOptions = {},
): Promise<ArticleList> {
  const params = GetArticleListInputSchema.parse(input ?? {});
  return getJson<ArticleList>({
    path: '/blog/article/list',
    query: {
      page: params.page,
      pageSize: params.pageSize,
      order: params.order,
    },
    dataSchema: ArticleListSchema,
    env: options.env ?? defaultEnv,
    fetch: options.fetch,
  });
}

export async function fetchArticleDetail(
  input: GetArticleDetailInput,
  options: FetchOptions = {},
): Promise<ArticleDetail> {
  const params = GetArticleDetailInputSchema.parse(input);
  return getJson<ArticleDetail>({
    path: `/blog/article/${params.id}`,
    dataSchema: ArticleDetailSchema,
    env: options.env ?? defaultEnv,
    fetch: options.fetch,
  });
}
