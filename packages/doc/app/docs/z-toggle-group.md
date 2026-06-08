---
title: ZToggleGroup
slug: z-toggle-group
---

# ZToggleGroup

## 用途

互斥/多选切换组。

## 基础示例

```tsx
import { ZToggleGroup } from "@zcat/ui";

<ZToggleGroup
  type="single"
  value={v}
  onValueChange={setV}
  options={[{ value: "a", label: "A" }, { value: "b", label: "B" }]}
/>
```

## 关键 Props

| name | type | 说明 |
| --- | --- | --- |
| `type` | `"single" \| "multiple"` | 单选/多选 |
| `value` | `string \| string[]` | 受控值 |
| `onValueChange` | `(v) => void` | 变化回调 |
| `options` | `CommonOption<T>[]` | 选项 |

## 注意事项

- 单选时 `value: string`，多选时 `value: string[]`
- 透传 Radix ToggleGroup，键盘可达
