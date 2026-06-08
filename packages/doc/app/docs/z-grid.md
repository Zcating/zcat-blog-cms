---
title: ZGrid
slug: z-grid
---

# ZGrid

## 用途

响应式栅格。

## 基础示例

```tsx
import { ZGrid } from "@zcat/ui";

<ZGrid cols={{ sm: 1, md: 2, lg: 3 }} gap={4}>
  <Card>A</Card>
  <Card>B</Card>
  <Card>C</Card>
</ZGrid>
```

## 关键 Props

| name | type | 说明 |
| --- | --- | --- |
| `cols` | `{ sm?, md?, lg?, xl? }` | 断点列数 |
| `gap` | `number \| string` | 间距 |

## 注意事项

- 与 Tailwind v4 断点对齐
- 大量项建议虚拟化（见 P1）
