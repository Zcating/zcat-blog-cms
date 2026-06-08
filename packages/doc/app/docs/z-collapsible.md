---
title: ZCollapsible
slug: z-collapsible
---

# ZCollapsible

## 用途

可折叠内容区。

## 基础示例

```tsx
import { ZCollapsible } from "@zcat/ui";

<ZCollapsible>
  <ZCollapsible.Trigger>展开</ZCollapsible.Trigger>
  <ZCollapsible.Content>详情</ZCollapsible.Content>
</ZCollapsible>
```

## 关键 Props

| name | type | 说明 |
| --- | --- | --- |
| `open` | `boolean` | 受控开关 |
| `onOpenChange` | `(v: boolean) => void` | 切换回调 |
| `defaultOpen` | `boolean` | 非受控初始 |

## 注意事项

- 复用 Radix Collapsible，支持键盘
- 大量内容时配动画时长
