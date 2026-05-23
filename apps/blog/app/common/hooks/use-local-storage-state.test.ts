import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useLocalStorageState } from './use-local-storage-state';

describe('useLocalStorageState', () => {
  const key = 'test-key';

  beforeEach(() => {
    localStorage.clear();
  });

  it('returns the default value when no item in localStorage', () => {
    const { result } = renderHook(() => useLocalStorageState(key, 'default'));
    expect(result.current[0]).toBe('default');
  });

  it('reads existing value from localStorage', () => {
    localStorage.setItem(key, JSON.stringify('stored'));
    const { result } = renderHook(() => useLocalStorageState(key, 'default'));
    expect(result.current[0]).toBe('stored');
  });

  it('writes to localStorage when setter is called', () => {
    const { result } = renderHook(() => useLocalStorageState(key, 'default'));
    result.current[1]('new-value');
    expect(localStorage.getItem(key)).toBe(JSON.stringify('new-value'));
  });

  it('parses object values from localStorage', () => {
    const obj = { a: 1, b: 'hello' };
    localStorage.setItem(key, JSON.stringify(obj));
    const { result } = renderHook(() => useLocalStorageState(key, {}));
    expect(result.current[0]).toEqual(obj);
  });

  it('falls back to default when stored JSON is invalid', () => {
    localStorage.setItem(key, '{invalid');
    const { result } = renderHook(() => useLocalStorageState(key, 'fallback'));
    expect(result.current[0]).toBe('fallback');
  });
});
