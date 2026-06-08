---
title: ZImageUpload
slug: z-image-upload
---

# ZImageUpload

## 用途

图片上传（OSS 直传）。

## 基础示例

```tsx
import { ZImageUpload } from "@zcat/ui";

<ZImageUpload
  value={urls}
  onChange={setUrls}
  max={5}
/>
```

## 关键 Props

| name | type | default | 说明 |
| --- | --- | --- | --- |
| `value` | `string[]` | — | 已上传 URL |
| `onChange` | `(urls: string[]) => void` | — | 变化回调 |
| `max` | `number` | `1` | 上限 |
| `accept` | `string` | `"image/*"` | MIME |

## 注意事项

- 依赖全局 minio/oss 配置（见 backend .env）
- 上传过程会触发 OSS 直传，前端不流经后端
