/**
 * Seam test for the pagination control's imperative behaviour.
 *
 * The pagination control (`PaginationWorkspace`) is the only consumer
 * of `usePaginationAction`; it never navigates by URL path, it only
 * rewrites the current list route's search object. So the public
 * contract is the `search` updater handed to the router:
 *
 *   - changing the page preserves the current `pageSize` (and any
 *     other loader-read filter, e.g. the photos `albumId`);
 *   - changing the page size resets to page 1;
 *   - the resulting search is exactly the shape the `_cms` list
 *     route loaders read — `page`, `pageSize`, and `albumId` on
 *     photos — with numeric values, so it round-trips through the
 *     routes' `validateSearch` unchanged.
 *
 * The only mocked boundary is the TanStack `useNavigate` hook: a
 * shared hook outside any route cannot be typed by TanStack, so the
 * router call itself is not under test here.
 */

import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { navigateMock } = vi.hoisted(() => ({
  navigateMock: vi.fn(),
}));

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => navigateMock,
}));

import {
  paginationSearchSchema,
  usePaginationAction,
} from './use-pagination-action';

type NavigateOptions = {
  search: (prev: Record<string, unknown>) => Record<string, unknown>;
  viewTransition: boolean;
};

function lastNavigateOptions(): NavigateOptions {
  return navigateMock.mock.calls.at(-1)![0] as NavigateOptions;
}

describe('usePaginationAction', () => {
  beforeEach(() => {
    navigateMock.mockClear();
  });

  it('onPageChange 应该保留当前 pageSize 并跳到目标页', () => {
    const { result } = renderHook(() => usePaginationAction(20));

    result.current.onPageChange(3);

    const options = lastNavigateOptions();
    expect(options.viewTransition).toBe(true);
    expect(options.search({ page: 1, pageSize: 20 })).toEqual({
      page: 3,
      pageSize: 20,
    });
  });

  it('onPageSizeChange 应该重置到第一页并应用新的 pageSize', () => {
    const { result } = renderHook(() => usePaginationAction(20));

    result.current.onPageSizeChange('50');

    const options = lastNavigateOptions();
    expect(options.viewTransition).toBe(true);
    expect(options.search({ page: 4, pageSize: 20 })).toEqual({
      page: 1,
      pageSize: 50,
    });
  });

  it('翻页时应该保留 photos 的 albumId 过滤条件', () => {
    const { result } = renderHook(() => usePaginationAction(20));

    result.current.onPageChange(3);

    expect(
      lastNavigateOptions().search({ page: 1, pageSize: 20, albumId: 7 }),
    ).toEqual({ page: 3, pageSize: 20, albumId: 7 });
  });

  it('改 pageSize 时应该重置到第一页并保留 albumId 过滤条件', () => {
    const { result } = renderHook(() => usePaginationAction(20));

    result.current.onPageSizeChange('50');

    expect(
      lastNavigateOptions().search({ page: 4, pageSize: 20, albumId: 7 }),
    ).toEqual({ page: 1, pageSize: 50, albumId: 7 });
  });

  it('产出的 search 恰好是 list loader 读取的字段，且值为数字', () => {
    const { result } = renderHook(() => usePaginationAction(20));

    result.current.onPageChange(2);
    const onPageChangeSearch = lastNavigateOptions().search({
      page: 1,
      pageSize: 20,
    });

    result.current.onPageSizeChange('50');
    const onPageSizeChangeSearch = lastNavigateOptions().search({
      page: 1,
      pageSize: 20,
    });

    expect(Object.keys(onPageChangeSearch).sort()).toEqual([
      'page',
      'pageSize',
    ]);
    expect(Object.keys(onPageSizeChangeSearch).sort()).toEqual([
      'page',
      'pageSize',
    ]);
    expect(typeof onPageChangeSearch.page).toBe('number');
    expect(typeof onPageChangeSearch.pageSize).toBe('number');
    expect(typeof onPageSizeChangeSearch.page).toBe('number');
    expect(typeof onPageSizeChangeSearch.pageSize).toBe('number');
  });
});

describe('paginationSearchSchema', () => {
  it('应该把 query string 强制转换为正整数', () => {
    const parsed = paginationSearchSchema.parse({
      page: '2',
      pageSize: '25',
      albumId: '7',
    });

    expect(parsed.page).toBe(2);
    expect(parsed.pageSize).toBe(25);
    expect(parsed.albumId).toBe(7);
  });

  it('缺失或非法的值应该解析为 undefined，交由各路由 loader 应用默认值', () => {
    const parsed = paginationSearchSchema.parse({
      page: 'abc',
      pageSize: '0',
      albumId: '-3',
    });

    expect(parsed.page).toBeUndefined();
    expect(parsed.pageSize).toBeUndefined();
    expect(parsed.albumId).toBeUndefined();
  });

  it('应该保留 schema 未声明的搜索参数', () => {
    const parsed = paginationSearchSchema.parse({
      page: '1',
      keyword: 'zcat',
    });

    expect(parsed.page).toBe(1);
    expect(parsed.keyword).toBe('zcat');
  });
});
