import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useWatch } from './use-watch';

describe('useWatch', () => {
  it('calls the callback on mount', () => {
    const fn = vi.fn();
    renderHook(() => useWatch([1], fn));

    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith(1);
  });

  it('calls callback when deps change', () => {
    const fn = vi.fn();
    const { rerender } = renderHook(({ deps }) => useWatch(deps, fn), {
      initialProps: { deps: [1] as [number] },
    });

    expect(fn).toHaveBeenCalledTimes(1);

    rerender({ deps: [2] });

    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn).toHaveBeenCalledWith(2);
  });

  it('runs the returned cleanup when deps change', () => {
    const cleanup = vi.fn();
    const fn = vi.fn(() => cleanup);
    const { rerender } = renderHook(({ deps }) => useWatch(deps, fn), {
      initialProps: { deps: [1] as [number] },
    });

    rerender({ deps: [2] });

    expect(cleanup).toHaveBeenCalledTimes(1);
  });
});
