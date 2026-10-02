# Pagination 分页

## 用途

用于内容过长时进行分页加载。

## 基础示例

```typescript-demo
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
```

`totalPages > 7` 时中间页码会自动折叠成省略号，没有单独的开关 prop：

```typescript-demo
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
```

## 关键 props

| Attribute    | Type                     | Default | Description           |
| :----------- | :----------------------- | :------ | :-------------------- |
| page         | number                   | -       | 当前页码（从 1 开始） |
| totalPages   | number                   | -       | 总页数                |
| onPageChange | (page: number) => void   | -       | 页码改变回调          |
| getHref      | (page: number) => string | -       | 生成页码链接的方法    |
| className    | string                   | -       | 自定义类名            |

## 注意事项

- `totalPages` 为 `1`（结果一页就装得下）时组件返回 `null`，分页栏完全不渲染，调用方不用再自己包一层 `totalPages > 1`（`z-pagination.tsx:104-106`）
- `totalPages` 为 `0` 时同样不渲染，这就是后端空列表返回的形状：`Math.ceil(0 / pageSize)` 等于 `0`（`paginate-query.schema.ts:38`）
- 判断条件是 `!(totalPages > 1)`，所以 `NaN`、`Infinity`、负数也一律不渲染，不会退化成上下页都点不动的死控件（`z-pagination.tsx:104`）
- `page` 会被归一化到 `[1, totalPages]`：非法值（`NaN`、`≤ 0`）按 `1` 处理，超界则 clamp 到边界（`z-pagination.tsx:88-92`，调用点 `z-pagination.tsx:111`）
- 首页的「上一页」、末页的「下一页」不是 `disabled`，只是加 `pointer-events-none opacity-50`，且点击处理函数在边界直接 `return`、不回调页码；元素本身仍可聚焦，不传 `onPageChange` 时按回车会照常走 `href`（`z-pagination.tsx:143-150`、`z-pagination.tsx:157-164`、`z-pagination.tsx:188`、`z-pagination.tsx:219`）