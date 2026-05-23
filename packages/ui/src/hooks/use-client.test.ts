import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useClient } from './use-client';

describe('useClient', () => {
  it('returns true after mount', () => {
    const { result } = renderHook(() => useClient());

    expect(result.current).toBe(true);
  });
});
