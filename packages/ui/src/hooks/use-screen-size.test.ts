import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useScreenSize, screenSizeBreakpoints } from './use-screen-size';

describe('useScreenSize', () => {
  beforeEach(() => {
    vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(1024);
  });

  it('returns the current screen size name', () => {
    const { result } = renderHook(() => useScreenSize());

    expect(result.current).toBe('lg');
  });

  it('returns value from config matching current breakpoint', () => {
    const { result } = renderHook(() =>
      useScreenSize({ xs: 1, sm: 2, md: 3, lg: 4, xl: 5 }),
    );

    expect(result.current).toBe(4);
  });

  it('falls back to next larger breakpoint when smaller is undefined', () => {
    const { result } = renderHook(() => useScreenSize({ xl: 10 }));

    expect(result.current).toBe(10);
  });
});
