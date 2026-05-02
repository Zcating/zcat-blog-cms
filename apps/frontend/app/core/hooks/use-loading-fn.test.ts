import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

// Promise.tick is a non-standard extension, mock it to resolve immediately
Promise.tick ??= () => Promise.resolve();

import { useLoadingFn } from './use-loading-fn';

describe('useLoadingFn', () => {
  it('初始 loading 状态应为 false', () => {
    const fn = vi.fn().mockResolvedValue('ok');
    const { result } = renderHook(() => useLoadingFn(fn));
    expect(result.current.loading).toBe(false);
  });

  it('调用后 loading 应为 true，完成后为 false', async () => {
    let resolvePromise: (v: string) => void;
    const promise = new Promise<string>((resolve) => {
      resolvePromise = resolve;
    });
    const fn = vi.fn().mockReturnValue(promise);

    const { result } = renderHook(() => useLoadingFn(fn));

    let callResult: Promise<string>;
    act(() => {
      callResult = result.current('arg');
    });

    // loading should be true after call
    await waitFor(() => {
      expect(result.current.loading).toBe(true);
    });

    resolvePromise!('done');

    await act(async () => {
      await callResult;
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it('应该传递参数并返回值', async () => {
    const fn = vi.fn().mockResolvedValue('result');
    const { result } = renderHook(() => useLoadingFn(fn));

    let output: string | undefined;
    await act(async () => {
      output = await result.current('hello', 42);
    });

    expect(fn).toHaveBeenCalledWith('hello', 42);
    expect(output).toBe('result');
  });

  it('错误时 loading 应恢复为 false', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('fail'));
    const { result } = renderHook(() => useLoadingFn(fn));

    await act(async () => {
      try {
        await result.current();
      } catch {
        // expected
      }
    });

    expect(result.current.loading).toBe(false);
  });
});
