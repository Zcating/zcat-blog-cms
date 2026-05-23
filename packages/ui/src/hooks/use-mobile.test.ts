import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useIsMobile } from './use-mobile';

describe('useIsMobile', () => {
  beforeEach(() => {
    // Default: not mobile
    vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(1024);
  });

  it('returns false on desktop width', () => {
    const { result } = renderHook(() => useIsMobile());

    expect(result.current).toBe(false);
  });

  it('returns true on mobile width', () => {
    vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(375);

    const { result } = renderHook(() => useIsMobile());

    expect(result.current).toBe(true);
  });
});
