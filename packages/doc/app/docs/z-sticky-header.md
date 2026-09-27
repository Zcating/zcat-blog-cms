---
title: ZStickyHeader
slug: z-sticky-header
---

# ZStickyHeader

## 用途

吸顶页头。渲染一个语义 `<header>`，吸顶完全靠 CSS `sticky`，没有 JS。

## 基础示例

```tsx
import { ZStickyHeader, ZView } from '@zcat/ui';

<ZStickyHeader>
  <ZView className="flex h-full w-full items-center gap-2 px-4">站点标题</ZView>
</ZStickyHeader>;
```

默认类里已有 `flex` 但没有 `items-center`，垂直居中要自己加：

```tsx
<ZStickyHeader className="items-center">标题</ZStickyHeader>
```

## 关键 props

| name        | type        | 说明                                           |
| ----------- | ----------- | ---------------------------------------------- |
| `children`  | `ReactNode` | 页头内容，必传                                 |
| `className` | `string`    | 经 `cn` 合并在默认类之后，同组冲突的类以它为准 |

默认类固定为 `sticky top-0 z-50 w-full h-header-height bg-background border-b flex`（`z-sticky-header.tsx:13`）。

## 注意事项

- 只有 `className` 和 `children` 两个 prop，没有 `threshold` 之类的滚动阈值——组件不监听滚动，也没有可见性开关
- 旧文档写的「仅在视口可见时启用吸顶，避免 SSR 闪烁」不存在：纯 CSS，没有 SSR 闪烁
- 高度写死 `h-header-height`，即 `--header-height: calc(--spacing(16))`（`index.css:250`）。要改高度就传 `className` 里的 `h-*` 覆盖
- 配套 token 已备好：`top-header-height`、`h-content-height`、`min-h-content-height`（`index.css:254-272`），用来把内容对到页头下面
- `position: sticky` 是相对**最近的可滚动祖先**、且只在**父元素盒子范围内**生效。祖先上如果有 `overflow: hidden`，或者父容器高度就等于页头本身，吸顶不会发生
- `ZStickyHeaderProps` 没有导出，外部拿不到这个 props 类型；`children` 是必传的，渲染不出空壳页头