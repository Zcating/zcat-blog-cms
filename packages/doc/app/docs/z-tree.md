---
title: ZTree
slug: z-tree
---

# ZTree

## 用途

树形结构展示与选择。

## 基础示例

```tsx
import { ZTree } from "@zcat/ui";

<ZTree
  data={[
    { id: 1, label: "根", children: [{ id: 2, label: "子" }] },
  ]}
  onSelect={(ids) => console.log(ids)}
/>
```

## 关键 Props

| name | type | 说明 |
| --- | --- | --- |
| `data` | `TreeNode[]` | 数据 |
| `onSelect` | `(ids: string[]) => void` | 选择回调 |
| `expandLevel` | `number` | 默认展开层级 |

## 注意事项

- 异步懒加载子节点用 `loadChildren`
- 大量节点建议配虚拟滚动
