import { isRedirect } from '@tanstack/react-router';
import { describe, expect, it, vi } from 'vitest';

import { loadPaginatedList } from './page-param';

function makePagination(totalPages: number) {
  return { data: [], total: totalPages, totalPages, page: 1, pageSize: 10 };
}

function createFetch(totalPages: number) {
  return vi.fn(async (page: number) => ({
    ...makePagination(totalPages),
    page,
  }));
}

describe('loadPaginatedList', () => {
  it.each([
    ['missing', undefined],
    ['non-numeric', 'abc'],
    ['zero', '0'],
    ['negative', '-5'],
  ])('falls back to page 1 for %s page', async (_label, page) => {
    const fetch = createFetch(4);
    const result = await loadPaginatedList({
      to: '/gallery',
      search: { page },
      fetch,
    });

    expect(result.page).toBe(1);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(1);
  });

  it('returns the requested page when it is within range', async () => {
    const fetch = createFetch(4);
    const result = await loadPaginatedList({
      to: '/gallery',
      search: { page: '2' },
      fetch,
    });

    expect(result.page).toBe(2);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(2);
  });

  it('throws a redirect to the last page when the requested page is out of range', async () => {
    const fetch = createFetch(3);

    let error: unknown;
    try {
      await loadPaginatedList({
        to: '/gallery',
        search: { page: '999' },
        fetch,
      });
    } catch (caught) {
      error = caught;
    }

    expect(isRedirect(error)).toBe(true);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(999);

    if (!isRedirect(error)) {
      return;
    }
    expect(error.options.to).toBe('/gallery');
    expect(error.options.search).toEqual({ page: '3' });
    expect(error.options.replace).toBe(true);
  });

  it('keeps page 1 when totalPages is 0 and page 1 is requested', async () => {
    const fetch = createFetch(0);
    const result = await loadPaginatedList({
      to: '/gallery',
      search: { page: '1' },
      fetch,
    });

    expect(result.page).toBe(1);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(1);
  });

  it('redirects to page 1 when totalPages is 0 and a later page is requested', async () => {
    const fetch = createFetch(0);

    let error: unknown;
    try {
      await loadPaginatedList({ to: '/gallery', search: { page: '5' }, fetch });
    } catch (caught) {
      error = caught;
    }

    expect(isRedirect(error)).toBe(true);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(5);

    if (!isRedirect(error)) {
      return;
    }
    expect(error.options.to).toBe('/gallery');
    expect(error.options.search).toEqual({ page: '1' });
    expect(error.options.replace).toBe(true);
  });
});
