import { ZPagination } from '@zcat/ui';
import type { Route } from './+types/pagination-page';
import { useState } from 'react';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Pagination - @zcat/ui' },
    { name: 'description', content: 'Pagination component documentation' },
  ];
}

export default function PaginationPage() {
  const [page, setPage] = useState(1);
  const [page2, setPage2] = useState(1);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Pagination 分页</h1>
        <p className="text-muted-foreground">用于内容过长时进行分页加载。</p>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">Basic Usage</h2>
        <div className="flex flex-col gap-4">
          <ZPagination page={page} totalPages={10} onPageChange={setPage} />
          <div className="text-sm text-muted-foreground">
            Current Page: {page}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">With Ellipsis</h2>
        <div className="flex flex-col gap-4">
          <ZPagination page={page2} totalPages={20} onPageChange={setPage2} />
          <div className="text-sm text-muted-foreground">
            Current Page: {page2}
          </div>
        </div>
      </div>
    </div>
  );
}
