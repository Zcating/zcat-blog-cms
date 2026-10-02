---
title: ZCheckbox
slug: z-checkbox
---

# ZCheckbox

## 用途

布尔复选框。值级通道是 `onValueChange`，与 `ZInput` / `ZTextarea` 一致。

## 基础示例

在 `ZForm` 里当布尔字段用：

```tsx
import { z } from 'zod';
import { createZForm, ZButton, ZCheckbox } from '@zcat/ui';

const TermsForm = createZForm({ agreed: z.boolean() });

function DemoComponent() {
  const form = TermsForm.useForm({
    defaultValues: { agreed: false },
    onSubmit: (values) => console.log(values),
  });

  return (
    <TermsForm form={form}>
      <TermsForm.Item name="agreed" label="同意条款">
        <ZCheckbox />
      </TermsForm.Item>
      <ZButton type="submit">提交</ZButton>
    </TermsForm>
  );
}
```

不传 `value` 时由 Radix 自己管状态：

```tsx
import { ZCheckbox } from '@zcat/ui';

<ZCheckbox defaultChecked disabled />;
```

## 关键 props

| name            | type                                    | default | 说明                                               |
| --------------- | --------------------------------------- | ------- | -------------------------------------------------- |
| `value`         | `boolean`                               | —       | 受控值；不传则走 `defaultChecked` 非受控           |
| `onValueChange` | `(checked: boolean) => void`            | —       | 值级通道，参数是布尔值                             |
| `onBlur`        | `(e: FocusEvent) => void`               | —       | 焦点通道，透传到 DOM                               |
| `disabled`      | `boolean`                               | `false` | 禁用                                               |
| `required`      | `boolean`                               | `false` | 必填，配合 `name` 输出隐藏 input                   |
| 其余            | `React.ComponentProps<typeof Checkbox>` | —       | `className` / `name` / `id` / `onClick` 等原样透传 |

## 注意事项

- 值级通道只有 `onValueChange`：`onChange` 与 `onInput` 都不在 props 类型上，`onInput` 还会在运行时被剔除（`z-checkbox.tsx:15`）
- 组件把自己的 `checked` / `onCheckedChange` 写在展开之后（`z-checkbox.tsx:20-26`），调用方传的同名 prop 不生效
- `onValueChange` 只收到布尔值：Radix 的 `"indeterminate"` 被折成 `false`（`z-checkbox.tsx:24`）
- 组件不渲染文案。`Checkbox` 内部写死了对勾 indicator 作为唯一子节点（`shadcn/ui/checkbox.tsx:20-26`），传 `children` 会顶掉它。标签请用 `Form.Item` 的 `label`，它通过 `htmlFor` / `id` 关联控件
- `value` 是布尔受控值，不是 HTML `value`：`ZCheckboxProps` 已把 Radix 的 `value` 从类型里剔掉（`z-checkbox.tsx:6-12`）。要随原生表单提交就配 `name`，在 `ZForm` 里声明成 `z.boolean()`