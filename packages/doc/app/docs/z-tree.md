---
title: ZTree
slug: z-tree
---

# ZTree

## 用途

树形结构展示与单选。数据走 `options`，节点类型是 `CascaderOption`。

## 基础示例

```tsx
import { ZTree } from '@zcat/ui';

<ZTree
  options={[
    {
      value: 'root',
      label: '根',
      children: [{ value: 'child', label: '子' }],
    },
  ]}
/>;
```

默认全展开 + 选择：

```tsx
import { useState } from 'react';
import { ZTree } from '@zcat/ui';

function DemoComponent() {
  const [picked, setPicked] = useState('');

  return (
    <div className="space-y-2">
      <ZTree
        defaultExpandAll
        options={[
          {
            value: 'root',
            label: '根',
            children: [{ value: 'child', label: '子' }],
          },
        ]}
        onSelect={(value) => setPicked(value)}
      />
      <p className="text-sm text-muted-foreground">已选: {picked}</p>
    </div>
  );
}
```

## 关键 props

| name               | type                                            | default | 说明                                                             |
| ------------------ | ----------------------------------------------- | ------- | ---------------------------------------------------------------- |
| `options`          | `CascaderOption<T>[]`                           | —       | 树数据，必传；`{ value, label, children? }`，`label` 是 `string` |
| `onSelect`         | `(value: T, option: CascaderOption<T>) => void` | —       | 点击节点时回调，传的是**单个**值和该节点                         |
| `defaultExpandAll` | `boolean`                                       | `false` | 初始是否全展开                                                   |
| `className`        | `string`                                        | —       | 根容器类名                                                       |

`T` 默认是 `string`，可以显式指定成 `number`（组件签名是 `ZTree<T extends string \| number = string>`）。

## 注意事项

- 属性名是 `options` 不是 `data`，也没有 `TreeNode` 这个导出类型，用的是 `CascaderOption`
- 没有 `expandLevel`：展开粒度只有「全展开 / 全折叠」这一档（`z-tree.tsx:28,122`）
- 没有 `loadChildren`，也没有任何懒加载入口。子节点在数据里就得全给，组件会一次性渲染
- 展开状态是每个节点内部的 `useState`，不受控：没有 `expandedKeys` / `onExpand`，也改不了单个节点
- 传了 `onSelect` 时，点父节点整行是**选中**而不是展开，展开要点小箭头；不传 `onSelect` 时点整行才是展开（`z-tree.tsx:43-52,92-97`）
- 内容用 `ZCollapsible` 的 `forceMount`，折叠的子节点仍在 DOM 里
- 没有虚拟滚动，节点多时自行分页或只渲染浅层