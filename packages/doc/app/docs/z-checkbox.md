---
title: ZCheckbox
slug: z-checkbox
---

# ZCheckbox

## 用途

单个或多个复选框。

## 基础示例

```tsx
import { ZCheckbox } from "@zcat/ui";

<ZCheckbox checked={v} onCheckedChange={setV}>
  同意条款
</ZCheckbox>
```

## 关键 Props

| name | type | default | 说明 |
| --- | --- | --- | --- |
| `checked` | `boolean \| "indeterminate"` | — | 受控值 |
| `onCheckedChange` | `(v: boolean) => void` | — | 变化回调 |
| `disabled` | `boolean` | `false` | 禁用 |

## 注意事项

- 受控模式必须同时传 `checked` + `onCheckedChange`
- 嵌套 `<label>` 时点击 label 也会切换
