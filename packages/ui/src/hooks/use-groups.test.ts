import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useGroups } from './use-groups';

describe('useGroups', () => {
  it('splits items into groups by cols', () => {
    const items = [1, 2, 3, 4, 5];
    const { result } = renderHook(() => useGroups(items, 2));

    expect(result.current).toEqual([[1, 2], [3, 4], [5]]);
  });

  it('returns empty array when items is empty', () => {
    const { result } = renderHook(() => useGroups([], 3));

    expect(result.current).toEqual([]);
  });

  it('recomputes when items changes', () => {
    const { result, rerender } = renderHook(
      ({ items }) => useGroups(items, 3),
      { initialProps: { items: [1, 2, 3, 4] } },
    );

    expect(result.current).toEqual([[1, 2, 3], [4]]);

    rerender({ items: [1, 2, 3, 4, 5] });

    expect(result.current).toEqual([
      [1, 2, 3],
      [4, 5],
    ]);
  });
});
