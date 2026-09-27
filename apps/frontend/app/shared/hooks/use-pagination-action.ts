import { useNavigate } from '@tanstack/react-router';
import { safeNumber, useMemoizedFn } from '@zcat/ui';
import { z } from 'zod';

interface UsePaginationReturn {
  onPageChange: (page: number) => void;
  onPageSizeChange: (value: string) => void;
}

export const PAGE_SIZE_OPTIONS = [
  { value: '10', label: '每页 10 条' },
  { value: '20', label: '每页 20 条' },
  { value: '50', label: '每页 50 条' },
];

function toPositiveInt(raw: unknown): number | undefined {
  if (raw == null) {
    return undefined;
  }
  const parsed = Number.parseInt(String(raw), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return undefined;
  }
  return parsed;
}

const positiveIntFromQuery = z.preprocess(toPositiveInt, z.number().optional());

export function coerceQueryInt(raw: unknown, fallback: number): number {
  return toPositiveInt(raw) ?? fallback;
}

/**
 * The search contract shared by the paginated `_cms` list routes
 * (`/albums`, `/articles`, `/photos`) and by `usePaginationAction`.
 *
 * Query values are coerced to positive integers; anything missing or
 * malformed resolves to `undefined` so each route's own loader keeps
 * owning its documented default (1 / 10, 1 / 10, 1 / 20) instead of
 * the schema baking one page size in for all three. Unknown params
 * are preserved so the schema never silently drops a filter.
 */
export const paginationSearchSchema = z.looseObject({
  page: positiveIntFromQuery,
  pageSize: positiveIntFromQuery,
  albumId: positiveIntFromQuery,
});

export type PaginationSearch = z.infer<typeof paginationSearchSchema>;

export function usePaginationAction(pageSize: number): UsePaginationReturn {
  // The cast is load-bearing at compile time only; runtime is correct.
  // Called here, `useNavigate()` has no `to` and no `from`, so TanStack
  // resolves search params through `ResolveToParams<string, string |
  // undefined>`, which short-circuits to `never` before it ever reads the
  // routes' registered `validateSearch`. Pinning a concrete `from` does
  // type the search off `paginationSearchSchema` (verified:
  // `useNavigate<RegisteredRouter, '/albums'>()` compiles), but this hook
  // is shared by `/albums`, `/articles` and `/photos` and cannot pin one.
  const navigate = useNavigate() as unknown as (options: {
    search: (prev: Record<string, unknown>) => Record<string, unknown>;
    viewTransition: boolean;
  }) => void;

  const goToPage = useMemoizedFn((page: number) => {
    navigate({
      search: (prev) => ({ ...prev, page, pageSize }),
      viewTransition: true,
    });
  });

  const handlePageSizeChange = useMemoizedFn((value: string) => {
    const nextPageSize = safeNumber(value, 10);
    navigate({
      search: (prev) => ({ ...prev, page: 1, pageSize: nextPageSize }),
      viewTransition: true,
    });
  });

  return {
    onPageChange: goToPage,
    onPageSizeChange: handlePageSizeChange,
  };
}
