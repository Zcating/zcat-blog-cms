import { createServerFn } from '@tanstack/react-start';

import { fetchArticleDetail, fetchArticleList } from './article-helpers';
import {
  GetArticleDetailInputSchema,
  GetArticleListInputSchema,
  type GetArticleDetailInput,
  type GetArticleListInput,
} from './schemas';

export const getArticleList = createServerFn({ method: 'GET' })
  .validator(
    (data: unknown): GetArticleListInput =>
      GetArticleListInputSchema.parse(data ?? {}),
  )
  .handler(async ({ data }) => fetchArticleList(data));

export const getArticleDetail = createServerFn({ method: 'GET' })
  .validator(
    (data: unknown): GetArticleDetailInput =>
      GetArticleDetailInputSchema.parse(data),
  )
  .handler(async ({ data }) => fetchArticleDetail(data));
