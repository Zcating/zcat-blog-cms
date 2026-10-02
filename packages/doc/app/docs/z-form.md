---
title: ZForm
slug: z-form
---

# ZForm

## 用途

基于 zod 的受控表单 + 校验。

## 基础示例

```tsx
import { z } from 'zod';
import { createZForm, ZInput, ZButton } from '@zcat/ui';

const ProfileForm = createZForm({ name: z.string().min(2) });

function Profile() {
  const form = ProfileForm.useForm({
    defaultValues: { name: '' },
    onSubmit: (values) => console.log(values),
  });

  return (
    <ProfileForm form={form}>
      <ProfileForm.Item name="name" label="名称">
        <ZInput placeholder="请输入名称" />
      </ProfileForm.Item>
      <ZButton type="submit">提交</ZButton>
    </ProfileForm>
  );
}
```

## 关键 Props

`ZForm` 自身只接收这三个 prop：

| name        | type                | 说明                                    |
| ----------- | ------------------- | --------------------------------------- |
| `form`      | `UseZFormReturn<T>` | `ProfileForm.useForm()` 的返回值，必传  |
| `className` | `string`            | 合并到最外层 `fieldset` 的类名          |
| `children`  | `React.ReactNode`   | 表单内容，通常是一组 `ProfileForm.Item` |

校验规则与初始值都不经过 `ZForm`：`createZForm` 接收字段 shape（或一个 `zod.ZodObject`），`defaultValues` 与 `onSubmit` 是 `ProfileForm.useForm()` 的选项而不是组件的 prop。

## 注意事项

- zod v4 + react-hook-form v7 兼容矩阵见 ui/package.json
- 错误信息 zod 自带中文需自定义 `errorMap`