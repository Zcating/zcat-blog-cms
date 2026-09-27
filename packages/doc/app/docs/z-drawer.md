---
title: ZDrawer
slug: z-drawer
---

# ZDrawer

## 用途

命令式抽屉。它不是组件，没有 JSX 标签，只有 `ZDrawer.show()` 一个方法。

## 基础示例

```tsx
import { ZButton, ZDrawer } from '@zcat/ui';

function DemoComponent() {
  return (
    <ZButton
      onClick={() =>
        ZDrawer.show({
          title: '详情',
          description: '来自抽屉',
          content: <p>抽屉内容</p>,
        })
      }
    >
      打开抽屉
    </ZButton>
  );
}
```

内容与页脚可以拿到 `onClose` 自己关：

```tsx
ZDrawer.show({
  direction: 'right',
  content: ({ onClose }) => <ZButton onClick={onClose}>关闭</ZButton>,
  footer: ({ onClose }) => <ZButton onClick={onClose}>确定</ZButton>,
});
```

`show()` 返回一个句柄，可以从外部关掉：

```tsx
const drawer = ZDrawer.show({ content: '加载中' });
drawer.close();
```

## 关键 props

`ZDrawer.show(props)` 的入参 `ZDrawerContentProps`：

| name                        | type                                         | default    | 说明                     |
| --------------------------- | -------------------------------------------- | ---------- | ------------------------ |
| `content`                   | `ReactNode \| (p: { onClose }) => ReactNode` | —          | 抽屉内容                 |
| `direction`                 | `'top' \| 'bottom' \| 'left' \| 'right'`     | `'bottom'` | 弹出方向                 |
| `title`                     | `ReactNode`                                  | —          | 标题                     |
| `description`               | `ReactNode`                                  | —          | 描述                     |
| `footer`                    | `(p: { onClose }) => ReactNode`              | —          | 页脚                     |
| `contentContainerClassName` | `string`                                     | —          | `DrawerContent` 容器类名 |
| `onClose`                   | `() => void`                                 | —          | 关闭并销毁后触发         |

## 注意事项

- 没有 `open` / `onOpenChange` / `side` prop，也没有 `ZDrawer.Body` 子组件：整个组件就是一个 `show` 方法（`z-drawer.tsx:64-70`）
- `show()` 在调用时创建 portal 和独立的 React root 并挂到 `document.body`（`z-drawer.tsx:12-27`）。它摸 `document`，只能在客户端事件回调里调，不能在渲染期间调
- `onClose` 在关闭动画开始后约 350ms 才触发，容器随后被销毁（`z-drawer-container.tsx:74-81`）。要做清理就别假设它同步
- 方向默认是 `bottom`，不是 `right`（`z-drawer-container.tsx:99`）
- 底层是 Vaul（触摸设备可拖拽）；每次 `show` 都是独立的一层，嵌套时 z-index 依次叠加
- 组件不处理加载态与错误态，`content` 传函数时自己渲染