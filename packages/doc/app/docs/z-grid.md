---
title: ZGrid
slug: z-grid
---

# ZGrid

## 用途

等宽栅格。数据在 `items` 里，渲染交给 `renderItem`，不接 `children`。

## 基础示例

```tsx
import { Skeleton, ZGrid } from '@zcat/ui';

<ZGrid
  cols={3}
  items={Array.from({ length: 9 }, (_, index) => index)}
  renderItem={() => <Skeleton className="w-full aspect-3/2 rounded-md" />}
/>;
```

## 关键 props

| name              | type                                                      | default          | 说明                     |
| ----------------- | --------------------------------------------------------- | ---------------- | ------------------------ |
| `cols`            | `number`                                                  | `2`              | 每行列数，运行时兜底为 2 |
| `items`           | `T[]`                                                     | —                | 数据，必传               |
| `renderItem`      | `(item: T) => ReactNode`                                  | —                | 单项渲染，必传           |
| `renderEmpty`     | `() => ReactNode`                                         | 渲染「暂无数据」 | `items` 为空时渲染       |
| `rowGap`          | `'sm' \| 'md' \| 'lg' \| 'xl' \| '2xl' \| '3xl' \| '4xl'` | `'sm'`           | 行间距                   |
| `columnGap`       | 同上                                                      | `'sm'`           | 列间距                   |
| `className`       | `string`                                                  | —                | 外层容器类名             |
| `columnClassName` | `string`                                                  | —                | 每一行容器类名           |
| `rowClassName`    | `string`                                                  | —                | 每个格子类名             |

## 注意事项

- `cols` 只是一个数字，没有响应式断点对象：旧文档写的 `cols={{ sm: 1, md: 2 }}` 不存在（`z-grid.tsx:27`）。要响应式就按断点在外层切 `cols`
- 间距是枚举字符串，不是 `gap={4}`：不传时基础类是 `gap-4`，`sm` 就是 `gap-4`，`lg` 是 `gap-12`（`z-grid.tsx:7-19`）
- 末行不足 `cols` 时用空格子补齐，保证每行等宽（`z-grid.tsx:39-48`）
- 每个格子外面套了一层 `<div className="flex-1">`，所以子项要撑满得自己写 `w-full`
- 默认空态是一个 500px 高的「暂无数据」，太占地方就用 `renderEmpty` 换掉
- 没有虚拟滚动，节点多时自行分页