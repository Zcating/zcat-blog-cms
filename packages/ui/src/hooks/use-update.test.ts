import { renderHook, act } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useUpdate } from './use-update';

describe('useUpdate', () => {
  it('returns a function', () => {
    const { result } = renderHook(() => useUpdate());

    expect(typeof result.current).toBe('function');
  });

  it('triggers a re-render when called', () => {
    let renderCount = 0;
    const { result, rerender } = renderHook(() => {
      renderCount++;
      return useUpdate();
    });

    renderCount = 0; // reset after initial render
    act(() => {
      result.current();
    });

    expect(renderCount).toBe(1);
  });
});
