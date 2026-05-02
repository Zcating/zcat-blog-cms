import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { describe, it, expect, vi } from 'vitest';

vi.mock('@zcat/ui', () => ({
  usePropsValue: vi.fn(),
  useWatch: vi.fn(),
}));

import { useOptimisticObject } from './use-optimistic-object';

describe('useOptimisticObject', () => {
  const initialValue = { name: 'test', count: 0 };
  const reduce = (
    prev: typeof initialValue,
    data: Partial<typeof initialValue>,
  ) => ({
    ...prev,
    ...data,
  });

  it('应该初始化状态', () => {
    const { result } = renderHook(() =>
      useOptimisticObject(initialValue, reduce),
    );
    expect(result.current[0]).toEqual(initialValue);
  });

  it('commitState update 应该合并更新', async () => {
    const { result } = renderHook(() =>
      useOptimisticObject(initialValue, reduce),
    );

    await act(async () => {
      result.current[2]('update', { count: 1 });
    });

    expect(result.current[0]).toEqual({ name: 'test', count: 1 });
  });
});
