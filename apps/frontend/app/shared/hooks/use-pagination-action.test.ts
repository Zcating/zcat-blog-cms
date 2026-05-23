import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { usePaginationAction, PAGE_SIZE_OPTIONS } from './use-pagination-action';

vi.mock('react-router', () => ({
  useNavigate: () => vi.fn(),
  createSearchParams: (p: Record<string, string>) => new URLSearchParams(p),
}));

describe('usePaginationAction', () => {
  it('returns handlers', () => {
    const { result } = renderHook(() => usePaginationAction(10));
    expect(typeof result.current.onPageChange).toBe('function');
    expect(typeof result.current.onPageSizeChange).toBe('function');
  });
});

describe('PAGE_SIZE_OPTIONS', () => {
  it('contains standard page sizes', () => {
    const values = PAGE_SIZE_OPTIONS.map((o) => o.value);
    expect(values).toContain('10');
    expect(values).toContain('20');
    expect(values).toContain('50');
  });
});
