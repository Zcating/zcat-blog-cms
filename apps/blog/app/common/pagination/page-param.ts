import { redirect } from '@tanstack/react-router';
import { z } from 'zod';

import { safePositiveNumber } from '../utils';

export const pageParamSchema = z.looseObject({
  page: z.coerce.number().int().optional().catch(undefined),
});

export interface PageSearch {
  page?: string | number;
  [key: string]: string | number | undefined;
}

export interface PaginatedResult {
  totalPages: number;
}

export interface LoadPaginatedListOptions<TPagination extends PaginatedResult> {
  to: string;
  search: PageSearch;
  fetch: (page: number) => Promise<TPagination>;
}

export interface LoadPaginatedListResult<TPagination extends PaginatedResult> {
  pagination: TPagination;
  page: number;
}

export async function loadPaginatedList<TPagination extends PaginatedResult>(
  options: LoadPaginatedListOptions<TPagination>,
): Promise<LoadPaginatedListResult<TPagination>> {
  const requested = safePositiveNumber(options.search.page, 1);
  const pagination = await options.fetch(requested);
  const clamped = Math.min(requested, Math.max(1, pagination.totalPages));

  if (clamped !== requested) {
    throw redirect({
      to: options.to,
      search: { ...options.search, page: String(clamped) },
      replace: true,
    });
  }

  return { pagination, page: clamped };
}
