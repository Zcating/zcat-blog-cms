import { renderHook, act } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useAsync } from './use-async';

describe('useAsync', () => {
  it('returns initial data and loading state', () => {
    const { result } = renderHook(() =>
      useAsync('initial', async () => 'loaded', []),
    );

    expect(result.current[0]).toBe('initial');
    expect(result.current[1]).toBe(true);
    expect(result.current[2]).toBeNull();
  });

  it('resolves with data and sets loading to false', async () => {
    const { result } = renderHook(() => useAsync('', async () => 'result', []));

    await vi.waitFor(() => {
      expect(result.current[0]).toBe('result');
      expect(result.current[1]).toBe(false);
    });
  });

  it('captures error when promise rejects', async () => {
    const error = new Error('fail');
    const { result } = renderHook(() =>
      useAsync(
        '',
        async () => {
          throw error;
        },
        [],
      ),
    );

    await vi.waitFor(() => {
      expect(result.current[2]).toBe(error);
      expect(result.current[1]).toBe(false);
    });
  });
});
