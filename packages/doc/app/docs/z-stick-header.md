---
title: ZStickHeader
slug: z-stick-header
---

# ZStickHeader

## 用途

滚动时吸顶的页头。

## 基础示例

```tsx
import { ZStickHeader } from "@zcat/ui";

<ZStickHeader>
  <h1>标题</h1>
</ZStickHeader>
```

## 关键 Props

| name | type | 说明 |
| --- | --- | --- |
| `threshold` | `number` | 滚动阈值 px |
| `className` | `string` | 容器类名 |

## 注意事项

- 仅在视口可见时启用吸顶，避免 SSR 闪烁
