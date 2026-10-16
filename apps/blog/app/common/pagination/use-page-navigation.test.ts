import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { useNavigateMock } = vi.hoisted(() => ({ useNavigateMock: vi.fn() }));

vi.mock('@tanstack/react-router', async () => {
  const actual = await vi.importActual<typeof import('@tanstack/react-router')>(
    '@tanstack/react-router',
  );
  return {
    ...actual,
    useNavigate: () => useNavigateMock,
  };
});

import { usePageNavigation } from './use-page-navigation';

describe('usePageNavigation', () => {
  beforeEach(() => {
    useNavigateMock.mockReset();
  });

  it('navigates to the target route with the next page as a string search param', () => {
    const { result } = renderHook(() => usePageNavigation('/gallery'));

    result.current(2);

    expect(useNavigateMock).toHaveBeenCalledTimes(1);
    expect(useNavigateMock).toHaveBeenCalledWith({
      to: '/gallery',
      search: { page: '2' },
    });
  });
});
