import { ZPagination } from '@zcat/ui';
import { useState } from 'react';

import type { Route } from './+types/pagination-page';

export function meta(_: Route.MetaArgs) {
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

      <div className="space-y-6">
        <h2 className="text-2xl font-semibold tracking-tight">API 参考</h2>
        <div className="rounded-md border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="h-10 px-4 text-left font-medium">属性</th>
                <th className="h-10 px-4 text-left font-medium">类型</th>
                <th className="h-10 px-4 text-left font-medium">默认值</th>
                <th className="h-10 px-4 text-left font-medium">说明</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="p-4 font-mono">page</td>
                <td className="p-4 font-mono text-muted-foreground">number</td>
                <td className="p-4 font-mono text-muted-foreground">-</td>
                <td className="p-4">当前页码（从 1 开始）</td>
              </tr>
              <tr className="border-b">
                <td className="p-4 font-mono">totalPages</td>
                <td className="p-4 font-mono text-muted-foreground">number</td>
                <td className="p-4 font-mono text-muted-foreground">-</td>
                <td className="p-4">总页数</td>
              </tr>
              <tr className="border-b">
                <td className="p-4 font-mono">onPageChange</td>
                <td className="p-4 font-mono text-muted-foreground">
                  (page: number) =&gt; void
                </td>
                <td className="p-4 font-mono text-muted-foreground">-</td>
                <td className="p-4">页码改变回调</td>
              </tr>
              <tr className="border-b">
                <td className="p-4 font-mono">getHref</td>
                <td className="p-4 font-mono text-muted-foreground">
                  (page: number) =&gt; string
                </td>
                <td className="p-4 font-mono text-muted-foreground">-</td>
                <td className="p-4">生成页码链接的方法</td>
              </tr>
              <tr>
                <td className="p-4 font-mono">className</td>
                <td className="p-4 font-mono text-muted-foreground">string</td>
                <td className="p-4 font-mono text-muted-foreground">-</td>
                <td className="p-4">自定义类名</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
