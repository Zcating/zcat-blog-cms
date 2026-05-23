import { renderHook, act } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useMount } from './use-mount';

describe('useMount', () => {
  it('calls the function on mount', () => {
    const fn = vi.fn();
    renderHook(() => useMount(fn));

    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('calls the returned cleanup on unmount', () => {
    const cleanup = vi.fn();
    const fn = vi.fn(() => cleanup);

    const { unmount } = renderHook(() => useMount(fn));
    unmount();

    expect(cleanup).toHaveBeenCalledTimes(1);
  });
});
