import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useMemoizedFn } from './use-memoized-fn';

describe('useMemoizedFn', () => {
  it('returns a function', () => {
    const { result } = renderHook(() => useMemoizedFn(() => 42));

    expect(typeof result.current).toBe('function');
  });

  it('returns the same reference across renders', () => {
    const fn = () => 42;
    const { result, rerender } = renderHook(() => useMemoizedFn(fn));

    const firstRef = result.current;
    rerender();
    const secondRef = result.current;

    expect(firstRef).toBe(secondRef);
  });

  it('calls the underlying function', () => {
    const fn = vi.fn(() => 'result');
    const { result } = renderHook(() => useMemoizedFn(fn));

    const output = result.current();

    expect(fn).toHaveBeenCalledTimes(1);
    expect(output).toBe('result');
  });
});
