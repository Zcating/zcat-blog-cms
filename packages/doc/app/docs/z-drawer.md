---
title: ZDrawer
slug: z-drawer
---

# ZDrawer

## 用途

侧滑抽屉。

## 基础示例

```tsx
import { ZDrawer } from "@zcat/ui";

<ZDrawer open={open} onOpenChange={setOpen} side="right">
  <Drawer.Body>详情</Drawer.Body>
</ZDrawer>
```

## 关键 Props

| name | type | default | 说明 |
| --- | --- | --- | --- |
| `open` | `boolean` | — | 受控 |
| `onOpenChange` | `(v: boolean) => void` | — | 切换 |
| `side` | `"left" \| "right" \| "top" \| "bottom"` | `"right"` | 方位 |

## 注意事项

- 基于 Vaul，触摸设备支持拖拽
- 嵌套抽屉注意 z-index 叠加
