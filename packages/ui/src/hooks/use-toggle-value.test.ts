import { renderHook, act } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useToggleValue } from './use-toggle-value';

describe('useToggleValue', () => {
  it('returns initial value as false', () => {
    const { result } = renderHook(() => useToggleValue(false));

    expect(result.current[0]).toBe(false);
  });

  it('returns initial value as true', () => {
    const { result } = renderHook(() => useToggleValue(true));

    expect(result.current[0]).toBe(true);
  });

  it('toggles from true to false', () => {
    const { result } = renderHook(() => useToggleValue(true));

    act(() => {
      result.current[1]();
    });

    expect(result.current[0]).toBe(false);
  });

  it('toggles from false to true', () => {
    const { result } = renderHook(() => useToggleValue(false));

    act(() => {
      result.current[1]();
    });

    expect(result.current[0]).toBe(true);
  });
});
