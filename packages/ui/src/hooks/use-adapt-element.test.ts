import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useAdaptElement } from './use-adapt-element';

describe('useAdaptElement', () => {
  it('calls the function to create a React element', () => {
    const Comp = () => null;
    const { result } = renderHook(() => useAdaptElement(Comp));

    expect(result.current).not.toBeNull();
  });

  it('returns the node directly when given a ReactNode', () => {
    const node = 'plain text';
    const { result } = renderHook(() => useAdaptElement(node));

    expect(result.current).toBe(node);
  });
});
