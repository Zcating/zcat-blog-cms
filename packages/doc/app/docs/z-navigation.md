---
title: ZNavigation
slug: z-navigation
---

# ZNavigation

## 用途

顶部或侧边导航菜单。

## 基础示例

```tsx
import { ZNavigation } from "@zcat/ui";

<ZNavigation
  items={[
    { label: "首页", href: "/" },
    { label: "关于", href: "/about" },
  ]}
/>
```

## 关键 Props

| name | type | 说明 |
| --- | --- | --- |
| `items` | `NavItem[]` | 导航项 |
| `orientation` | `"horizontal" \| "vertical"` | 方向 |

## 注意事项

- 复用 Radix NavigationMenu 底层，键盘可达
- 当前路由可加 `aria-current="page"` 标记
