import { renderHook, act } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { usePropsValue } from './use-props-value';

describe('usePropsValue', () => {
  it('uses default value when value is undefined', () => {
    const { result } = renderHook(() =>
      usePropsValue({ defaultValue: 'default' }),
    );

    expect(result.current[0]).toBe('default');
  });

  it('uses controlled value when provided', () => {
    const { result } = renderHook(() =>
      usePropsValue({ value: 'controlled', defaultValue: 'default' }),
    );

    expect(result.current[0]).toBe('controlled');
  });

  it('calls onChange when setState is called', () => {
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      usePropsValue({ defaultValue: 'old', onChange }),
    );

    act(() => {
      result.current[1]('new');
    });

    expect(onChange).toHaveBeenCalledWith('new');
  });

  it('updates value via setState', () => {
    const { result } = renderHook(() => usePropsValue({ defaultValue: 'old' }));

    act(() => {
      result.current[1]('new');
    });

    expect(result.current[0]).toBe('new');
  });
});
