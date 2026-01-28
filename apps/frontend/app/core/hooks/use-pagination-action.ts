import { safeNumber, useMemoizedFn } from '@zcat/ui';
import { createSearchParams, useNavigate } from 'react-router';

interface UsePaginationReturn {
  onPageChange: (page: number) => void;
  onPageSizeChange: (value: string) => void;
}

export const PAGE_SIZE_OPTIONS = [
  { value: '10', label: '每页 10 条' },
  { value: '20', label: '每页 20 条' },
  { value: '50', label: '每页 50 条' },
];

export function usePaginationAction(pageSize: number): UsePaginationReturn {
  const navigate = useNavigate();

  const toSearch = (nextPage: number, nextPageSize: number) =>
    `?${createSearchParams({
      page: String(nextPage),
      pageSize: String(nextPageSize),
    })}`;

  const goToPage = useMemoizedFn((page: number) => {
    navigate(toSearch(page, pageSize), { viewTransition: true });
  });

  const handlePageSizeChange = useMemoizedFn((value: string) => {
    const nextPageSize = safeNumber(value, 10);
    navigate(toSearch(1, nextPageSize), { viewTransition: true });
  });

  return {
    onPageChange: goToPage,
    onPageSizeChange: handlePageSizeChange,
  };
}
