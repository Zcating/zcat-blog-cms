---
title: ZToggleGroup
slug: z-toggle-group
---

# ZToggleGroup

## 用途

互斥 / 多选切换组。选项写在 `options` 里必传，组件自己渲染 `ToggleGroupItem`。

## 基础示例

单选：

```tsx
import { ZToggleGroup } from '@zcat/ui';

<ZToggleGroup
  type="single"
  options={[
    { value: 'a', label: 'A' },
    { value: 'b', label: 'B' },
  ]}
/>;
```

受控：

```tsx
import { useState } from 'react';
import { ZToggleGroup } from '@zcat/ui';

function DemoComponent() {
  const [mode, setMode] = useState('a');

  return (
    <ZToggleGroup
      type="single"
      value={mode}
      onValueChange={setMode}
      options={[
        { value: 'a', label: '预览' },
        { value: 'b', label: '源码' },
      ]}
    />
  );
}
```

## 关键 props

| name            | type                              | default        | 说明                                                    |
| --------------- | --------------------------------- | -------------- | ------------------------------------------------------- |
| `options`       | `CommonOption<T>[]`               | —              | 选项，必传；`{ value, label }`，`label` 是 `ReactNode`  |
| `type`          | `'single' \| 'multiple'`          | —              | 单选 / 多选，必传                                       |
| `value`         | `string \| string[]`              | —              | 受控值，`single` 是 `string`，`multiple` 是 `string[]`  |
| `defaultValue`  | 同上                              | —              | 非受控初始值                                            |
| `onValueChange` | `(v: string \| string[]) => void` | —              | 变化回调                                                |
| `disabled`      | `boolean`                         | `false`        | 整组禁用                                                |
| `orientation`   | `'horizontal' \| 'vertical'`      | `'horizontal'` | 传给 RovingFocusGroup，决定方向键切换的轴，不是布局方向 |
| `variant`       | `'default' \| 'outline'`          | `'outline'`    | 写在展开之前，可覆盖                                    |
| `className`     | `string`                          | —              | 根元素类名                                              |

`ref` 透传到根 `<div>`（`HTMLDivElement`），其余 `React.ComponentProps<typeof ToggleGroup>` 原样转发。

## 注意事项

- `options` 与 `type` 都必传；`options` 少传就是缺 prop，不是空组
- `label` 是 `ReactNode`（全局 `CommonOption` 声明），可以放图标或自定义节点，不只是字符串
- 默认 `variant="outline"`，且写在 `{...props}` 之前（`z-toggle-group.tsx:14`），所以传 `variant` 能覆盖
- `onValueChange` 在 `single` 模式下再次点当前项会回调空字符串，用来表示「取消选中」
- `key` 用的是数组下标（`z-toggle-group.tsx:16`），重排 `options` 时要留意子项状态
- 底层是 Radix，键盘可达（方向键 + roving focus）