---
title: ZInput
slug: z-input
---

# ZInput

## 用途

基础文本输入。

## 基础示例

```tsx
import { ZInput } from "@zcat/ui";

<ZInput placeholder="标题" value={v} onChange={(e) => setV(e.target.value)} />
```

## 关键 Props

| name | type | default | 说明 |
| --- | --- | --- | --- |
| `value` | `string` | — | 受控值 |
| `onChange` | `(e: ChangeEvent) => void` | — | 变化回调 |
| `placeholder` | `string` | — | 占位 |
| `disabled` | `boolean` | `false` | 禁用 |

## 注意事项

- 不直接接 `onValueChange`；按 shadcn Input 习惯用 `onChange`
