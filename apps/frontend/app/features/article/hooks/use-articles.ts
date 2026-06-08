/**
 * useArticles — 列表页通用 hook 占位。
 *
 * 当前 apps/frontend 的列表页（articles/albums/photos）通过 useOptimisticArray
 * 在组件内维护乐观更新状态，配合 React Router loader 数据。后续 PR 应把 reducer
 * 收敛到此处，避免 3 处页面重复。
 *
 * 暂未实际启用，使用方继续走内联实现。
 */
import { useLoaderData } from 'react-router';

export interface ArticleHookOptions {
  page: number;
  pageSize: number;
  order?: 'latest' | 'oldest';
}

export function useArticles(_options: ArticleHookOptions) {
  const data = useLoaderData();
  return {
    data,
    // revalidate / mutate / optimistic helpers will be added in the follow-up PR
  };
}
