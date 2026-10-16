import { isRedirect } from '@tanstack/react-router';
import { describe, expect, it, vi } from 'vitest';

import { loadPaginatedList, pageParamSchema } from './page-param';

function makePagination(totalPages: number) {
  return { data: [], total: totalPages, totalPages, page: 1, pageSize: 10 };
}

function createFetch(totalPages: number) {
  return vi.fn(async (page: number) => ({
    ...makePagination(totalPages),
    page,
  }));
}

describe('pageParamSchema', () => {
  it.each([
    ['missing page', {}, {}],
    ['non-numeric page', { page: 'abc' }, {}],
    ['zero page', { page: '0' }, { page: 0 }],
    ['negative page', { page: '-5' }, { page: -5 }],
    ['empty string page', { page: '' }, { page: 0 }],
    ['numeric page', { page: '2' }, { page: 2 }],
    ['fractional page', { page: '3.5' }, {}],
  ])('normalizes %s without throwing', (_label, input, expected) => {
    expect(() => pageParamSchema.parse(input)).not.toThrow();
    expect(pageParamSchema.parse(input)).toEqual(expected);
  });

  it('preserves extra search params alongside the coerced page', () => {
    expect(pageParamSchema.parse({ page: '2', category: 'ai' })).toEqual({
      page: 2,
      category: 'ai',
    });
  });

  it('rejects a non-object search payload', () => {
    expect(() => pageParamSchema.parse(undefined)).toThrow('invalid_type');
    expect(() => pageParamSchema.parse('2')).toThrow('invalid_type');
  });
});

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

  it('preserves other search params while replacing page when redirecting out of range', async () => {
    const fetch = createFetch(4);

    let error: unknown;
    try {
      await loadPaginatedList({
        to: '/gallery',
        search: { page: '999', category: 'ai' },
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
    expect(error.options.search).toEqual({ category: 'ai', page: '4' });
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
