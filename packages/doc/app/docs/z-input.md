---
title: ZInput
slug: z-input
---

# ZInput

## 用途

基础文本输入。

## 基础示例

```tsx
import { ZInput } from '@zcat/ui';

<ZInput placeholder="标题" value={v} onValueChange={setV} />;
```

## 关键 Props

| name            | type                      | default | 说明                                 |
| --------------- | ------------------------- | ------- | ------------------------------------ |
| `value`         | `string`                  | —       | 受控值                               |
| `onValueChange` | `(value: string) => void` | —       | 值级变化回调，参数是值本身           |
| `onBlur`        | `(e: FocusEvent) => void` | —       | 焦点通道，保留：失焦时触发，不上报值 |
| `placeholder`   | `string`                  | —       | 占位                                 |
| `disabled`      | `boolean`                 | `false` | 禁用                                 |

## 注意事项

- 值级通道只有 `onValueChange`：`onChange` 与 `onInput` 均不接受，类型与运行时都不转发
- `onBlur` 不属于变更通道，因此保留：`ZFormItem` 注入它供 react-hook-form 记录 touched 态