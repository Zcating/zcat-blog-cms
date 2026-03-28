import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const removeArray = <T>(arr: T[], item: T): T[] =>
  arr.filter((i) => JSON.stringify(i) !== JSON.stringify(item));

const updateArray = <T>(arr: T[], items: T[]): T[] => {
  const itemMap = new Map(items.map((item) => [JSON.stringify(item), item]));
  return arr.map((item) => itemMap.get(JSON.stringify(item)) ?? item);
};

vi.mock('@zcat/ui', () => ({
  usePropsValue: (options: {
    defaultValue?: unknown;
    value?: unknown;
    onChange?: () => void;
  }) => {
    const [state, setState] = React.useState(
      options.defaultValue ?? options.value,
    );
    return [
      state,
      (v: unknown) => {
        setState(v);
        options.onChange?.(v as never);
      },
    ] as const;
  },
  useWatch: vi.fn(),
}));

import { useOptimisticArray } from '../use-optimistic-array';

describe('useOptimisticArray', () => {
  const initialData = [
    { id: 1, name: 'Item 1' },
    { id: 2, name: 'Item 2' },
    { id: 3, name: 'Item 3' },
  ];

  const reduce = (
    prev: typeof initialData,
    data: { id: number; name: string },
  ) => {
    const exists = prev.find((item) => item.id === data.id);
    if (exists) {
      return prev.map((item) => (item.id === data.id ? data : item));
    }
    return [...prev, data];
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('应该初始化状态为空数组', () => {
    const { result } = renderHook(() =>
      useOptimisticArray<{ id: number; name: string }>([], reduce),
    );
    expect(result.current[0]).toEqual([]);
  });

  it('应该更新状态', () => {
    const { result } = renderHook(() =>
      useOptimisticArray<{ id: number; name: string }>(initialData, reduce),
    );

    expect(result.current[0]).toEqual(initialData);
  });

  it('应该正确添加乐观更新', async () => {
    const { result } = renderHook(() =>
      useOptimisticArray<{ id: number; name: string }>(initialData, reduce),
    );

    const newItem = { id: 4, name: 'Item 4' };

    await act(async () => {
      result.current[1](newItem);
    });

    expect(result.current[0]).toContainEqual(newItem);
  });

  it('应该正确更新现有项', async () => {
    const { result } = renderHook(() =>
      useOptimisticArray<{ id: number; name: string }>(initialData, reduce),
    );

    const updatedItem = { id: 1, name: 'Updated Item 1' };

    await act(async () => {
      result.current[1](updatedItem);
    });

    expect(result.current[0]).toContainEqual(updatedItem);
    expect(result.current[0].find((item) => item.id === 1)?.name).toBe(
      'Updated Item 1',
    );
  });

  it('commitState 应该能移除项', async () => {
    const { result } = renderHook(() =>
      useOptimisticArray<{ id: number; name: string }>(initialData, reduce),
    );

    await act(async () => {
      result.current[2]('remove', initialData[0]);
    });

    expect(result.current[0]).toHaveLength(2);
    expect(result.current[0]).not.toContainEqual(initialData[0]);
  });

  it('commitState 应该能批量更新', async () => {
    const { result } = renderHook(() =>
      useOptimisticArray<{ id: number; name: string }>(initialData, reduce),
    );

    const batchUpdate = [
      { id: 1, name: 'Batch Updated 1' },
      { id: 2, name: 'Batch Updated 2' },
    ];

    await act(async () => {
      result.current[2]('batchUpdate', batchUpdate);
    });

    expect(result.current[0].find((item) => item.id === 1)?.name).toBe(
      'Batch Updated 1',
    );
    expect(result.current[0].find((item) => item.id === 2)?.name).toBe(
      'Batch Updated 2',
    );
  });

  it('commitState rollback 应该回滚状态', async () => {
    const { result } = renderHook(() =>
      useOptimisticArray<{ id: number; name: string }>(initialData, reduce),
    );

    const newItem = { id: 4, name: 'Item 4' };

    await act(async () => {
      result.current[1](newItem);
    });

    expect(result.current[0]).toHaveLength(4);

    await act(async () => {
      result.current[2]('rollback');
    });

    expect(result.current[0]).toEqual(initialData);
  });

  it('commitState set 应该直接设置状态', async () => {
    const { result } = renderHook(() =>
      useOptimisticArray<{ id: number; name: string }>(initialData, reduce),
    );

    const newData = [{ id: 99, name: 'New Data' }];

    await act(async () => {
      result.current[2]('set', newData);
    });

    expect(result.current[0]).toEqual(newData);
  });
});
