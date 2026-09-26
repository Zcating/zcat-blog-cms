import { useNavigate } from '@tanstack/react-router';
import { safeNumber, useMemoizedFn } from '@zcat/ui';

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
