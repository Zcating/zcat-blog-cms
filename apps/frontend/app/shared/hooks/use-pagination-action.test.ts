import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { navigateMock } = vi.hoisted(() => ({
  navigateMock: vi.fn(),
}));

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => navigateMock,
}));

import { usePaginationAction } from './use-pagination-action';

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
    expect(options.search({ page: 1, pageSize: 20, keyword: 'zcat' })).toEqual({
      page: 3,
      pageSize: 20,
      keyword: 'zcat',
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
});
