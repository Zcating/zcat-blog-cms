---
title: ZImageUpload
slug: z-image-upload
---

# ZImageUpload

## 用途

单张图片选择器。选完只回一个本地 blob URL，**不发起任何上传请求**。有图时方框右上角会出现一个移除按钮，点它回一个空串。

## 基础示例

```tsx
import { useState } from 'react';
import { ZImageUpload } from '@zcat/ui';

function DemoComponent() {
  const [url, setUrl] = useState('');

  return (
    <div className="space-y-2">
      <ZImageUpload value={url} onChange={setUrl} />
      <p className="text-sm text-muted-foreground break-all">{url}</p>
    </div>
  );
}
```

只收 png / jpeg，放宽类型：

```tsx
import { ZImageUpload } from '@zcat/ui';

<ZImageUpload
  types={['image/png', 'image/jpeg', 'image/webp']}
  accept="image/*"
/>;
```

## 关键 props

| name        | type                                              | default                       | 说明                                   |
| ----------- | ------------------------------------------------- | ----------------------------- | -------------------------------------- |
| `value`     | `string`                                          | `''`                          | 当前图片 URL，非受控时用内部 state     |
| `onChange`  | `(url: string) => void`                           | —                             | 选中图片回调 blob URL，点移除回调 `''` |
| `onBlur`    | `(e: React.FocusEvent<HTMLInputElement>) => void` | —                             | 焦点通道，挂在隐藏 input 上            |
| `accept`    | `string`                                          | `'image/*'`                   | **只影响文件选择器的过滤提示**         |
| `types`     | `string[]`                                        | `['image/png', 'image/jpeg']` | 真正的 MIME 白名单，不在表内直接丢弃   |
| `disabled`  | `boolean`                                         | `false`                       | 禁用，同时禁用隐藏 input               |
| `className` | `string`                                          | —                             | 外层容器类名                           |

## 注意事项

- 没有 `max` prop，也不支持多选：一次一张，`value` 是单个 `string` 不是 `string[]`（`z-image-upload.tsx:11-19`）
- 没有 OSS 直传，也不依赖后端配置。回调里拿到的是 `URL.createObjectURL(file)`（`z-image-upload.tsx:53`），blob URL 随文档失效。真要上传得自己在这个回调里把文件传给后端
- `accept` 和 `types` 是两套东西：默认 `accept="image/*"` 会让选择器显示全部图片，但 `types` 仍然只放行 png/jpeg，其余被静默丢弃、连报错都没有（`z-image-upload.tsx:51`）
- `onChange` 每次选中只回调一次，参数是新的 blob URL：`handleChange` 只调 `setImageUrl(url)`（`z-image-upload.tsx:54`），由 `usePropsValue` 统一通知（`use-props-value.ts:29`）。受控与非受控都是一次，可以放心在里面计数或触发副作用
- 点移除按钮是同样的一次回调，参数换成 `''`，上面的计数逻辑不用改：`handleRemove` 走同一个 `setImageUrl('')`（`z-image-upload.tsx:62`）。受控模式下记得把 `''` 写回 state，否则图片不会消失
- 被 `types` 挡下的文件不回调：没有文件或 MIME 不匹配时直接 return，`onChange` 一次都不会触发（`z-image-upload.tsx:50-51`）。要做「用户选了张非法图」的提示得自己加
- 同一张图可以重复选：每次 change 前都会把 input 的 value 清空（`z-image-upload.tsx:49`）
- 移除按钮只在有值时渲染，空状态没有这个按钮（`z-image-upload.tsx:83`）。它是真正的 `<button type="button">`，`aria-label="移除图片"`，键盘能 Tab 到、Enter / Space 都能触发
- 点移除不会顺带弹文件选择器：`handleRemove` 第一行就 `e.stopPropagation()`（`z-image-upload.tsx:58`），把事件拦在那个负责 `onClick={handlePick}` 的外层 div（`z-image-upload.tsx:72`）之前。少了这句，点一下会同时打开文件框
- 移除按钮常驻可见，只是弱一点（`opacity-70`），悬停方框或键盘聚焦时升到 `opacity-100`（`z-image-upload.tsx:96`）。没有用 `opacity-0` + `pointer-events-none` 藏起来，所以读屏和键盘用户不会错过它
- `disabled` 时移除按钮照常渲染但是禁用态，点不动、也不会回调（`z-image-upload.tsx:94`）
- blob URL 不会 revoke，组件反复换图会持续泄漏；点移除也不会帮你 revoke。用完自己 `URL.revokeObjectURL`
- 无加载态与错误态：真实上传要接后端，失败提示得自己加