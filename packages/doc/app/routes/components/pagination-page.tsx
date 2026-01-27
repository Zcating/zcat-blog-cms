import { useConstant, ZMarkdown } from '@zcat/ui';

import { ExecutableCodeBlock } from '~/features';

export function meta() {
  return [
    { title: 'Pagination - @zcat/ui' },
    { name: 'description', content: 'Pagination component documentation' },
  ];
}

const exampleContent = `
# Pagination 分页

用于内容过长时进行分页加载。

## Basic Usage

\`\`\`typescript-demo
import { ZPagination } from '@zcat/ui';

export function DemoComponent() {
  const [page, setPage] = useState(1);

  return (
    <div className="flex flex-col gap-4">
      <ZPagination page={page} totalPages={10} onPageChange={setPage} />
      <div className="text-sm text-muted-foreground">Current Page: {page}</div>
    </div>
  );
}
\`\`\`

## With Ellipsis

\`\`\`typescript-demo
import { ZPagination } from '@zcat/ui';

export function DemoComponent() {
  const [page, setPage] = useState(1);

  return (
    <div className="flex flex-col gap-4">
      <ZPagination page={page} totalPages={20} onPageChange={setPage} />
      <div className="text-sm text-muted-foreground">Current Page: {page}</div>
    </div>
  );
}
\`\`\`

## API

| Attribute | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| page | number | - | 当前页码（从 1 开始） |
| totalPages | number | - | 总页数 |
| onPageChange | (page: number) => void | - | 页码改变回调 |
| getHref | (page: number) => string | - | 生成页码链接的方法 |
| className | string | - | 自定义类名 |
`;

export default function PaginationPage() {
  return (
    <ZMarkdown
      className="pb-40"
      content={exampleContent}
      customCodeComponents={useConstant(() => ({
        'typescript-demo': ExecutableCodeBlock,
      }))}
    />
  );
}
