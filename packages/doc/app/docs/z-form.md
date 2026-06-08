---
title: ZForm
slug: z-form
---

# ZForm

## 用途

基于 zod 的受控表单 + 校验。

## 基础示例

```tsx
import { z } from "zod";
import { createZForm, ZInput } from "@zcat/ui";

const schema = z.object({ name: z.string().min(2) });
const form = createZForm({ schema });

<form.Form>
  <ZInput {...form.register("name")} />
  <ZButton type="submit">提交</ZButton>
</form.Form>
```

## 关键 Props

| name | type | 说明 |
| --- | --- | --- |
| `schema` | `ZodSchema<T>` | 校验规则 |
| `defaultValues` | `Partial<T>` | 初始值 |
| `onSubmit` | `(v: T) => void \| Promise<void>` | 提交回调 |

## 注意事项

- zod v4 + react-hook-form v7 兼容矩阵见 ui/package.json
- 错误信息 zod 自带中文需自定义 `errorMap`
