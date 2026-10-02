---
title: ZNavigationMenu
slug: z-navigation-menu
---

# ZNavigationMenu

## 用途

一排导航链接。链接本身由 `renderItem` 交给调用方渲染，组件只负责外层结构和键盘可达性。

## 基础示例

```tsx
import { ZNavigationMenu } from '@zcat/ui';

<ZNavigationMenu
  options={[
    { to: '/', title: '首页' },
    { to: '/about', title: '关于' },
  ]}
  renderItem={(item) => (
    <a href={item.to} className="text-sm">
      {item.title}
    </a>
  )}
/>;
```

高亮当前路由，在 `renderItem` 里自己比较：

```tsx
import { ZNavigationMenu, type LinkOption } from '@zcat/ui';

const options: LinkOption[] = [
  { to: '/', title: '首页' },
  { to: '/about', title: '关于' },
];

function DemoComponent({ pathname }: { pathname: string }) {
  return (
    <ZNavigationMenu
      options={options}
      renderItem={(item) => (
        <a
          href={item.to}
          aria-current={pathname === item.to ? 'page' : undefined}
        >
          {item.title}
        </a>
      )}
    />
  );
}
```

## 关键 props

| name         | type                                             | 说明                                          |
| ------------ | ------------------------------------------------ | --------------------------------------------- |
| `options`    | `LinkOption[]`                                   | 导航项，必传；`{ to: string; title: string }` |
| `renderItem` | `(item: LinkOption, index: number) => ReactNode` | 必传；返回要渲染的链接元素                    |

`LinkOption` 是导出的类型，props 类型本身没有导出（`z-navigation-menu.tsx:8-16`）。

## 注意事项

- `renderItem` 必须返回**恰好一个**能接 ref 和 DOM props 的元素：`NavigationMenuLink` 用了 `asChild`（`z-navigation-menu.tsx:24`），Slot 在子节点不是单个合法元素时直接抛错（`react-slot/dist/index.mjs:35-45`）。`apps/blog` 的 `layout-header.tsx:44-55` 返回的是路由 `Link`，单个元素，照着写最省事
- `key` 用的是数组下标（`z-navigation-menu.tsx:23`），重排 `options` 时留意
- 组件只接受 `options` 和 `renderItem`：没有 `className`、没有 `orientation`、没有 `value` / `onValueChange`。外层样式和排列都改不了，只能靠 `renderItem` 里返回的元素自己控制
- 高亮当前路由要自己在 `renderItem` 里加 `aria-current="page"`。组件从不给 `NavigationMenuLink` 传 `active`，所以 Radix 那套 `data-active` 样式不会触发
- 底层 `NavigationMenu` 的 `viewport` 默认是 `true`（`shadcn/ui/navigation-menu.tsx:11,27`），所以每次都会额外渲染一个视口节点。这个组件从不渲染 `NavigationMenuContent`，视口里始终是空的；它绝对定位、不占布局，通常无害，但也没有 prop 能把它去掉
- 底层是 Radix `NavigationMenu`，键盘可达（方向键 + roving focus）