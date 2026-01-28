import { ZPagination, ZSelect, ZView } from '@zcat/ui';

import { PAGE_SIZE_OPTIONS, usePaginationAction } from '@cms/core/hooks';

import { Workspace, type WorkspaceProps } from './workspace';

interface PaginationWorkspaceProps extends WorkspaceProps {
  pageSize: number;
  totalPages: number;
  page: number;
}

export function PaginationWorkspace({
  children,
  pageSize,
  totalPages,
  page,
  ...props
}: PaginationWorkspaceProps) {
  const { onPageChange, onPageSizeChange } = usePaginationAction(pageSize);

  return (
    <Workspace {...props}>
      {children}
      <ZView className="mt-4 flex items-center justify-end gap-4">
        <ZSelect
          value={pageSize.toString()}
          options={PAGE_SIZE_OPTIONS}
          onValueChange={onPageSizeChange}
          className="w-40"
        />
        <ZPagination
          page={page}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />
      </ZView>
    </Workspace>
  );
}
