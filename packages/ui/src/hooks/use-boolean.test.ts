import { renderHook, act } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useBoolean } from './use-boolean';

describe('useBoolean', () => {
  it('returns initial value as false by default', () => {
    const { result } = renderHook(() => useBoolean(false));

    expect(result.current[0]).toBe(false);
  });

  it('returns initial value as true', () => {
    const { result } = renderHook(() => useBoolean(true));

    expect(result.current[0]).toBe(true);
  });

  it('sets value to true via onTrue', () => {
    const { result } = renderHook(() => useBoolean(false));

    act(() => {
      result.current[1]();
    });

    expect(result.current[0]).toBe(true);
  });

  it('sets value to false via onFalse', () => {
    const { result } = renderHook(() => useBoolean(true));

    act(() => {
      result.current[2]();
    });

    expect(result.current[0]).toBe(false);
  });
});
