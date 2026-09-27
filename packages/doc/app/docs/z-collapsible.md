---
title: ZCollapsible
slug: z-collapsible
---

# ZCollapsible

## 用途

可折叠内容区。单个组件，触发器走 `trigger` prop，不是子组件。

## 基础示例

```tsx
import { ZCollapsible } from '@zcat/ui';

<ZCollapsible trigger={<span>展开</span>}>
  <p>内容区域</p>
</ZCollapsible>;
```

受控模式：

```tsx
import { ZCollapsible } from '@zcat/ui';
import { useState } from 'react';

function DemoComponent() {
  const [open, setOpen] = useState(false);

  return (
    <ZCollapsible
      open={open}
      onOpenChange={setOpen}
      trigger={<span>展开</span>}
    >
      <p>内容区域</p>
    </ZCollapsible>
  );
}
```

## 关键 props

| name               | type                      | default | 说明                               |
| ------------------ | ------------------------- | ------- | ---------------------------------- |
| `trigger`          | `ReactNode`               | —       | 触发器内容，组件不给箭头图标，自备 |
| `children`         | `ReactNode`               | —       | 折叠内容                           |
| `open`             | `boolean`                 | —       | 受控开关；传了它就是受控           |
| `onOpenChange`     | `(open: boolean) => void` | —       | 切换回调，受控非受控都触发         |
| `defaultOpen`      | `boolean`                 | `false` | 非受控初始值                       |
| `className`        | `string`                  | —       | 根元素类名，合并在 `w-full` 之后   |
| `triggerClassName` | `string`                  | —       | 触发器类名                         |
| `contentClassName` | `string`                  | —       | 内容容器类名                       |

## 注意事项

- 没有 `ZCollapsible.Trigger` / `ZCollapsible.Content` 这类子组件，props 里也没有；旧写法不存在
- 传了 `open`（哪怕是 `false`）就是受控，内部 state 不再更新，必须自己改 `open`（`z-collapsible.tsx:57-65`）
- 内容是 `forceMount` 的，折叠时子节点仍在 DOM 里，只是被 `FoldAnimation` 隐藏（`z-collapsible.tsx:77-82`）。要按展开态挂载请自己条件渲染
- 没有 `disabled` prop，触发器始终可点。想在某些状态下禁止交互，只能自己在 `trigger` 里渲染一个 `disabled` 的元素